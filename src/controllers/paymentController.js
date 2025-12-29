import { razorpay } from "../config/razorpay.js";
import crypto from "crypto";
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

  let enrollment = await Enrollment.findOne({
    student: studentId,
    course: courseId,
  });

  // Already enrolled
  if (enrollment && ["active", "completed"].includes(enrollment.status)) {
    throw new ApiError(409, "You are already enrolled in this course");
  }

  // Create enrollment if not exists
  if (!enrollment) {
    enrollment = await Enrollment.create({
      student: studentId,
      course: courseId,
      status: "pending",
      isPaid: false,
    });
  }

  // Always create a NEW order for retry
  const amountInPaise = course.price * 100;

  const razorpayOrder = await razorpay.orders.create({
    amount: amountInPaise,
    currency: "INR",
    receipt: `enr_${enrollment._id.toString().slice(-10)}_${Date.now().toString().slice(-8)}`,
    notes: {
      courseId: course._id.toString(),
      studentId: studentId.toString(),
      enrollmentId: enrollment._id.toString(),
    },
  });

  // Mark old pending payments as failed
  await Payment.updateMany(
    { enrollment: enrollment._id, status: "pending" },
    { $set: { status: "failed" } }
  );

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
    message: "Razorpay order created successfully",
    data: {
      orderId: razorpayOrder.id,
      amount: razorpayOrder.amount,
      currency: razorpayOrder.currency,
      key: process.env.RAZORPAY_KEY_ID,
      enrollmentId: enrollment._id,
      paymentId: payment._id,
    },
  });
});


export const verifyRazorpayPayment = asyncHandler(async (req, res) => {
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature } =
    req.body;

  // 1. Basic validation
  if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
    throw new ApiError(400, "Missing Razorpay payment details");
  }

  // 2. Fetch payment record
  const payment = await Payment.findOne({
    razorpayOrderId: razorpay_order_id,
  });

  if (!payment) {
    throw new ApiError(404, "Payment record not found");
  }

  // 3. Idempotency check
  if (payment.status === "success") {
    return res.status(200).json({
      success: true,
      message: "Payment already verified",
    });
  }

  // 4. Verify Razorpay signature
  const generatedSignature = crypto
    .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
    .update(`${razorpay_order_id}|${razorpay_payment_id}`)
    .digest("hex");

  if (generatedSignature !== razorpay_signature) {
    // Mark payment as failed
    payment.status = "failed";
    await payment.save();

    throw new ApiError(400, "Invalid payment signature");
  }

  // 5. Start DB transaction
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    // Update payment
    payment.razorpayPaymentId = razorpay_payment_id;
    payment.status = "success";
    await payment.save({ session });

    // Update enrollment
    const enrollment = await Enrollment.findById(payment.enrollment).session(
      session
    );

    if (!enrollment) {
      throw new ApiError(404, "Enrollment not found");
    }

    enrollment.status = "active";
    enrollment.isPaid = true;
    await enrollment.save({ session });

    await session.commitTransaction();
    session.endSession();

    res.status(200).json({
      success: true,
      message: "Payment verified and enrollment activated",
      data: {
        enrollmentId: enrollment._id,
        paymentId: payment._id,
      },
    });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    throw error;
  }
});
