
const router = require('express').Router();
const Task = require('../models/Task');
const authMiddleware = require('../middleware/authMiddleware'); // ✅ Import Middleware

// ✅ Apply Middleware to ALL routes here
router.use(authMiddleware.authenticateToken);

// CREATE TASK
router.post('/', async (req, res) => {
    try {
        const { title, deadline } = req.body;
        
        // Validate required fields
        if (!title || !deadline) {
            return res.status(400).json({ error: 'Title and deadline are required' });
        }

        // ✅ Add the User ID from the token to the new task
        const task = new Task({
            ...req.body,
            user: req.user.userId,
            status: new Date(req.body.deadline) < new Date() ? 'overdue' : 'ignored',
        });
        
         
        task.despairContribution = calculateDespair(task);

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

// DELETE TASK
router.delete('/:id', async (req, res) => {
  try {
    const task = await Task.findOneAndDelete({
      _id: req.params.id,
      user: req.user.userId // only allow owner
    });

    if (!task) return res.status(404).json({ message: "Task not found" });

    res.json({ message: "Task deleted successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json(err);
  }
});



module.exports = router;





function calculateDespair(task) {
    let despair = 0;

    const today = new Date();
    const deadlineDate = new Date(task.deadline);

    // 1️⃣ Base despair from status
    switch (task.status) {
        case 'done':
            despair = 0;
            break;
        case 'ignored':
            despair = 5;
            break;
        case 'pending':
            despair = 10;
            break;
        case 'in-progress':
            despair = 7;
            break;
        case 'overdue':
            despair = 20;
            break;
        default:
            despair = 10;
    }

    // 2️⃣ Extra despair if deadline is near
    if (deadlineDate > today) {
        const diffDays = Math.ceil((deadlineDate - today) / (1000 * 60 * 60 * 24));
        if (diffDays <= 3) despair += 5;
        else if (diffDays <= 7) despair += 2;
    } else if (deadlineDate < today && task.status !== 'done') {
        // Overdue tasks get extra despair
        despair += 10;
    }

    // 3️⃣ Optional: escalation level
    //if (task.escalationLevel === 'high') despair += 5;

     if (despair >= 30) {
        task.status = 'panic';
    }
    return despair;
}

