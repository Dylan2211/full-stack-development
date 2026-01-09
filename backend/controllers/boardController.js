const boardModel = require("../models/boardModel");

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
    const name = (req.body.name || "").trim();
    if (!name) {
      return res.status(400).json({ error: "Board name is required" });
    }
    const updated = await boardModel.updateBoard({ boardId, name });
    if (!updated) {
      return res.status(404).json({ error: "Board not found" });
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
    const deleted = await boardModel.deleteBoard(boardId); 
    if (!deleted) {
      return res.status(404).json({ error: "Board not found" });
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