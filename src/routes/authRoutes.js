import express from "express";
import {
  register,
  login,
  refreshToken,
  logout,
  getMe,
} from "../controllers/authController.js";
import { upload } from "../middlewares/multer.js";
import { auth } from "../middlewares/auth.js";

const router = express.Router();

router.post("/register", upload.single("avatar"), register);
router.post("/login", login);
router.get("/refresh_token", refreshToken);
router.post("/logout", auth, logout); // only logged-in user can logout (optional)
router.get("/me", auth, getMe);

export default router;
