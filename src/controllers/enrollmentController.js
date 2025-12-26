import mongoose from "mongoose";
import asyncHandler from "../utils/asyncHandler.js";
import ApiError from "../utils/ApiError.js";
import { Enrollment } from "../models/Enrollment.js";
import { Course } from "../models/Course.js";

/**
 * POST /api/enrollments
 * Student enrolls in a course
 */
export const createEnrollment = asyncHandler(async (req, res) => {
  const { courseId } = req.body;

  if (!courseId) {
    throw new ApiError(400, "Course ID is required");
  }

  if (!mongoose.Types.ObjectId.isValid(courseId)) {
    throw new ApiError(400, "Invalid course ID");
  }

  const course = await Course.findById(courseId);
  if (!course) {
    throw new ApiError(404, "Course not found");
  }

  // Only students can enroll
  if (req.user.role !== "student") {
    throw new ApiError(403, "Only students can enroll in courses");
  }

  // Check duplicate enrollment
  const existing = await Enrollment.findOne({
    course: courseId,
    student: req.user._id,
  });

  if (existing) {
    throw new ApiError(409, "You are already enrolled in this course");
  }

  // Determine payment status
  const isPaid = course.price > 0 ? false : true; // free course: auto-paid

  const enrollment = await Enrollment.create({
    course: courseId,
    student: req.user._id,
    isPaid,
    status: "active",
  });

  res.status(201).json({
    success: true,
    message: "Enrollment created successfully",
    data: enrollment,
  });
});

export const listMyEnrollments = asyncHandler(async (req, res) => {
  const user = req.user;

  // Only students can view their enrollments
  if (user.role !== "student") {
    throw new ApiError(403, "Only students can view enrollments");
  }

  const enrollments = await Enrollment.find({
    student: user._id,
    status: { $ne: "cancelled" },
  })
    .populate({
      path: "course",
      select: "title thumbnail price level status instructor",
      populate: {
        path: "instructor",
        select: "name email",
      },
    })
    .sort({ enrolledAt: -1 })
    .lean();

  res.status(200).json({
    success: true,
    data: enrollments,
  });
});


export const listCourseEnrollments = asyncHandler(async (req, res) => {
  const { courseId } = req.params;
  let { status, page = 1, limit = 10 } = req.query;

  if (!mongoose.Types.ObjectId.isValid(courseId)) {
    throw new ApiError(400, "Invalid course id");
  }

  page = parseInt(page) > 0 ? parseInt(page) : 1;
  limit = parseInt(limit) > 0 ? Math.min(parseInt(limit), 50) : 10;

  const course = await Course.findById(courseId).select("instructor");
  if (!course) {
    throw new ApiError(404, "Course not found");
  }

  // Ownership check
  if (course.instructor.toString() !== req.user._id.toString()) {
    throw new ApiError(
      403,
      "You are not allowed to view enrollments for this course"
    );
  }

  const filter = { course: courseId };

  if (status && ["active", "completed", "cancelled"].includes(status)) {
    filter.status = status;
  }

  const [total, enrollments] = await Promise.all([
    Enrollment.countDocuments(filter),
    Enrollment.find(filter)
      .populate({
        path: "student",
        select: "name email",
      })
      .sort({ enrolledAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean(),
  ]);

  res.status(200).json({
    success: true,
    data: enrollments,
    meta: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  });
});

