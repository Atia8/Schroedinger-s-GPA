
const router = require('express').Router();
const Task = require('../models/Task');
const authMiddleware = require('../middleware/authMiddleware'); // ✅ Import Middleware

// ✅ Apply Middleware to ALL routes here
router.use(authMiddleware.authenticateToken);

// CREATE TASK
router.post('/', async (req, res) => {
    try {
        // ✅ Add the User ID from the token to the new task
        const task = new Task({
            ...req.body,
            user: req.user.userId,
            
            status: new Date(req.body.deadline) < new Date() ? 'overdue' : 'ignored',
        });
        
        const savedTask = await task.save();
        res.status(201).json(savedTask);
    } catch (err) {
        console.error(err);
        res.status(500).json(err);
    }
});

// GET ALL TASKS (For the logged-in user only)
router.get('/', async (req, res) => {
    try {
        // ✅ Only find tasks belonging to THIS user
        const tasks = await Task.find({ user: req.user.userId }).sort({ createdAt: -1 });
        res.json(tasks);
    } catch (err) {
        res.status(500).json(err);
    }
});

module.exports = router;