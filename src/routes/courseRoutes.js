import express from "express";
import { auth } from "../middlewares/auth.js";
import { upload } from "../middlewares/multer.js";
import { requireInstructor } from "../middlewares/requireInstructor.js";
import { createCourse, updateCourse } from "../controllers/courseController.js";

const router = express.Router();

// all routes require login
router.use(auth);

router.post("/", upload.single("thumbnail"), requireInstructor, createCourse);
router.put(
  "/:courseId",
  upload.single("thumbnail"),
  requireInstructor,
  updateCourse
);

export default router;
