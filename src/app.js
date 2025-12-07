import express from "express";
import cookieParser from "cookie-parser";
import cors from "cors";
import authRoutes from "./routes/authRoutes.js";

const app = express();

// Body parser
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Cookies
app.use(cookieParser())

// CORS
// If you keep frontend on different origin, set credentials and origin properly.
app.use(
  cors({
    origin: "http://localhost:3000", // change to your frontend origin
    credentials: true,
  })
);
// routes
app.use("/api/auth/", authRoutes)

export default app;
