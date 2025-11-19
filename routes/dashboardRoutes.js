const express = require("express");
const router = express.Router();
const dashboardController = require("../controllers/dashboardController");

router.get("/:id/users", dashboardController.getUsersByDashboard);
router.post("/add", dashboardController.addUser);
router.delete("/remove", dashboardController.removeUser);

module.exports = router;
