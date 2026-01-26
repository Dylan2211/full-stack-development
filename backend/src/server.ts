import type { Request, Response, NextFunction } from "express";
import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import path from "path";
import helmet from "helmet";
const taskRoutes = require("../routes/taskRoutes");
const userRoutes = require("../routes/userRoutes");
const aiRoutes = require("../routes/aiRoutes");
const dashboardRoutes = require("../routes/dashboardRoutes");
const app = express();
const frontendPath = path.join(__dirname, "../../frontend");
const defaultPort = 3000;

// cd backend
// npx tsc
// npm run dev
//  #region Environment Variable Validation
dotenv.config();
const requiredEnvVars = ["DB_USER", "DB_PASSWORD", "DB_SERVER", "DB_DATABASE", "DB_PORT"];
requiredEnvVars.forEach((varName) => {
  if (!process.env[varName]) {
    console.error(`Error: Missing required environment variable ${varName}`);
    process.exit(1);
  }
});
//  #endregion

app.use(helmet());
app.use(cors({ 
  origin: process.env.ALLOWED_ORIGINS?.split(",") || ["http://localhost:3000", "http://127.0.0.1:5501", "http://localhost:5501"]
}));

app.use(express.json());
app.use("/api/ai", aiRoutes);

app.use(express.urlencoded({ extended: true }));

app.use("/api/users", userRoutes);
app.use("/api/dashboards", dashboardRoutes);
app.use("/api", taskRoutes);

const ROUTES = {
  HOME: "/",
  LOGIN: "/login",
  SIGNUP: "/signup",
  KANBAN: "/kanban",
  DASHBOARD: "/dashboard",
  DASHBOARD_SETTINGS: "/dashboard-settings",
  AI_FILES: "/ai-files",
  SETTINGS: "/settings",
  TEST: "/test"
};
//  #region Frontend routes
app.get(ROUTES.HOME, (req, res) => {
  res.redirect(ROUTES.LOGIN);
});
app.get(ROUTES.LOGIN, (req, res) => {
  res.sendFile(path.join(frontendPath, "login/login.html"));
});
app.get(ROUTES.SIGNUP, (req, res) => {
  res.sendFile(path.join(frontendPath, "signup/signup.html"));
});
app.get(ROUTES.KANBAN, (req, res) => {
  res.sendFile(path.join(frontendPath, "kanban/kanban.html"));
});
app.get(ROUTES.DASHBOARD, (req, res) => {
  res.sendFile(path.join(frontendPath, "dashboard/dashboard.html"));
});
app.get(ROUTES.DASHBOARD_SETTINGS, (req, res) => {
  res.sendFile(path.join(frontendPath, "dashboard-settings/dashboard-settings.html"));
});
app.get(ROUTES.AI_FILES, (req, res) => {
  res.sendFile(path.join(frontendPath, "ai-files/ai-files.html"));
});
app.get(ROUTES.SETTINGS, (req, res) => {
  res.sendFile(path.join(frontendPath, "settings/profile.html"));
});
app.get(ROUTES.TEST, (req, res) => {
  res.sendFile(path.join(frontendPath, "test/task.html"));
});

//  #endregion

// Serve static files AFTER API routes to prevent conflicts
app.use(express.static(frontendPath));
app.use(express.static(path.join(__dirname, "../public")));

// #region Error handling middleware
app.use((req, res, next) => {
  res.status(404).json({ message: "Route not found" });
});
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error("Unhandled error:", err);
  res.status(500).json({ message: "Internal server error" });
});
const PORT = parseInt( process.env.PORT || defaultPort.toString(), 10);
app.listen(PORT, () => {
  console.log("Server is running on port " + PORT);
});
// #endregion
