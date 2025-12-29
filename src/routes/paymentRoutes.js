import express from "express";
import { auth } from "../middlewares/auth.js";
import { createRazorpayOrder, verifyRazorpayPayment } from "../controllers/paymentController.js";

const router = express.Router();

// student only
router.post("/create-order", auth, createRazorpayOrder);
router.post("/verify", auth, verifyRazorpayPayment);

export default router;
