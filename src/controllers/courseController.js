import asyncHandler from "../utils/AsyncHandler.js";
import ApiError from "../utils/ApiError.js";
import { Course } from "../models/Course.js";
import { uploadToCloudinary } from "../utils/cloudinaryUpload.js";

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
