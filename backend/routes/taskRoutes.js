const router = require('express').Router();
const Task = require('../models/Task');
const authMiddleware = require('../middleware/authMiddleware');
const taskController = require('../controllers/taskController');

// ✅ Apply Middleware to ALL routes here
router.use(authMiddleware.authenticateToken);

// Use controller functions
router.post('/', taskController.createTask);
router.get('/', taskController.getTasks);
router.delete('/:id', taskController.deleteTask);
router.patch('/:id', taskController.updateTask);

// NEW: Schrödinger toggle route (Fixed: removed the auth object)
router.patch('/:id/schrodinger', taskController.toggleSchrodinger);

module.exports = router;