import asyncHandler from "../utils/AsyncHandler.js";
import ApiError from "../utils/ApiError.js";
import { Course } from "../models/Course.js";
import { Section } from "../models/Section.js";
import { Lesson } from "../models/Lesson.js";
import { Enrollment } from "../models/Enrollment.js";
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

export const updateCourseStatus = asyncHandler(async (req, res) => {
  const { courseId } = req.params;
  const { status } = req.body;

  if (!["published", "unpublished"].includes(status)) {
    throw new ApiError(400, "Invalid course status");
  }

  if (!mongoose.Types.ObjectId.isValid(courseId)) {
    throw new ApiError(400, "Invalid course id");
  }

  const course = await Course.findById(courseId);

  if (!course) {
    throw new ApiError(404, "Course not found");
  }

  // Ownership check
  if (course.instructor.toString() !== req.user._id.toString()) {
    throw new ApiError(403, "You are not allowed to change this course status");
  }

  // Publish rules
  if (status === "published") {
    const sectionIds = await Section.find({ course: courseId }).distinct("_id"); // distinct give array of provided field e.g _id only
    const sectionCount = await Section.countDocuments({ course: courseId });
    const lessonCount = await Lesson.countDocuments({
      section: { $in: sectionIds },
    });

    if (sectionCount === 0 || lessonCount === 0) {
      throw new ApiError(
        400,
        "Course must have at least one section and one lesson before publishing"
      );
    }

    course.status = "published";
  }

  // Unpublish rules
  if (status === "unpublished") {
    if (course.status !== "published") {
      throw new ApiError(400, "Only published courses can be unpublished");
    }
    course.status = "unpublished";
  }

  await course.save();

  res.status(200).json({
    success: true,
    message: `Course ${status} successfully`,
    data: {
      courseId: course._id,
      status: course.status,
    },
  });
});

export const listInstructorCourses = asyncHandler(async (req, res) => {
  let { status, category, search, page = 1, limit = 10 } = req.query;

  // Validate and sanitize query params
  page = parseInt(page) > 0 ? parseInt(page) : 1;
  limit = parseInt(limit) > 0 ? Math.min(parseInt(limit), 50) : 10; // max 50 per page

  const filter = { instructor: req.user._id };

  // Validate status filter
  const validStatuses = ["draft", "published", "unpublished"];
  if (status && validStatuses.includes(status)) {
    filter.status = status;
  }

  // Optional filters
  if (category) filter.category = category;
  if (search) filter.title = { $regex: search.trim(), $options: "i" };

  const [total, courses] = await Promise.all([
    Course.countDocuments(filter),
    Course.find(filter)
      .sort({ createdAt: -1 }) // latest first
      .skip((page - 1) * limit)
      .limit(limit)
      .lean(),
  ]);

  res.status(200).json({
    success: true,
    data: courses,
    meta: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  });
});

export const listPublishedCourses = asyncHandler(async (req, res) => {
  let { category, search, type, page = 1, limit = 10 } = req.query;

  // Sanitize & validate query params
  page = parseInt(page) > 0 ? parseInt(page) : 1;
  limit = parseInt(limit) > 0 ? Math.min(parseInt(limit), 50) : 10;

  const filter = { status: "published" }; // Only published courses

  if (category) filter.category = category.trim();

  if (search) {
    filter.title = { $regex: search.trim(), $options: "i" };
  }

  if (type === "free") filter.price = 0;
  if (type === "paid") filter.price = { $gt: 0 };

  // Execute queries in parallel for efficiency
  const [total, courses] = await Promise.all([
    Course.countDocuments(filter),
    Course.find(filter)
      .sort({ createdAt: -1 }) // latest first
      .skip((page - 1) * limit)
      .limit(limit)
      .select("title category price level thumbnail instructor createdAt") // select only necessary fields
      .populate({
        path: "instructor",
        select: "name avatar",
      })
      .lean(),
  ]);

  res.status(200).json({
    success: true,
    data: courses,
    meta: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  });
});

export const getSingleCourse = asyncHandler(async (req, res) => {
  const { courseId } = req.params;
  const user = req.user; // undefined if public route

  if (!mongoose.Types.ObjectId.isValid(courseId)) {
    throw new ApiError(400, "Invalid course id");
  }

  const course = await Course.findById(courseId)
    .select(
      "title description category price level thumbnail status instructor createdAt"
    )
    .populate("instructor", "name avatar")
    .lean();

  if (!course) {
    throw new ApiError(404, "Course not found");
  }

  // Access control for non-published courses
  if (course.status !== "published") {
    if (!user) {
      throw new ApiError(403, "You are not allowed to access this course");
    }

    const isAdmin = user.role === "admin";
    const isOwner = course.instructor._id.equals(user._id);

    if (!isAdmin && !isOwner) {
      throw new ApiError(403, "You are not allowed to access this course");
    }
  }

  res.status(200).json({
    success: true,
    data: course,
  });
});

export const deleteCourse = asyncHandler(async (req, res) => {
  const { courseId } = req.params;

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
    throw new ApiError(403, "You are not allowed to delete this course");
  }

  // Prevent deleting published courses
  if (course.status === "published") {
    throw new ApiError(
      400,
      "Published courses cannot be deleted. Unpublish first."
    );
  }

  // Check for enrollments
  const enrollmentCount = await Enrollment.countDocuments({
    course: courseId,
    status: { $in: ["active", "completed"] },
  });

  if (enrollmentCount > 0) {
    throw new ApiError(400, "Course with enrollments cannot be deleted");
  }

  // Delete thumbnail from Cloudinary
  if (course.thumbnailPublicId) {
    await deleteFromCloudinary(course.thumbnailPublicId);
  }

  await course.deleteOne();

  res.status(200).json({
    success: true,
    message: "Course deleted successfully",
  });
});
