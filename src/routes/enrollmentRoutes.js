import express from "express";
import { auth } from "../middlewares/auth.js";
import { requireInstructor } from "../middlewares/requireInstructor.js";
import { createEnrollment, listMyEnrollments, listCourseEnrollments } from "../controllers/enrollmentController.js";

const router = express.Router();

// All routes require authentication
router.use(auth);

// Student enrolls in course
router.post("/", createEnrollment);

router.get("/me", listMyEnrollments);

// instructor
router.get("/course/:courseId", listCourseEnrollments);

export default router;
