import express from "express";
import { auth } from "../middlewares/auth.js";
import { authOptional } from "../middlewares/authOptional.js";
import { requireInstructor } from "../middlewares/requireInstructor.js";
import {
  createSection,
  listSections,
  updateSection 
} from "../controllers/sectionController.js";

const router = express.Router();

// public route
router.get("/course/:courseId", authOptional, listSections);

// All routes require authentication
router.use(auth);

// Instructor-only
router.post("/", requireInstructor, createSection);
router.put("/:sectionId", requireInstructor, updateSection);


export default router;
