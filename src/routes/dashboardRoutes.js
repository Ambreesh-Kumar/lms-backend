import express from "express";
import { auth } from "../middlewares/auth.js";
import { getStudentDashboard } from "../controllers/dashboardController.js";

const router = express.Router();

// Student dashboard
router.get("/student", auth, getStudentDashboard);

export default router;
