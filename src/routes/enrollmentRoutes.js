import express from "express";
import { auth } from "../middlewares/auth.js";
import { requireInstructor } from "../middlewares/requireInstructor.js";
import {
  createEnrollment,
  listMyEnrollments,
  listCourseEnrollments,
  updateEnrollmentStatus
} from "../controllers/enrollmentController.js";

const router = express.Router();

// All routes require authentication
router.use(auth);

// Student
router.post("/", createEnrollment);
router.get("/me", listMyEnrollments);

// instructor
router.get("/course/:courseId", requireInstructor, listCourseEnrollments);
router.patch(
  "/:enrollmentId/status",
  requireInstructor,
  updateEnrollmentStatus
);

export default router;
