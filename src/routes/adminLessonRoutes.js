import express from "express";
import { auth } from "../middlewares/auth.js";
import { requireAdmin } from "../middlewares/requireAdmin.js";
import { listLessonsBySectionAdmin } from "../controllers/lessonController.js";

const router = express.Router();

// All admin lesson routes require auth + admin role
router.use(auth);
router.use(requireAdmin);

// Admin can list lessons of any section
router.get("/section/:sectionId", listLessonsBySectionAdmin);

export default router;
