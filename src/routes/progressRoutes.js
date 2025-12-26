import express from "express";
import { auth } from "../middlewares/auth.js";
import { markLessonCompleted } from "../controllers/progressController.js";

const router = express.Router();

router.use(auth);

// student
router.post("/complete", markLessonCompleted);

export default router;
