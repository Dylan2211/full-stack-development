const express = require("express");
const router = express.Router();

// Controllers
const taskController = require("../controllers/taskController");
const boardController = require("../controllers/boardController");
const { agents } = require("../ai/aiAssignAgent");

// Middleware
const { authMiddleware } = require("../middleware/jwtAuth");
const { checkDashboardPermission, checkDashboardAccess } = require("../middleware/permissionCheck");
const { checkBoardPermission, checkDashboardForBoardCreation } = require("../middleware/boardPermissionCheck");
const { checkTaskPermission, checkBoardForTaskCreation } = require("../middleware/taskPermissionCheck");

// Board routes - nested under dashboards
router.get("/dashboards/:dashboardId/boards", authMiddleware, checkDashboardAccess(), boardController.getBoardByDashboardId);
router.post("/dashboards/:dashboardId/boards", authMiddleware, checkDashboardForBoardCreation(['Owner', 'Editor']), boardController.createBoard);
router.get("/boards/:boardId", authMiddleware, checkBoardPermission(['Owner', 'Editor', 'Viewer']), boardController.getBoard);
router.put("/boards/:boardId", authMiddleware, checkBoardPermission(['Owner', 'Editor']), boardController.updateBoard);
router.delete("/boards/:boardId", authMiddleware, checkBoardPermission(['Owner']), boardController.deleteBoard);

// Task routes
router.get("/boards/:boardId/tasks", authMiddleware, checkBoardPermission(['Owner', 'Editor', 'Viewer']), taskController.getTasksByBoardId);
router.get("/tasks/:id", authMiddleware, checkTaskPermission(['Owner', 'Editor', 'Viewer']), taskController.getTask);
router.post("/tasks", authMiddleware, checkBoardForTaskCreation(['Owner', 'Editor']), taskController.createTask);
router.put("/tasks/:id", authMiddleware, checkTaskPermission(['Owner', 'Editor']), taskController.updateTask);
router.delete("/tasks/:id", authMiddleware, checkTaskPermission(['Owner', 'Editor']), taskController.deleteTask);

// Agents endpoint (public utility endpoint)
router.get("/agents", (req, res) => {
  res.json(agents);
});

module.exports = router;
