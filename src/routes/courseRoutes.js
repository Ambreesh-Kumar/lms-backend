import express from "express";
import { auth } from "../middlewares/auth.js";
import { authOptional } from "../middlewares/authOptional.js";
import { upload } from "../middlewares/multer.js";
import { requireInstructor } from "../middlewares/requireInstructor.js";
import {
  createCourse,
  updateCourse,
  updateCourseStatus,
  listInstructorCourses,
  listPublishedCourses,
  getSingleCourse,
  deleteCourse
} from "../controllers/courseController.js";

const router = express.Router();

/**
 * PUBLIC ROUTES (NO AUTH REQUIRED)
 */
router.get("/published", listPublishedCourses);

/**
 * AUTHENTICATED ROUTES
 */
router.use(auth);

// instructor-specific routes
router.get("/instructor", requireInstructor, listInstructorCourses);

router.post("/", upload.single("thumbnail"), requireInstructor, createCourse);

router.put(
  "/:courseId",
  upload.single("thumbnail"),
  requireInstructor,
  updateCourse
);

router.patch("/:courseId/status", requireInstructor, updateCourseStatus);

router.delete("/:courseId", requireInstructor, deleteCourse);

/**
 * PUBLIC / OPTIONAL AUTH ROUTE (MUST BE LAST)
 */
router.get("/:courseId", authOptional, getSingleCourse);

export default router;
