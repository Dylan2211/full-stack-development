const boardModel = require("../models/boardModel");
const userAnalyticsModel = require("../models/userAnalyticsModel");

async function createBoard(req, res) {
  try {
    const dashboardId = parseInt(req.params.dashboardId || req.body.dashboardId);
    const name = (req.body.name || "").trim();

    if (!dashboardId || Number.isNaN(dashboardId)) {
      return res.status(400).json({ error: "DashboardId is required" });
    }

    if (!name) {
      return res.status(400).json({ error: "Board name is required" });
    }

    const board = await boardModel.createBoard({ dashboardId, name });
    
    // Log user activity
    const userId = req.user?.userId || req.user?.id;
    if (userId) {
      await userAnalyticsModel.logUserActivity(
        userId,
        dashboardId,
        'board_created',
        `Created board "${name}"`,
        null,
        board.BoardId
      );
    }
    
    res.status(201).json(board);
  } catch (error) {
    console.error("Error creating board:", error);
    res.status(500).json({ error: "Internal server error" });
  }
}

async function getBoard(req, res) {
  try {
    const boardId = parseInt(req.params.boardId);
    const board = await boardModel.getBoard(boardId);
    if (!board) {
      return res.status(404).json({ error: "Board not found" });
    }
    res.json(board);
  } catch (error) {
    console.error(`Error getting board by id: ${error}`);
    res.status(500).json({ error: "Internal server error" });
  }
}

async function getBoardByDashboardId(req, res) {
  try {
    const dashboardId = parseInt(req.params.dashboardId);
    const boards = await boardModel.getBoardByDashboardId(dashboardId);
    res.json(boards);
  } catch (error) {
    console.error(`Error getting boards by dashboard id: ${error}`);
    res.status(500).json({ error: "Internal server error" });
  }
}

async function updateBoard(req, res) {
  try {
    const boardId = parseInt(req.params.boardId);
    const name = req.body.name ? (req.body.name || "").trim() : undefined;
    const position = req.body.position !== undefined ? parseInt(req.body.position) : undefined;

    if (name === "" && position === undefined) {
      return res.status(400).json({ error: "Board name or position is required" });
    }

    // Get board info before update for activity logging
    const board = await boardModel.getBoard(boardId);
    
    const updated = await boardModel.updateBoard({ boardId, name, position });
    if (!updated) {
      return res.status(404).json({ error: "Board not found" });
    }

    // Log user activity
    const userId = req.user?.userId || req.user?.id;
    if (userId && board) {
      const changeDescription = name ? `renamed board to "${name}"` : `updated board position`;
      await userAnalyticsModel.logUserActivity(
        userId,
        board.DashboardId,
        'board_updated',
        `${changeDescription}`,
        null,
        boardId
      );
    }

    res.json({ message: "Board updated successfully" });
  } catch (error) {
    console.error(`Error updating board: ${error}`);
    res.status(500).json({ error: "Internal server error" });
  }
}

async function deleteBoard(req, res) {
  try {
    const boardId = parseInt(req.params.boardId);
    const targetBoardId = req.body.targetBoardId ? parseInt(req.body.targetBoardId) : null;
    
    // Get board info before delete for activity logging
    const board = await boardModel.getBoard(boardId);
    
    const deleted = await boardModel.deleteBoard(boardId, targetBoardId); 
    if (!deleted) {
      return res.status(404).json({ error: "Board not found" });
    }

    // Log user activity
    const userId = req.user?.userId || req.user?.id;
    if (userId && board) {
      await userAnalyticsModel.logUserActivity(
        userId,
        board.DashboardId,
        'board_deleted',
        `Deleted board "${board.Name || 'Untitled'}"`,
        null,
        boardId
      );
    }

    res.json({ message: "Board deleted successfully" });
  } catch (error) {
    console.error(`Error deleting board: ${error}`);
    res.status(500).json({ error: "Internal server error" });
  }
}

module.exports = {
    createBoard,
    getBoard,
    getBoardByDashboardId,
    updateBoard,
    deleteBoard,
};