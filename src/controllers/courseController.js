import asyncHandler from "../utils/AsyncHandler.js";
import ApiError from "../utils/ApiError.js";
import { Course } from "../models/Course.js";

export const createCourse = asyncHandler(async (req, res) => {
  const { title, description, category, price, level, thumbnail } = req.body;

  // Basic validation
  if (!title || !description || !category || price === undefined) {
    throw new ApiError(400, "All required fields must be provided");
  }

  if (price < 0) {
    throw new ApiError(400, "Course price cannot be negative");
  }

  const course = await Course.create({
    instructor: req.user._id,
    title,
    description,
    category,
    price,
    level,
    thumbnail,
  });

  res.status(201).json({
    success: true,
    message: "Course created successfully",
    data: course,
  });
});
