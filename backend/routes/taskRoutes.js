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

module.exports = router;