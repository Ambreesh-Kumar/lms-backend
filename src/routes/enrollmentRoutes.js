import express from "express";
import { auth } from "../middlewares/auth.js";
import { requireInstructor } from "../middlewares/requireInstructor.js";
import { createEnrollment, listMyEnrollments } from "../controllers/enrollmentController.js";

const router = express.Router();

// All routes require authentication
router.use(auth);

// student routes
router.get("/me", listMyEnrollments);

// Student enrolls in course
router.post("/", createEnrollment);

export default router;
