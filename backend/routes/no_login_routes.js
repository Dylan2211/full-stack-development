const express = require("express");
const router = express.Router();

// Controllers
const taskController = require("../controllers/taskController");
const userController = require("../controllers/userController");
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

// Task routes
router.get("/tasks/:boardId", taskController.getTaskByBoardId);
router.get("/tasks/:id", taskController.getTaskById);
router.post("/tasks", taskController.createTask);
router.put("/tasks/:id", taskController.updateTask);
router.delete("/tasks/:id", taskController.deleteTask);

router.get("/agents", (req, res) => {
  res.json(agents);
});
module.exports = router;
