import express from "express";
import { auth } from "../middlewares/auth.js";
import { authOptional } from "../middlewares/authOptional.js";
import { requireInstructor } from "../middlewares/requireInstructor.js";
import {
  createLesson,
  listLessonsBySection,
  updateLesson
} from "../controllers/lessonController.js";

const router = express.Router();

// All lesson routes require authentication
router.use(auth);

// Instructor-only
router.post("/", requireInstructor, createLesson);
// Instructor and enrolled student
router.get("/section/:sectionId", listLessonsBySection);
router.put("/:lessonId", requireInstructor, updateLesson);

export default router;
