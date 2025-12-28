import asyncHandler from "../utils/AsyncHandler.js";
import ApiError from "../utils/ApiError.js";
import { User } from "../models/User.js";
import { Course } from "../models/Course.js";
import { Enrollment } from "../models/Enrollment.js";
import mongoose from "mongoose";

export const getAdminDashboard = asyncHandler(async (req, res) => {
  // Total users by role
  const studentsCount = await User.countDocuments({ role: "student" });
  const instructorsCount = await User.countDocuments({ role: "instructor" });
  const adminsCount = await User.countDocuments({ role: "admin" });

  // Total courses
  const courses = await Course.find({}).select("_id status price").lean();
  const totalCourses = courses.length;
  const publishedCourses = courses.filter(
    (c) => c.status === "published"
  ).length;
  const draftCourses = totalCourses - publishedCourses;

  // Total enrollments
  const enrollments = await Enrollment.find({}).lean();
  const totalEnrollments = enrollments.filter(
    (e) => e.status !== "pending"
  ).length;
  const activeEnrollments = enrollments.filter((e) =>
    ["active", "completed"].includes(e.status)
  ).length;

  // Revenue (paid enrollments only, test mode)
  const paidEnrollments = enrollments.filter(
    (e) => e.isPaid && ["active", "completed"].includes(e.status)
  );
  const totalRevenue = paidEnrollments.reduce((sum, e) => {
    const course = courses.find(
      (c) => c._id.toString() === e.course.toString()
    );
    return sum + (course?.price || 0);
  }, 0);

  res.status(200).json({
    success: true,
    data: {
      users: {
        students: studentsCount,
        instructors: instructorsCount,
        admins: adminsCount,
      },
      courses: {
        total: totalCourses,
        published: publishedCourses,
        draft: draftCourses,
      },
      enrollments: {
        total: totalEnrollments,
        active: activeEnrollments,
      },
      revenue: totalRevenue,
    },
  });
});
