import type{ Request, Response, NextFunction } from "express";  
// npm run dev
// npx tsc or npx tsc--build
import express from "express";
// const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");
const path = require("path");
const taskRoutes = require("../routes/taskRoutes");
const no_login_routes = require("../routes/no_login_routes");
const app = express();

dotenv.config();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use("/no_login_routes", no_login_routes);
app.use(express.static(path.join(__dirname, "../../frontend")));
app.use("/api", taskRoutes);

//  #region Frontend routes
app.get("/", (req, res) => {
  res.redirect("/kanban");
});
app.get("/login", (req, res) => {
  res.sendFile(path.join(__dirname, "../../frontend/login/login.html"));
});
app.get("/kanban", (req, res) => {
  res.sendFile(path.join(__dirname, "../../frontend/kanban/kanban.html"));
});
app.get("/ai-files", (req, res) => {
  res.sendFile(path.join(__dirname, "../../frontend/ai-files/ai-files.html"));
});
app.get("/settings", (req, res) => {
  res.sendFile(path.join(__dirname, "../../frontend/settings/profile.html"));
});
app.get("/test", (req, res) => {
  res.sendFile(path.join(__dirname, "../../frontend/test/task.html"));
});

//  #endregion

// #region Error handling middleware
app.use((req, res, next) => {
  res.status(404).json({ message: "Route not found" });
});
app.use((err, req, res, next) => {
  console.error("Unhandled error:", err );
  res.status(500).json({ message: "Internal server error" });
});
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log("Server is running on port " + PORT);
});
// #endregion