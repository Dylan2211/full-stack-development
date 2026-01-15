const express = require("express");
const router = express.Router();

// Controllers
const taskController = require("../controllers/taskController");
const boardController = require("../controllers/boardController");
const dashboardController = require("../controllers/dashboardController");
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

// Dashboard routes (protected)
router.get("/dashboards", authMiddleware, dashboardController.getAllDashboards);
router.get("/dashboards/:dashboardId", authMiddleware, dashboardController.getDashboard);

// Board routes (protected)
router.get("/dashboards/:dashboardId/boards", authMiddleware, boardController.getBoardByDashboardId);
router.post("/dashboards/:dashboardId/boards", authMiddleware, boardController.createBoard);
router.get("/boards/:boardId", authMiddleware, boardController.getBoard);
router.put("/boards/:boardId", authMiddleware, boardController.updateBoard);
router.delete("/boards/:boardId", authMiddleware, boardController.deleteBoard);

// Task routes (protected)
router.get("/boards/:boardId/tasks", authMiddleware, taskController.getTasksByBoardId);
router.get("/tasks/:id", authMiddleware, taskController.getTask);
router.post("/tasks", authMiddleware, taskController.createTask);
router.put("/tasks/:id", authMiddleware, taskController.updateTask);
router.delete("/tasks/:id", authMiddleware, taskController.deleteTask);

router.get("/agents", (req, res) => {
  res.json(agents);
});
module.exports = router;
