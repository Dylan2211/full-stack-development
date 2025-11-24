const express = require("express");
const router = express.Router();

// Controllers
const taskController = require("../controllers/taskController");
const userController = require("../controllers/userController");

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
router.get("/tasks", authMiddleware, taskController.getAllTasks);
router.get("/tasks/:id", authMiddleware, taskController.getTaskById);
router.post("/tasks", authMiddleware, taskController.createTask);
router.put("/tasks/:id", authMiddleware, taskController.updateTask);
router.delete("/tasks/:id", authMiddleware, taskController.deleteTask);

module.exports = router;
