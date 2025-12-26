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

