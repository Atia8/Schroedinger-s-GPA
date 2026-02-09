const express = require("express");
const router = express.Router();
const authController = require("../controllers/authController");
const authMiddleware = require("../middleware/authMiddleware");

router.post("/register", authController.register);
router.post("/login", authController.login);

// Protected route example
router.get("/dashboard", authMiddleware.authenticateToken, (req, res) => {
  res.json({
    success: true,
    message: "Welcome to your dashboard",
    data: {
      despairLevel: 78,
      tasksPending: 5,
      tasksOverdue: 3,
      motivationalQuote: "You had all day yesterday, you have all day today..."
    }
  });
});

module.exports = router;