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
import instructorDashboardRoutes from "./routes/instructorDashboardRoutes.js";
import adminDashboardRoutes from "./routes/adminDashboardRoutes.js";
import paymentRoutes from "./routes/paymentRoutes.js";
import paymentEjsRoutes from "./routes/payment.ejs.routes.js";
import errorHandler from "./middlewares/errorHandler.js";
import path from "path";
import { fileURLToPath } from "url";

const app = express();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Body parser
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(express.static(path.join(__dirname, "public")));

// Cookies
app.use(cookieParser());

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

// CORS
app.use(
  cors({
    origin: process.env.CLIENT_URL === "*" ? true : process.env.CLIENT_URL,
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
app.use("/api/admin", adminDashboardRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/payments", paymentEjsRoutes);

// global error handler at last after all routes
app.use(errorHandler);

export default app;
