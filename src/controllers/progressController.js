import mongoose from "mongoose";
import { Progress } from "../models/Progress.js";
import { Enrollment } from "../models/Enrollment.js";
import { Lesson } from "../models/Lesson.js";
import { Section } from "../models/Section.js";
import { Course } from "../models/Course.js";
import ApiError from "../utils/ApiError.js";
import asyncHandler from "../utils/AsyncHandler.js";

export const markLessonCompleted = asyncHandler(async (req, res) => {
  const { lessonId } = req.body;
  const studentId = req.user._id;

  // Only students can complete lessons
  if (req.user.role !== "student") {
    throw new ApiError(403, "Only students can complete lessons");
  }

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

  if (course.status !== "published") {
    throw new ApiError(403, "Course is not published");
  }

  // Check enrollment
  const enrollment = await Enrollment.findOne({
    student: studentId,
    course: course._id,
    status: "active",
  });

  if (!enrollment) {
    throw new ApiError(403, "You must be enrolled to complete lessons");
  }

  // Create progress only if not already completed
  const progress = await Progress.findOneAndUpdate(
    {
      student: studentId,
      course: course._id,
      lesson: lesson._id,
      completed: { $ne: true },
    },
    {
      completed: true,
      completedAt: new Date(),
    },
    {
      new: true,
      upsert: true,
    }
  );

  res.status(200).json({
    success: true,
    message: "Lesson marked as completed",
    data: progress,
  });
});


export const getCourseProgress = asyncHandler(async (req, res) => {
  const { courseId } = req.params;
  const studentId = req.user._id;

  // Only students
  if (req.user.role !== "student") {
    throw new ApiError(403, "Only students can view course progress");
  }

  if (!mongoose.Types.ObjectId.isValid(courseId)) {
    throw new ApiError(400, "Invalid course id");
  }

  const course = await Course.findById(courseId).select("_id");
  if (!course) {
    throw new ApiError(404, "Course not found");
  }

  // Check enrollment
  const enrollment = await Enrollment.findOne({
    student: studentId,
    course: courseId,
    status: "active",
  });

  if (!enrollment) {
    throw new ApiError(403, "You are not enrolled in this course");
  }

  // Get all lessons in the course
  const sections = await Section.find({ course: courseId }).select("_id");

  const sectionIds = sections.map((s) => s._id);

  const totalLessons = await Lesson.countDocuments({
    section: { $in: sectionIds },
  });

  if (totalLessons === 0) {
    return res.status(200).json({
      success: true,
      data: {
        totalLessons: 0,
        completedLessons: 0,
        progressPercentage: 0,
      },
    });
  }

  // Completed lessons by student
  const completedLessons = await Progress.countDocuments({
    student: studentId,
    course: courseId,
    completed: true,
  });

  const progressPercentage = Math.round(
    (completedLessons / totalLessons) * 100
  );

  // Auto-complete enrollment
  if (progressPercentage === 100 && enrollment.status !== "completed") {
    enrollment.status = "completed";
    await enrollment.save();
  }

  res.status(200).json({
    success: true,
    data: {
      totalLessons,
      completedLessons,
      progressPercentage,
      completedAt:
        enrollment.status === "completed" ? enrollment.updatedAt : null,
    },
  });
});


export const getLessonCompletionMap = asyncHandler(async (req, res) => {
  const { courseId } = req.params;
  const studentId = req.user._id;

  if (req.user.role !== "student") {
    throw new ApiError(403, "Only students can access lesson progress");
  }

  if (!mongoose.Types.ObjectId.isValid(courseId)) {
    throw new ApiError(400, "Invalid course id");
  }

  const course = await Course.findById(courseId).select("_id");
  if (!course) {
    throw new ApiError(404, "Course not found");
  }

  // Check enrollment
  const enrollment = await Enrollment.findOne({
    student: studentId,
    course: courseId,
    status: { $in: ["active", "completed"] },
  });

  if (!enrollment) {
    throw new ApiError(403, "You are not enrolled in this course");
  }

  // Get all lesson IDs in course
  const sections = await Section.find({ course: courseId }).select("_id");

  const sectionIds = sections.map((s) => s._id);

  const lessons = await Lesson.find({
    section: { $in: sectionIds },
  }).select("_id");

  const lessonIds = lessons.map((l) => l._id);

  // Get progress records
  const progressRecords = await Progress.find({
    student: studentId,
    course: courseId,
    lesson: { $in: lessonIds },
    completed: true,
  }).select("lesson completedAt").lean();

  // Build completion map
  const completionMap = {};

  for (const record of progressRecords) {
    completionMap[record.lesson.toString()] = {
      completed: true,
      completedAt: record.completedAt,
    };
  }

  res.status(200).json({
    success: true,
    data: completionMap,
  });
});
