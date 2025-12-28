import express from "express";
import { auth } from "../middlewares/auth.js";
import { createRazorpayOrder } from "../controllers/paymentController.js";

const router = express.Router();

// student only
router.post("/create-order", auth, createRazorpayOrder);

export default router;
