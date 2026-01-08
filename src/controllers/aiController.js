import mongoose from "mongoose";
import asyncHandler from "../utils/AsyncHandler.js";
import ApiError from "../utils/ApiError.js";

import { Lesson } from "../models/Lesson.js";
import { Section } from "../models/Section.js";
import { Course } from "../models/Course.js";

import { aiService } from "../services/ai.service.js";

/**
 * Shared helper
 * Securely fetch lesson + course
 * Admin-only usage (route protected)
 */
async function fetchLessonWithCourse(lessonId) {
  if (!mongoose.Types.ObjectId.isValid(lessonId)) {
    throw new ApiError(400, "Invalid lesson id");
  }

  const lesson = await Lesson.findById(lessonId).lean();
  if (!lesson) {
    throw new ApiError(404, "Lesson not found");
  }

  const section = await Section.findById(lesson.section).lean();
  if (!section) {
    throw new ApiError(404, "Section not found");
  }

  const course = await Course.findById(section.course)
    .select("_id title status")
    .lean();

  if (!course) {
    throw new ApiError(404, "Course not found");
  }

  if (course.status !== "published") {
    throw new ApiError(
      400,
      "AI features are allowed only for published courses"
    );
  }

  return { lesson, course };
}

/**
 * ADMIN — Generate Lesson Summary
 * POST /api/ai/lesson/:lessonId/summary
 */
export const generateLessonSummary = asyncHandler(async (req, res) => {
  const { lessonId } = req.params;

  const { lesson } = await fetchLessonWithCourse(lessonId);

  const summary = await aiService.generateLessonSummary({ lesson });

  res.status(200).json({
    success: true,
    data: {
      lessonId,
      summary,
    },
  });
});

/**
 * ADMIN — Generate MCQs
 * POST /api/ai/lesson/:lessonId/mcqs
 */
export const generateLessonMCQs = asyncHandler(async (req, res) => {
  const { lessonId } = req.params;

  const { lesson } = await fetchLessonWithCourse(lessonId);

  const mcqs = await aiService.generateMCQs({ lesson });

  res.status(200).json({
    success: true,
    data: {
      lessonId,
      questions: Array.isArray(mcqs.questions) ? mcqs.questions : [],
    },
  });
});

/**
 * ADMIN — Lesson-based Q&A
 * POST /api/ai/lesson/:lessonId/qna
 */
export const answerLessonQuestion = asyncHandler(async (req, res) => {
  const { lessonId } = req.params;
  const { question } = req.body;

  if (!question || typeof question !== "string" || !question.trim()) {
    throw new ApiError(400, "Question is required");
  }

  const { lesson } = await fetchLessonWithCourse(lessonId);

  const answer = await aiService.answerLessonQuestion({
    lesson,
    question: question.trim(),
  });

  res.status(200).json({
    success: true,
    data: {
      lessonId,
      question: question.trim(),
      answer,
    },
  });
});
