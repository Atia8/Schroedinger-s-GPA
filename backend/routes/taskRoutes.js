// const router = require('express').Router();
// const Task = require('../models/Task');


// // ✅ CREATE TASK
// router.post('/', async (req, res) => {
//     try {
//         const task = new Task(req.body);
//         const savedTask = await task.save();

//         res.status(201).json(savedTask);
//     } catch (err) {
//         res.status(500).json(err);
//     }
// });


// // ✅ GET ALL TASKS
// router.get('/', async (req, res) => {
//     try {
//         const tasks = await Task.find().sort({ createdAt: -1 });

//         res.json(tasks);
//     } catch (err) {
//         res.status(500).json(err);
//     }
// });

// module.exports = router;


// routes/taskRoutes.js
const router = require('express').Router();
const Task = require('../models/Task');
const authMiddleware = require('../middleware/authMiddleware');

// ✅ GET all tasks of the logged-in user
router.get('/', authMiddleware.authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id; // user ID from JWT
    const tasks = await Task.find({ user: userId }).sort({ createdAt: -1 });
    res.status(200).json(tasks);
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ✅ CREATE a task for the logged-in user
router.post('/', authMiddleware.authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;

    const task = new Task({
      ...req.body, // title, deadline, etc.
      user: userId // assign task to this user
    });

    const savedTask = await task.save();
    res.status(201).json(savedTask);
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
