import express from "express";
import { auth } from "../middlewares/auth.js";
import { markLessonCompleted, getCourseProgress } from "../controllers/progressController.js";

const router = express.Router();

router.use(auth);

// student
router.post("/complete", markLessonCompleted);
router.get("/course/:courseId", getCourseProgress);

export default router;
