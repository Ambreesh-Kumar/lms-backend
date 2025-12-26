import express from "express";
import { auth } from "../middlewares/auth.js";
import { requireInstructor } from "../middlewares/requireInstructor.js";
import { createLesson } from "../controllers/lessonController.js";

const router = express.Router();

// All lesson routes require authentication
router.use(auth);

// Instructor-only
router.post("/", requireInstructor, createLesson);

export default router;
