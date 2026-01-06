const express = require("express");
const router = express.Router();

// Controllers
const taskController = require("../controllers/taskController");
const userController = require("../controllers/userController");
const { agents } = require("../ai/aiAssignAgent");

// Middleware
const { authMiddleware } = require("../middleware/jwtAuth");
const { validateRegistration } = require("../middleware/registerValidation");
const { validateLogin } = require("../middleware/loginValidation");

// User routes
router.get("/users", authMiddleware, userController.getAllUsers);
router.get("/users/:id", authMiddleware, userController.getUserById);
router.post("/register", validateRegistration, userController.registerUser);
router.post("/login", validateLogin, userController.loginUser);
router.put("/users/:id", authMiddleware, userController.updateUser);
router.delete("/users/:id", authMiddleware, userController.deleteUser);

// Task routes
router.get("/dashboards/:dashboardId/boards", taskController.getBoardByDashboardId);
router.post("/dashboards/:dashboardId/boards", taskController.createBoard);
router.get("/boards/:boardId/tasks", authMiddleware, taskController.getTasksByBoardId);
router.get("/boards/:boardId", authMiddleware, taskController.getBoard);
router.get("/tasks/:id", authMiddleware, taskController.getTask);
router.post("/tasks", authMiddleware, taskController.createTask);
router.put("/tasks/:id", authMiddleware, taskController.updateTask);
router.delete("/tasks/:id", authMiddleware, taskController.deleteTask);

router.get("/agents", (req, res) => {
  res.json(agents);
});
module.exports = router;
