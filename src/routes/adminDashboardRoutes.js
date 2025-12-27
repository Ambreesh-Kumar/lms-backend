import express from "express";
import { auth } from "../middlewares/auth.js";
import { requireAdmin } from "../middlewares/requireAdmin.js";
import { getAdminDashboard } from "../controllers/adminDashboardController.js";

const router = express.Router();

router.use(auth);
router.use(requireAdmin);

router.get("/dashboard", getAdminDashboard);

export default router;
