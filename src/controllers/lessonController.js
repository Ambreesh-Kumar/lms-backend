import mongoose from "mongoose";
import { Lesson } from "../models/Lesson.js";
import { Section } from "../models/Section.js";
import { Course } from "../models/Course.js";
import { Enrollment } from "../models/Enrollment.js";
import asyncHandler from "../utils/AsyncHandler.js";
import ApiError from "../utils/ApiError.js";

export const createLesson = asyncHandler(async (req, res) => {
  const { section, title, type, content, order, duration } = req.body;

  // Basic validation
  if (!section || !title || !type || !content || order === undefined) {
    throw new ApiError(400, "All required fields must be provided");
  }

  const parsedOrder = Number(order);

  if (!mongoose.Types.ObjectId.isValid(section)) {
    throw new ApiError(400, "Invalid section id");
  }

  if (!["video", "text"].includes(type)) {
    throw new ApiError(400, "Invalid lesson type");
  }

  if (type === "text" && content.trim() === "") {
    throw new ApiError(400, "Lesson content cannot be empty");
  }

  if (!Number.isInteger(parsedOrder) || parsedOrder < 1) {
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
  const existingLesson = await Lesson.findOne({ section, order: parsedOrder });
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
    order: parsedOrder,
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

export const listLessonsBySectionAdmin = asyncHandler(async (req, res) => {
  const { sectionId } = req.params;

  // Validate sectionId
  if (!mongoose.Types.ObjectId.isValid(sectionId)) {
    throw new ApiError(400, "Invalid section id");
  }

  // Check if section exists
  const section = await Section.findById(sectionId).lean();
  if (!section) {
    throw new ApiError(404, "Section not found");
  }

  // Fetch all lessons for this section
  const lessons = await Lesson.find({ section: sectionId })
    .sort({ order: 1 })
    .lean();

  res.status(200).json({
    success: true,
    data: lessons,
  });
});


export const updateLesson = asyncHandler(async (req, res) => {
  const { lessonId } = req.params;
  const { title, type, content, order, duration } = req.body;

  // No update data provided
  if (
    title === undefined &&
    type === undefined &&
    content === undefined &&
    order === undefined &&
    duration === undefined
  ) {
    throw new ApiError(400, "No data provided to update");
  }

  // Validate lessonId
  if (!mongoose.Types.ObjectId.isValid(lessonId)) {
    throw new ApiError(400, "Invalid lesson id");
  }

  const lesson = await Lesson.findById(lessonId);
  if (!lesson) {
    throw new ApiError(404, "Lesson not found");
  }

  const section = await Section.findById(lesson.section);
  if (!section) {
    throw new ApiError(404, "Section not found");
  }

  const course = await Course.findById(section.course);
  if (!course) {
    throw new ApiError(404, "Course not found");
  }

  // Ownership check
  if (course.instructor.toString() !== req.user._id.toString()) {
    throw new ApiError(403, "You are not allowed to update this lesson");
  }

  // Resolve effective lesson type (important for safe validation)
  const effectiveType = type ?? lesson.type;

  // Update title
  if (title !== undefined) {
    if (typeof title !== "string" || title.trim() === "") {
      throw new ApiError(400, "Lesson title cannot be empty");
    }
    lesson.title = title.trim();
  }

  // Update type
  if (type !== undefined) {
    if (!["video", "text"].includes(type)) {
      throw new ApiError(400, "Invalid lesson type");
    }

    // Adjust dependent fields on type change
    if (type !== lesson.type) {
      if (type === "text") {
        lesson.duration = undefined;
      }
      if (type === "video" && lesson.duration === undefined) {
        lesson.duration = 0;
      }
    }

    lesson.type = type;
  }

  // Update content (validated against effective type)
  if (content !== undefined) {
    if (effectiveType === "text") {
      if (typeof content !== "string" || content.trim() === "") {
        throw new ApiError(400, "Lesson content cannot be empty");
      }
      lesson.content = content.trim();
    }

    if (effectiveType === "video") {
      try {
        new URL(content);
      } catch {
        throw new ApiError(400, "Invalid video URL");
      }
      lesson.content = content;
    }
  }

  // Update order
  if (order !== undefined) {
    if (!Number.isInteger(order) || order < 1) {
      throw new ApiError(400, "Order must be a positive integer");
    }

    if (order !== lesson.order) {
      const orderExists = await Lesson.findOne({
        section: lesson.section,
        order,
        _id: { $ne: lesson._id },
      });

      if (orderExists) {
        throw new ApiError(
          409,
          "Lesson with this order already exists in the section"
        );
      }

      lesson.order = order;
    }
  }

  // Update duration (video only)
  if (duration !== undefined) {
    if (effectiveType !== "video") {
      lesson.duration = undefined;
    } else if (duration < 0) {
      throw new ApiError(400, "Duration cannot be negative");
    } else {
      lesson.duration = duration;
    }
  }

  await lesson.save();

  res.status(200).json({
    success: true,
    message: "Lesson updated successfully",
    data: lesson,
  });
});


export const deleteLesson = asyncHandler(async (req, res) => {
  const { lessonId } = req.params;

  // Validate lessonId
  if (!mongoose.Types.ObjectId.isValid(lessonId)) {
    throw new ApiError(400, "Invalid lesson id");
  }

  const lesson = await Lesson.findById(lessonId);
  if (!lesson) {
    throw new ApiError(404, "Lesson not found");
  }

  const section = await Section.findById(lesson.section);
  if (!section) {
    throw new ApiError(404, "Section not found");
  }

  const course = await Course.findById(section.course);
  if (!course) {
    throw new ApiError(404, "Course not found");
  }

  // Ownership check
  if (course.instructor.toString() !== req.user._id.toString()) {
    throw new ApiError(403, "You are not allowed to delete this lesson");
  }

  await lesson.deleteOne();

  res.status(200).json({
    success: true,
    message: "Lesson deleted successfully",
  });
});




