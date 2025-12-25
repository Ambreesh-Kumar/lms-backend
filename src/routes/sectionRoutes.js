import express from "express";
import { auth } from "../middlewares/auth.js";
import { requireInstructor } from "../middlewares/requireInstructor.js";
import { createSection } from "../controllers/sectionController.js";

const router = express.Router();

// All routes require authentication
router.use(auth);

// Instructor-only
router.post("/", requireInstructor, createSection);

export default router;
