import express from "express";
import { auth } from "../middlewares/auth.js";
import {
  markLessonCompleted,
  getCourseProgress,
  getLessonCompletionMap,
} from "../controllers/progressController.js";

const router = express.Router();

router.use(auth);

// student
router.post("/complete", markLessonCompleted);
router.get("/course/:courseId", getCourseProgress);
router.get("/course/:courseId/lessons", getLessonCompletionMap);

export default router;
