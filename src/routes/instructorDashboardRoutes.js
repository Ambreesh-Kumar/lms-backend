import express from "express";
import { auth } from "../middlewares/auth.js";
import { requireInstructor } from "../middlewares/requireInstructor.js";
import { getInstructorDashboard } from "../controllers/instructorDashboardController.js";

const router = express.Router();

router.use(auth);
router.use(requireInstructor);

router.get("/dashboard", getInstructorDashboard);

export default router;
