const express = require("express");
const router = express.Router();

// Controllers
const taskController = require("../controllers/taskController");
const userController = require("../controllers/userController");
const dashboardController = require("../controllers/dashboardController");
const { agents } = require("../ai/aiAssignAgent");
// Middleware
const { validateRegistration } = require("../middleware/registerValidation");
// No login required

// User routes
router.get("/users", userController.getAllUsers);
router.get("/users/:id", userController.getUserById);
router.post("/register", validateRegistration, userController.registerUser);
router.post("/login", userController.loginUser);
router.put("/users/:id", userController.updateUser);
router.delete("/users/:id", userController.deleteUser);

// Dashboard
router.get("/dashboards", dashboardController.getAllDashboards);

// Task
router.get ("/dashboards/:dashboardId", taskController.getDashboard);
router.get("/dashboards/:dashboardId/boards", taskController.getBoardByDashboardId);
router.post("/dashboards/:dashboardId/boards", taskController.createBoard);
router.get("/boards/:boardId/tasks", taskController.getTasksByBoardId);
router.get("/boards/:boardId", taskController.getBoard);
router.get("/tasks/:id", taskController.getTask);
router.post("/tasks", taskController.createTask);
router.put("/tasks/:id", taskController.updateTask);
router.delete("/tasks/:id", taskController.deleteTask);

router.get("/agents", (req, res) => {
  res.json(agents);
});

module.exports = router;
