const router = require('express').Router();
const Task = require('../models/Task');


// ✅ CREATE TASK
router.post('/', async (req, res) => {
    try {
        const task = new Task(req.body);
        const savedTask = await task.save();

        res.status(201).json(savedTask);
    } catch (err) {
        res.status(500).json(err);
    }
});


// ✅ GET ALL TASKS
router.get('/', async (req, res) => {
    try {
        const tasks = await Task.find().sort({ createdAt: -1 });

        res.json(tasks);
    } catch (err) {
        res.status(500).json(err);
    }
});

module.exports = router;
