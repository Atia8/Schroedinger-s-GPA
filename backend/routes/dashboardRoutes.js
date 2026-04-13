const express = require("express");
const router = express.Router();
const dashboardController = require("../controllers/dashboardController");
const authMiddleware = require("../middleware/authMiddleware");

router.get("/", authMiddleware.authenticateToken, dashboardController.getDashboardData);

// FIXED: Now specifically calling the authenticateToken function
router.post('/accept-fate', authMiddleware.authenticateToken, dashboardController.acceptFate);

module.exports = router;