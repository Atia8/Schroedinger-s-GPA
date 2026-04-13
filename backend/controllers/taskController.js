// backend/controllers/taskController.js
const Task                = require("../models/Task");
const NotificationService = require('../services/notificationService');
const { calculateEscalationLevel } = require('../utils/despairUtils');

let notificationService;
const getNotificationService = (socketManager) => {
  if (!notificationService) notificationService = new NotificationService(socketManager);
  return notificationService;
};

exports.getTasks = async (req, res) => {
  try {
    const tasks = await Task.find({ user: req.user.userId }).sort({ createdAt: -1 });
    res.status(200).json(tasks);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch tasks" });
  }
};

exports.createTask = async (req, res) => {
  try {
    const { title, deadline, description } = req.body;
    const socketManager = req.app.get('socketManager');
    const notifService  = getNotificationService(socketManager);

    const deadlineDate = new Date(deadline);
    const now          = new Date();
    const initialStatus = deadlineDate < now ? 'overdue' : 'ignored';

    const newTask = new Task({
      user:           req.user.userId,
      title,
      deadline,
      description,
      status:         initialStatus,
      escalationLevel: calculateEscalationLevel({ status: initialStatus, deadline: deadlineDate, createdAt: now })
    });

    const savedTask = await newTask.save();

    // Notify only if deadline is within 24 hours
    const hoursUntil = (deadlineDate - now) / (1000 * 60 * 60);
    if (hoursUntil <= 24 && hoursUntil > 0) {
      await notifService.createNotification(req.user.userId, {
        type:  'deadline',
        title: 'Deadline Approaching',
        message: `"${title}" is due in ${Math.ceil(hoursUntil)} hours.`,
        metadata: {
          taskId:   savedTask._id,
          deadline,
          priority: hoursUntil < 6 ? 'high' : 'medium',
          actionUrl: `/tasks/${savedTask._id}`
        }
      });
    }

    await notifService.checkAndCreateDespairAlert(req.user.userId);
    res.status(201).json(savedTask);
  } catch (error) {
    console.error("Error creating task:", error);
    res.status(500).json({ message: "Failed to create task" });
  }
};

exports.deleteTask = async (req, res) => {
  try {
    const { id } = req.params;
    const task   = await Task.findOne({ _id: id, user: req.user.userId });
    if (!task) return res.status(404).json({ message: "Task not found" });

    await Task.findOneAndDelete({ _id: id, user: req.user.userId });

    const notifService = getNotificationService(req.app.get('socketManager'));
    await notifService.checkAndCreateDespairAlert(req.user.userId);

    res.status(200).json({ message: "Task deleted" });
  } catch (error) {
    console.error("Error deleting task:", error);
    res.status(500).json({ message: "Failed to delete task" });
  }
};

exports.updateTask = async (req, res) => {
  try {
    const { id }  = req.params;
    const oldTask = await Task.findOne({ _id: id, user: req.user.userId });
    if (!oldTask) return res.status(404).json({ message: "Task not found" });

    const updates = { ...req.body };

    // MODIFIED: Set completedAt when transitioning to 'done'
    // This is required by the momentum factor in calculateDespairIndex.
    if (updates.status === 'done' && oldTask.status !== 'done') {
      updates.completedAt = new Date();
    }

    // MODIFIED: Recompute escalation level on any update
    const updatedStatus   = updates.status   || oldTask.status;
    const updatedDeadline = updates.deadline || oldTask.deadline;
    updates.escalationLevel = calculateEscalationLevel({
      status:    updatedStatus,
      deadline:  updatedDeadline,
      createdAt: oldTask.createdAt
    });

    const updatedTask = await Task.findOneAndUpdate(
      { _id: id, user: req.user.userId },
      updates,
      { new: true }
    );

    const notifService = getNotificationService(req.app.get('socketManager'));

    // Achievement notification on completion
    if (updates.status === 'done' && oldTask.status !== 'done') {
      await notifService.createNotification(req.user.userId, {
        type:  'achievement',
        title: 'Task Completed',
        message: `You finished "${updatedTask.title}". Nice.`,
        metadata: {
          taskId:   updatedTask._id,
          priority: 'low',
          actionUrl: `/tasks/${updatedTask._id}`
        }
      });
    }

    await notifService.checkAndCreateDespairAlert(req.user.userId);
    res.status(200).json(updatedTask);
  } catch (error) {
    console.error("Error updating task:", error);
    res.status(500).json({ message: "Failed to update task" });
  }
};

// ── ADDED: Toggle Schrödinger's Task ─────────────────────────────────────────
// Marks a task as being in quantum superposition.
// At deadline, a cron job in index.js resolves it randomly.
// Add to taskRoutes.js: router.patch('/:id/schrodinger', auth, taskController.toggleSchrodinger);
exports.toggleSchrodinger = async (req, res) => {
  try {
    const { id } = req.params;
    const task   = await Task.findOne({ _id: id, user: req.user.userId });
    if (!task) return res.status(404).json({ message: "Task not found" });

    // Can't mark as Schrödinger if already resolved or already done
    if (task.schrodingerResolved) {
      return res.status(400).json({
        message: "The wave function has already collapsed. Too late for superposition."
      });
    }
    if (task.status === 'done' || task.status === 'completed') {
      return res.status(400).json({
        message: "Task is already done. Schrödinger's cat is definitely alive."
      });
    }

    const newValue = !task.isSchrodinger;
    const updated  = await Task.findOneAndUpdate(
      { _id: id, user: req.user.userId },
      { isSchrodinger: newValue },
      { new: true }
    );

    res.json({
      task: updated,
      message: newValue
        ? `"${task.title}" is now in superposition. Simultaneously done and not done. The deadline will decide.`
        : `"${task.title}" has been pulled out of superposition. Back to regular dread.`
    });
  } catch (err) {
    console.error("Error toggling Schrödinger:", err);
    res.status(500).json({ message: "Quantum state error." });
  }
};

// ── ADDED: Bulk escalation update ────────────────────────────────────────────
// Called by the cron job in index.js every 6 hours.
// Updates escalationLevel on all non-done tasks.
exports.updateAllEscalationLevels = async () => {
  try {
    const now         = new Date();
    const activeTasks = await Task.find({
      status: { $nin: ['done', 'completed'] }
    });

    let updateCount = 0;
    for (const task of activeTasks) {
      const newLevel = calculateEscalationLevel(task);
      if (newLevel !== task.escalationLevel) {
        await Task.updateOne({ _id: task._id }, { escalationLevel: newLevel });
        updateCount++;
      }
    }
    console.log(`[Escalation] Updated ${updateCount} of ${activeTasks.length} tasks`);
  } catch (err) {
    console.error('[Escalation] Cron job failed:', err);
  }
};

// ── ADDED: Resolve Schrödinger tasks at deadline ──────────────────────────────
// Called by the cron job in index.js every hour.
exports.resolveSchrodingerTasks = async (socketManager) => {
  try {
    const now = new Date();
    const notifService = new NotificationService(socketManager);

    // Find Schrödinger tasks whose deadline has passed and haven't been resolved yet
    const tasks = await Task.find({
      isSchrodinger:       true,
      schrodingerResolved: false,
      deadline:            { $lte: now }
    }).populate('user');

    for (const task of tasks) {
      // 50/50 quantum collapse
      const outcome = Math.random() < 0.5 ? 'submitted' : 'failed';
      const newStatus = outcome === 'submitted' ? 'done' : 'overdue';

      await Task.findByIdAndUpdate(task._id, {
        schrodingerResolved: true,
        schrodingerOutcome:  outcome,
        status:              newStatus,
        completedAt:         outcome === 'submitted' ? now : null
      });

      // Notify user of the collapse
      const npcLines = {
        submitted: [
          `"${task.title}" — the cat was alive. Somehow, the universe submitted it for you.`,
          `Wave function collapsed. "${task.title}" is marked submitted. You're welcome.`,
          `The quantum experiment resolved in your favor. "${task.title}" — done. Don't ask how.`
        ],
        failed: [
          `"${task.title}" — the cat is dead. The assignment was not submitted. Obviously.`,
          `The wave function collapsed on "${task.title}". The universe chose 'failed'. Typical.`,
          `Schrödinger's result for "${task.title}": the box opened, and nothing was inside.`
        ]
      };

      const lines   = npcLines[outcome];
      const message = lines[Math.floor(Math.random() * lines.length)];

      await notifService.createNotification(task.user._id, {
        type:  'achievement',
        title: outcome === 'submitted' ? '⚛️ Wave Function Collapsed — Success' : '⚛️ Wave Function Collapsed — Failed',
        message,
        metadata: {
          taskId:   task._id,
          priority: outcome === 'submitted' ? 'low' : 'high',
          actionUrl: `/analytics`
        }
      });

      console.log(`[Schrödinger] "${task.title}" resolved as: ${outcome}`);
    }
  } catch (err) {
    console.error('[Schrödinger] Resolution cron failed:', err);
  }
};
