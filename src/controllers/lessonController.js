import mongoose from "mongoose";
import { Lesson } from "../models/Lesson.js";
import { Section } from "../models/Section.js";
import { Course } from "../models/Course.js";
import { Enrollment } from "../models/Enrollment.js";
import asyncHandler from "../utils/asyncHandler.js";
import ApiError from "../utils/ApiError.js";

export const createLesson = asyncHandler(async (req, res) => {
  const { section, title, type, content, order, duration } = req.body;

  // Basic validation
  if (!section || !title || !type || !content || order === undefined) {
    throw new ApiError(400, "All required fields must be provided");
  }

  if (!mongoose.Types.ObjectId.isValid(section)) {
    throw new ApiError(400, "Invalid section id");
  }

  if (!["video", "text"].includes(type)) {
    throw new ApiError(400, "Invalid lesson type");
  }

  if (type === "text" && content.trim() === "") {
    throw new ApiError(400, "Lesson content cannot be empty");
  }

  if (!Number.isInteger(order) || order < 1) {
    throw new ApiError(400, "Order must be a positive integer");
  }

  if (type === "video" && duration !== undefined && duration < 0) {
    throw new ApiError(400, "Duration cannot be negative");
  }
  if (type === "video") {
    try {
      new URL(content);
    } catch {
      throw new ApiError(400, "Invalid video URL");
    }
  }

  // Check section existence
  const sectionDoc = await Section.findById(section);
  if (!sectionDoc) {
    throw new ApiError(404, "Section not found");
  }

  // Ownership check via course
  const course = await Course.findById(sectionDoc.course);
  if (!course) {
    throw new ApiError(404, "Course not found");
  }

  if (course.instructor.toString() !== req.user._id.toString()) {
    throw new ApiError(
      403,
      "You are not allowed to add lessons to this section"
    );
  }

  // Prevent order conflict
  const existingLesson = await Lesson.findOne({ section, order });
  if (existingLesson) {
    throw new ApiError(
      409,
      "Lesson with this order already exists in the section"
    );
  }

  const lesson = await Lesson.create({
    section,
    title: title.trim(),
    type,
    content,
    order,
    duration: type === "video" ? duration : undefined,
  });

  res.status(201).json({
    success: true,
    message: "Lesson created successfully",
    data: lesson,
  });
});

export const listLessonsBySection = asyncHandler(async (req, res) => {
  const { sectionId } = req.params;
  const user = req.user; // may be undefined if route is public

  // Validate sectionId
  if (!mongoose.Types.ObjectId.isValid(sectionId)) {
    throw new ApiError(400, "Invalid section id");
  }

  const section = await Section.findById(sectionId).lean();
  if (!section) {
    throw new ApiError(404, "Section not found");
  }

  const course = await Course.findById(section.course).lean();
  if (!course) {
    throw new ApiError(404, "Course not found");
  }

  // Access control
  if (!user) {
    throw new ApiError(401, "Authentication required");
  }

  const isInstructor =
    user.role === "instructor" &&
    course.instructor.toString() === user._id.toString();

  let isEnrolled = false;

  if (user.role === "student") {
    const enrollment = await Enrollment.findOne({
      student: user._id,
      course: course._id,
      status: "active",
    }).lean();

    isEnrolled = !!enrollment;
  }

  if (!isInstructor && !isEnrolled) {
    throw new ApiError(403, "You are not allowed to access these lessons");
  }

  const lessons = await Lesson.find({ section: sectionId })
    .sort({ order: 1 })
    .lean();

  res.status(200).json({
    success: true,
    data: lessons,
  });
});
