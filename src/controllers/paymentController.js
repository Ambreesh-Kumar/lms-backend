import { razorpay } from "../config/razorpay.js";
import { Course } from "../models/Course.js";
import { Enrollment } from "../models/Enrollment.js";
import { Payment } from "../models/Payment.js";
import ApiError from "../utils/ApiError.js";
import asyncHandler from "../utils/AsyncHandler.js";
import mongoose from "mongoose";

export const createRazorpayOrder = asyncHandler(async (req, res) => {
  const { courseId } = req.body;
  const studentId = req.user._id;

  if (req.user.role !== "student") {
    throw new ApiError(403, "Only students can make payments");
  }

  if (!mongoose.Types.ObjectId.isValid(courseId)) {
    throw new ApiError(400, "Invalid course id");
  }

  const course = await Course.findById(courseId);
  if (!course) {
    throw new ApiError(404, "Course not found");
  }

  if (course.price <= 0) {
    throw new ApiError(400, "This course is free");
  }

  if (course.status !== "published") {
    throw new ApiError(403, "Course is not available for purchase");
  }

  // Prevent duplicate enrollment
  const existingEnrollment = await Enrollment.findOne({
    student: studentId,
    course: courseId,
  });

  if (existingEnrollment) {
    throw new ApiError(409, "You are already enrolled in this course");
  }

  // Create enrollment with "pending" status for paid course
  const enrollment = await Enrollment.create({
    student: studentId,
    course: courseId,
    status: "pending", // updated enum
    isPaid: false,
  });

  const amountInPaise = course.price * 100;

  // Create Razorpay order
  const razorpayOrder = await razorpay.orders.create({
    amount: amountInPaise,
    currency: "INR",
    receipt: `receipt_${enrollment._id}`,
    notes: {
      courseId: course._id.toString(),
      studentId: studentId.toString(),
    },
  });

  // Store payment record
  const payment = await Payment.create({
    enrollment: enrollment._id,
    student: studentId,
    course: courseId,
    razorpayOrderId: razorpayOrder.id,
    amount: course.price,
    status: "pending",
  });

  res.status(201).json({
    success: true,
    message: "Razorpay order created, complete the payment to activate enrollment",
    data: {
      orderId: razorpayOrder.id,
      amount: razorpayOrder.amount,
      currency: razorpayOrder.currency,
      key: process.env.RAZORPAY_KEY_ID,
      courseTitle: course.title,
      paymentId: payment._id,
      enrollmentId: enrollment._id,
    },
  });
});
