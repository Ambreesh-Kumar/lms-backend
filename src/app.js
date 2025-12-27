import express from "express";
import cookieParser from "cookie-parser";
import cors from "cors";
import authRoutes from "./routes/authRoutes.js";
import courseRoutes from "./routes/courseRoutes.js";
import sectionRoutes from "./routes/sectionRoutes.js";
import lessonRoutes from "./routes/lessonRoutes.js";
import enrollmentRoutes from "./routes/enrollmentRoutes.js";
import progressRoutes from "./routes/progressRoutes.js";
import dashboardRoutes from "./routes/dashboardRoutes.js";
import instructorDashboardRoutes from "./routes/instructorDashboardRoutes.js"
import errorHandler from "./middlewares/errorHandler.js";

const app = express();

// Body parser
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Cookies
app.use(cookieParser());

// CORS
// If you keep frontend on different origin, set credentials and origin properly.
app.use(
  cors({
    origin: "http://localhost:3000", // change to your frontend origin
    credentials: true,
  })
);
// routes
app.use("/api/auth/", authRoutes);
app.use("/api/v1/courses", courseRoutes);
app.use("/api/sections", sectionRoutes);
app.use("/api/lessons", lessonRoutes);
app.use("/api/enrollments", enrollmentRoutes);
app.use("/api/progress", progressRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/instructor", instructorDashboardRoutes);

// global error handler at last after all routes
app.use(errorHandler);

export default app;
