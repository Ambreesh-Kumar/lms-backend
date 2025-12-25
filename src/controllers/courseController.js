import asyncHandler from "../utils/AsyncHandler.js";
import ApiError from "../utils/ApiError.js";
import { Course } from "../models/Course.js";
import { uploadToCloudinary } from "../utils/cloudinaryUpload.js";
import deleteFromCloudinary from "../utils/cloudinaryDelete.js";
import mongoose from "mongoose";

export const createCourse = asyncHandler(async (req, res) => {
  const { title, description, category, price, level } = req.body;
  const file = req.file;

  if (!title || !description || !category || price === undefined) {
    throw new ApiError(400, "All required fields must be provided");
  }

  if (price < 0) {
    throw new ApiError(400, "Course price cannot be negative");
  }

  if (file && !file.mimetype.startsWith("image/")) {
    throw new ApiError(400, "Only image files are allowed as thumbnails");
  }

  let thumbnailUrl = "";
  let thumbnailPublicId = "";

  if (file) {
    try {
      const cloudRes = await uploadToCloudinary(
        file.buffer,
        "courses_thumbnails"
      );
      thumbnailUrl = cloudRes.secure_url;
      thumbnailPublicId = cloudRes.public_id;
    } catch (error) {
      throw new ApiError(500, "Thumbnail upload failed");
    }
  }

  const course = await Course.create({
    instructor: req.user._id,
    title,
    description,
    category,
    price,
    level,
    thumbnail: thumbnailUrl,
    thumbnailPublicId,
  });

  res.status(201).json({
    success: true,
    message: "Course created successfully",
    data: course,
  });
});

export const updateCourse = asyncHandler(async (req, res) => {
  const { courseId } = req.params;
  const { title, description, category, price, level } = req.body;
  const file = req.file;

  // No update data provided
  if (
    file === undefined &&
    title === undefined &&
    description === undefined &&
    category === undefined &&
    price === undefined &&
    level === undefined
  ) {
    throw new ApiError(400, "No data provided to update");
  }

  // Validate course id
  if (!mongoose.Types.ObjectId.isValid(courseId)) {
    throw new ApiError(400, "Invalid course id");
  }

  const course = await Course.findById(courseId);

  if (!course) {
    throw new ApiError(404, "Course not found");
  }

  // Ownership check
  if (course.instructor.toString() !== req.user._id.toString()) {
    throw new ApiError(403, "You are not allowed to update this course");
  }

  // Price validation
  if (price !== undefined && price < 0) {
    throw new ApiError(400, "Course price cannot be negative");
  }

  // Thumbnail file validation
  if (file && !file.mimetype.startsWith("image/")) {
    throw new ApiError(400, "Only image files are allowed as thumbnails");
  }

  // Handle thumbnail replacement
  if (file) {
    try {
      if (course.thumbnailPublicId) {
        await deleteFromCloudinary(course.thumbnailPublicId);
      }

      const cloudRes = await uploadToCloudinary(
        file.buffer,
        "courses_thumbnails"
      );

      course.thumbnail = cloudRes.secure_url;
      course.thumbnailPublicId = cloudRes.public_id;
    } catch (error) {
      throw new ApiError(500, "Thumbnail update failed");
    }
  }

  // Partial updates with validation
  if (title !== undefined) {
    if (title.trim() === "") {
      throw new ApiError(400, "Course title cannot be empty");
    }
    course.title = title;
  }

  if (description !== undefined) {
    if (description.trim() === "") {
      throw new ApiError(400, "Course description cannot be empty");
    }
    course.description = description;
  }

  if (category !== undefined) {
    if (category.trim() === "") {
      throw new ApiError(400, "Course category cannot be empty");
    }
    course.category = category;
  }

  if (level !== undefined) {
    course.level = level;
  }

  if (price !== undefined) {
    course.price = price;
  }

  await course.save();

  res.status(200).json({
    success: true,
    message: "Course updated successfully",
    data: course,
  });
});