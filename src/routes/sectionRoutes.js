import express from "express";
import { auth } from "../middlewares/auth.js";
import { authOptional } from "../middlewares/authOptional.js";
import { requireInstructor } from "../middlewares/requireInstructor.js";
import {
  createSection,
  listSections,
  updateSection,
  deleteSection
} from "../controllers/sectionController.js";

const router = express.Router();

// public route
router.get("/course/:courseId", authOptional, listSections);

// All routes require authentication
router.use(auth);

// Instructor-only
router.post("/", requireInstructor, createSection);
router.put("/:sectionId", requireInstructor, updateSection);
router.delete("/:sectionId", requireInstructor, deleteSection);


export default router;
