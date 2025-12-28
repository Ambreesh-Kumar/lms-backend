import mongoose from "mongoose";
import { Course } from "../models/Course.js";
import { Enrollment } from "../models/Enrollment.js";
import { Progress } from "../models/Progress.js";
import { Lesson } from "../models/Lesson.js";
import asyncHandler from "../utils/asyncHandler.js";
import ApiError from "../utils/ApiError.js";

export const getInstructorDashboard = asyncHandler(async (req, res) => {
  const instructorId = req.user._id;

  // Fetch instructor courses
  const courses = await Course.find({ instructor: instructorId })
    .select("_id title status")
    .lean();

  if (!courses.length) {
    return res.status(200).json({
      success: true,
      data: {
        overview: {
          totalCourses: 0,
          publishedCourses: 0,
          draftCourses: 0,
          totalEnrollments: 0,
          activeStudents: 0,
        },
        courses: [],
      },
    });
  }

  const courseIds = courses.map((c) => c._id);

  // Aggregate enrollments
  const enrollments = await Enrollment.find({
    course: { $in: courseIds },
  }).lean();

  const activeEnrollments = enrollments.filter((e) =>
    ["active", "completed"].includes(e.status)
  );

  const overview = {
    totalCourses: courses.length,
    publishedCourses: courses.filter((c) => c.status === "published").length,
    draftCourses: courses.filter((c) => c.status !== "published").length,
    totalEnrollments: enrollments.length,
    activeStudents: activeEnrollments.length,
  };

  // Build course-wise stats
  const courseStats = await Promise.all(
    courses.map(async (course) => {
      const courseEnrollments = enrollments.filter(
        (e) => e.course.toString() === course._id.toString()
      );

      const completedStudents = courseEnrollments.filter(
        (e) => e.status === "completed"
      ).length;

      return {
        courseId: course._id,
        title: course.title,
        status: course.status,
        totalStudents: courseEnrollments.length,
        completedStudents,
      };
    })
  );

  res.status(200).json({
    success: true,
    data: {
      overview,
      courses: courseStats,
    },
  });
});
