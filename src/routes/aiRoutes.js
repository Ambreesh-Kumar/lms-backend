import express from "express";
import { auth } from "../middlewares/auth.js";
import { requireAdmin } from "../middlewares/requireAdmin.js";

import {
  generateLessonSummary,
  generateLessonMCQs,
  answerLessonQuestion,
} from "../controllers/aiController.js";

const router = express.Router();

/**
 * AI routes — Admin only
 */
router.use(auth);
router.use(requireAdmin);

/**
 * Lesson AI
 */
router.post("/lesson/:lessonId/summary", generateLessonSummary);
router.post("/lesson/:lessonId/mcqs", generateLessonMCQs);
router.post("/lesson/:lessonId/qna", answerLessonQuestion);

export default router;
