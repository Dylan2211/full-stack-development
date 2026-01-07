const express = require("express");
const router = express.Router();

// Controllers
const userController = require("../controllers/userController");
const taskController = require("../controllers/taskController");
const boardController = require("../controllers/boardController");
const dashboardController = require("../controllers/dashboardController");
const { agents } = require("../ai/aiAssignAgent");
// Middleware
// No login required

// User routes
router.get("/users", userController.getAllUsers);
router.get("/users/:id", userController.getUserById);
router.post("/register", userController.registerUser);
router.post("/login", userController.loginUser);
router.put("/users/:id", userController.updateUser);
router.delete("/users/:id", userController.deleteUser);

// Dashboard
router.get("/dashboards", dashboardController.getAllDashboards);
router.get ("/dashboards/:dashboardId", dashboardController.getDashboard);

// Board
router.get("/dashboards/:dashboardId/boards", boardController.getBoardByDashboardId);
router.post("/dashboards/:dashboardId/boards", boardController.createBoard);
router.get("/boards/:boardId", boardController.getBoard);
router.post("/boards/:boardId", boardController.updateBoard);
router.delete("/boards/:boardId", boardController.deleteBoard);

// Task
router.get("/boards/:boardId/tasks", taskController.getTasksByBoardId);
router.get("/tasks/:id", taskController.getTask);
router.post("/tasks", taskController.createTask);
router.put("/tasks/:id", taskController.updateTask);
router.delete("/tasks/:id", taskController.deleteTask);

router.get("/agents", (req, res) => {
  res.json(agents);
});

module.exports = router;
