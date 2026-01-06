import mongoose from "mongoose";
import Razorpay from "razorpay";
import crypto from "crypto";
import { Enrollment } from "../../models/Enrollment.js";
import { Course } from "../../models/Course.js";
import { Payment } from "../../models/Payment.js";
import ApiError from "../../utils/ApiError.js";
import asyncHandler from "../../utils/AsyncHandler.js";

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

export const renderCheckoutPage = asyncHandler(async (req, res) => {
  const { enrollmentId } = req.params;
  const userId = req.user._id;

  // Validate enrollment id
  if (!mongoose.Types.ObjectId.isValid(enrollmentId)) {
    throw new ApiError(400, "Invalid enrollment id");
  }

  // Fetch enrollment
  const enrollment = await Enrollment.findById(enrollmentId);
  if (!enrollment) {
    throw new ApiError(404, "Enrollment not found");
  }

  // Ownership check
  if (enrollment.student.toString() !== userId.toString()) {
    throw new ApiError(403, "Unauthorized access to enrollment");
  }

  // Fetch course
  const course = await Course.findById(enrollment.course);
  if (!course) {
    throw new ApiError(404, "Course not found");
  }

  if (course.price <= 0) {
    throw new ApiError(400, "This course does not require payment");
  }

  // Fetch existing payment (if any)
  let payment = await Payment.findOne({
    enrollment: enrollment._id,
    student: userId,
    course: course._id,
  });

  // Block already paid enrollment
  if (payment?.status === "success") {
    return res.redirect("/payments/ejs/already-paid");
  }

  let razorpayOrder;

  // Create Razorpay order only if missing
  if (!payment || !payment.razorpayOrderId) {
    razorpayOrder = await razorpay.orders.create({
      amount: course.price * 100, // paise (boundary conversion)
      currency: "INR",
      receipt: `enrollment_${enrollment._id}`,
      notes: {
        enrollmentId: enrollment._id.toString(),
        courseId: course._id.toString(),
        studentId: userId.toString(),
      },
    });

    if (!payment) {
      payment = new Payment({
        enrollment: enrollment._id,
        student: userId,
        course: course._id,
        amount: course.price, // rupees (DB invariant)
        status: "pending",
      });
    }

    payment.razorpayOrderId = razorpayOrder.id;
    await payment.save();
  } else {
    // Reuse existing Razorpay order
    razorpayOrder = await razorpay.orders.fetch(payment.razorpayOrderId);
  }

  // Render checkout using Razorpay order data (SOURCE OF TRUTH)
  res.render("payments/checkout", {
    razorpayKeyId: process.env.RAZORPAY_KEY_ID,
    orderId: razorpayOrder.id,
    amount: razorpayOrder.amount, // paise
    courseTitle: course.title,
    studentEmail: req.user.email,
    studentName: req.user.name,
  });
});

export const verifyEjsPayment = asyncHandler(async (req, res) => {
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature } =
    req.body;

  // Basic validation
  if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
    throw new ApiError(400, "Missing Razorpay payment details");
  }

  // Find payment by order ID
  const payment = await Payment.findOne({
    razorpayOrderId: razorpay_order_id,
  });

  if (!payment) {
    throw new ApiError(404, "Payment record not found");
  }

  // Idempotency check
  if (payment.status === "success") {
    return res.redirect("/payments/ejs/already-paid");
  }

  // Verify Razorpay signature
  const body = `${razorpay_order_id}|${razorpay_payment_id}`;

  const expectedSignature = crypto
    .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
    .update(body)
    .digest("hex");

  if (expectedSignature !== razorpay_signature) {
    // Mark payment as failed (transactional for consistency)
    const failSession = await mongoose.startSession();
    failSession.startTransaction();

    try {
      payment.status = "failed";
      await payment.save({ session: failSession });

      await failSession.commitTransaction();
      failSession.endSession();

      throw new ApiError(400, "Invalid Razorpay signature");
    } catch (err) {
      await failSession.abortTransaction();
      failSession.endSession();
      throw err;
    }
  }

  // Start transaction for success flow
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    // Update payment
    payment.status = "success";
    payment.razorpayPaymentId = razorpay_payment_id;
    payment.paidAt = new Date();
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

    // Commit transaction
    await session.commitTransaction();
    session.endSession();

    return res.status(200).json({
      success: true,
      enrollmentId: enrollment._id,
      message: "Payment verified successfully",
    });
  } catch (err) {
    await session.abortTransaction();
    session.endSession();
    throw err;
  }
});

export const renderPaymentSuccessPage = (req, res) => {
  return res.render("payments/success");
};

export const renderPaymentFailurePage = (req, res) => {
  res.render("payments/failure");
};

export const renderPaymentCancelPage = (req, res) => {
  res.render("payments/cancel");
};
