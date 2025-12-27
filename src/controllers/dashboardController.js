import mongoose from "mongoose";
import { Enrollment } from "../models/Enrollment.js";
import { Course } from "../models/Course.js";
import { Section } from "../models/Section.js";
import { Lesson } from "../models/Lesson.js";
import { Progress } from "../models/Progress.js";
import ApiError from "../utils/ApiError.js";
import asyncHandler from "../utils/asyncHandler.js";

export const getStudentDashboard = asyncHandler(async (req, res) => {
  const user = req.user;

  if (user.role !== "student") {
    throw new ApiError(403, "Only students can access dashboard");
  }

  // Fetch enrollments
  const enrollments = await Enrollment.find({
    student: user._id,
    status: { $in: ["active", "completed"] },
  })
    .populate({
      path: "course",
      select: "title thumbnail",
    })
    .lean();

  if (!enrollments.length) {
    return res.status(200).json({
      success: true,
      data: [],
    });
  }

  const dashboardData = await Promise.all(
    enrollments.map(async (enrollment) => {
      const courseId = enrollment.course._id;

      // Get section IDs
      const sections = await Section.find({ course: courseId }).select("_id");
      const sectionIds = sections.map((s) => s._id);

      if (!sectionIds.length) {
        return {
          courseId,
          title: enrollment.course.title,
          thumbnail: enrollment.course.thumbnail,
          status: enrollment.status,
          totalLessons: 0,
          completedLessons: 0,
          progressPercentage: 0,
          lastActivityAt: enrollment.updatedAt,
        };
      }

      // Get lesson IDs
      const lessons = await Lesson.find({
        section: { $in: sectionIds },
      }).select("_id");

      const lessonIds = lessons.map((l) => l._id);
      const totalLessons = lessonIds.length;

      if (!totalLessons) {
        return {
          courseId,
          title: enrollment.course.title,
          thumbnail: enrollment.course.thumbnail,
          status: enrollment.status,
          totalLessons: 0,
          completedLessons: 0,
          progressPercentage: 0,
          lastActivityAt: enrollment.updatedAt,
        };
      }

      // Count completed lessons
      const completedLessons = await Progress.countDocuments({
        student: user._id,
        course: courseId,
        lesson: { $in: lessonIds },
        completed: true,
      });

      const progressPercentage = Math.round(
        (completedLessons / totalLessons) * 100
      );

      return {
        courseId,
        title: enrollment.course.title,
        thumbnail: enrollment.course.thumbnail,
        status: enrollment.status,
        totalLessons,
        completedLessons,
        progressPercentage,
        lastActivityAt: enrollment.updatedAt,
      };
    })
  );

  res.status(200).json({
    success: true,
    data: dashboardData,
  });
});

