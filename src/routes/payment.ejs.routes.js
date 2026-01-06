import express from "express";
import { auth } from "../middlewares/auth.js";
import { authFromQuery } from "../middlewares/authFromQuery.js";
import {
  renderCheckoutPage,
  verifyEjsPayment,
  renderPaymentSuccessPage,
  renderPaymentFailurePage,
  renderPaymentCancelPage,
} from "../controllers/payment/checkout.controller.js";

const router = express.Router();

/**
 * EJS Checkout Routes
 * - Server-rendered payment flow
 * - Does NOT replace API-based Razorpay routes
 */

router.get("/ejs/checkout/:enrollmentId", authFromQuery, renderCheckoutPage);
router.post("/ejs/verify", verifyEjsPayment);
router.get("/ejs/success", renderPaymentSuccessPage);
router.get("/ejs/failure", renderPaymentFailurePage);
router.get("/ejs/cancel", renderPaymentCancelPage);
// Already paid page
router.get("/ejs/already-paid", (req, res) => {
  res.render("payments/alreadyPaid");
});

export default router;
