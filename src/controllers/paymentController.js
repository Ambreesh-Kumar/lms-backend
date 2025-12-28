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

  // Only students can pay
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

  // Check existing enrollment
  const existingEnrollment = await Enrollment.findOne({
    student: studentId,
    course: courseId,
  });

  /**
   * CASE 1: Enrollment already exists
   */
  if (existingEnrollment) {
    // Already enrolled
    if (["active", "completed"].includes(existingEnrollment.status)) {
      throw new ApiError(409, "You are already enrolled in this course");
    }

    // Pending enrollment → retry / resume payment
    if (existingEnrollment.status === "pending") {
      let payment = await Payment.findOne({
        enrollment: existingEnrollment._id,
        status: "pending",
      });

      // If no payment exists, create a fresh Razorpay order
      if (!payment) {
        const amountInPaise = course.price * 100;

        const razorpayOrder = await razorpay.orders.create({
          amount: amountInPaise,
          currency: "INR",
          receipt: `receipt_${existingEnrollment._id}`,
          notes: {
            courseId: course._id.toString(),
            studentId: studentId.toString(),
            enrollmentId: existingEnrollment._id.toString(),
          },
        });

        payment = await Payment.create({
          enrollment: existingEnrollment._id,
          student: studentId,
          course: courseId,
          razorpayOrderId: razorpayOrder.id,
          amount: course.price,
          status: "pending",
        });

        return res.status(201).json({
          success: true,
          message: "Razorpay order created for pending enrollment",
          data: {
            orderId: razorpayOrder.id,
            amount: razorpayOrder.amount,
            currency: razorpayOrder.currency,
            key: process.env.RAZORPAY_KEY_ID,
            enrollmentId: existingEnrollment._id,
            paymentId: payment._id,
          },
        });
      }

      // Payment already exists → return it
      return res.status(200).json({
        success: true,
        message: "Payment pending. Complete payment to activate enrollment",
        data: {
          enrollmentId: existingEnrollment._id,
          paymentId: payment._id,
          razorpayOrderId: payment.razorpayOrderId,
          key: process.env.RAZORPAY_KEY_ID,
        },
      });
    }
  }

  /**
   * CASE 2: Fresh purchase (no enrollment)
   */
  const newEnrollment = await Enrollment.create({
    student: studentId,
    course: courseId,
    status: "pending",
    isPaid: false,
  });

  const amountInPaise = course.price * 100;

  const razorpayOrder = await razorpay.orders.create({
    amount: amountInPaise,
    currency: "INR",
    receipt: `receipt_${newEnrollment._id}`,
    notes: {
      courseId: course._id.toString(),
      studentId: studentId.toString(),
      enrollmentId: newEnrollment._id.toString(),
    },
  });

  const payment = await Payment.create({
    enrollment: newEnrollment._id,
    student: studentId,
    course: courseId,
    razorpayOrderId: razorpayOrder.id,
    amount: course.price,
    status: "pending",
  });

  res.status(201).json({
    success: true,
    message: "Razorpay order created successfully",
    data: {
      orderId: razorpayOrder.id,
      amount: razorpayOrder.amount,
      currency: razorpayOrder.currency,
      key: process.env.RAZORPAY_KEY_ID,
      enrollmentId: newEnrollment._id,
      paymentId: payment._id,
    },
  });
});



