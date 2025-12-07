import express from "express";
import {
  register,
  login,
  refreshToken,
  logout,
} from "../controllers/authController.js";
import {upload} from "../middlewares/multer.js";
import {auth} from "../middlewares/auth.js";

const router = express.Router();

router.post("/register", upload.single("avatar"), register);
router.post("/login", login);
router.get("/refresh_token", refreshToken);
router.post("/logout", auth, logout); // only logged-in user can logout (optional)

export default router;
