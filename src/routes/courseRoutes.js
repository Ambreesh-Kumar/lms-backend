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
  getSingleCourse 
} from "../controllers/courseController.js";

const router = express.Router();

// public routes
router.get("/published", listPublishedCourses);

router.get("/:courseId", authOptional, getSingleCourse);

// routes require login
router.use(auth);

router.post("/", upload.single("thumbnail"), requireInstructor, createCourse);
router.put(
  "/:courseId",
  upload.single("thumbnail"),
  requireInstructor,
  updateCourse
);
router.patch("/:courseId/status", requireInstructor, updateCourseStatus);
router.get("/instructor", requireInstructor, listInstructorCourses);

export default router;
