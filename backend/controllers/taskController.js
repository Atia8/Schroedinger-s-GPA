const Task = require("../models/Task");
const NotificationService = require('../services/notificationService');

let notificationService;

const getNotificationService = (socketManager) => {
  if (!notificationService) {
    notificationService = new NotificationService(socketManager);
  }
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
    const notifService = getNotificationService(socketManager);

    const newTask = new Task({
      user: req.user.userId,
      title,
      deadline,
      description,
      escalationLevel: "normal",
      status: new Date(deadline) < new Date() ? 'overdue' : 'pending'
    });

    newTask.despairContribution = calculateDespair(newTask);
    const savedTask = await newTask.save();

    // ONLY create deadline notification if deadline is within 24 hours
    const now = new Date();
    const taskDeadline = new Date(deadline);
    const hoursUntilDeadline = (taskDeadline - now) / (1000 * 60 * 60);
    
    if (hoursUntilDeadline <= 24 && hoursUntilDeadline > 0) {
      await notifService.createNotification(req.user.userId, {
        type: 'deadline',
        title: '⏰ Deadline Approaching!',
        message: `"${title}" is due in ${Math.ceil(hoursUntilDeadline)} hours.`,
        metadata: {
          taskId: savedTask._id,
          deadline: deadline,
          priority: hoursUntilDeadline < 6 ? 'high' : 'medium',
          actionUrl: `/tasks/${savedTask._id}`
        }
      });
    }

    // Check despair level (only if user has despair alerts enabled)
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
    const task = await Task.findOne({ _id: id, user: req.user.userId });
    
    if (!task) {
      return res.status(404).json({ message: "Task not found" });
    }
    
    await Task.findOneAndDelete({ _id: id, user: req.user.userId });
    
    // REMOVED: No notification for task deletion (too spammy)
    // Only check despair after deletion
    const socketManager = req.app.get('socketManager');
    const notifService = getNotificationService(socketManager);
    await notifService.checkAndCreateDespairAlert(req.user.userId);
    
    res.status(200).json({ message: "Task deleted" });
  } catch (error) {
    console.error("Error deleting task:", error);
    res.status(500).json({ message: "Failed to delete task" });
  }
};

exports.updateTask = async (req, res) => {
  try {
    const { id } = req.params;
    const oldTask = await Task.findOne({ _id: id, user: req.user.userId });
    
    if (!oldTask) {
      return res.status(404).json({ message: "Task not found" });
    }
    
    const updatedTask = await Task.findOneAndUpdate(
      { _id: id, user: req.user.userId },
      req.body,
      { new: true }
    );
    
    const socketManager = req.app.get('socketManager');
    const notifService = getNotificationService(socketManager);
    
    // ONLY notify for completion (achievement)
    if (req.body.status === 'done' && oldTask.status !== 'done') {
      await notifService.createNotification(req.user.userId, {
        type: 'achievement',
        title: '✅ Task Completed!',
        message: `You finished "${updatedTask.title}". Nice!`,
        metadata: {
          taskId: updatedTask._id,
          priority: 'low',
          actionUrl: `/tasks/${updatedTask._id}`
        }
      });
    }
    
    // REMOVED: No panic notification (too spammy)
    
    await notifService.checkAndCreateDespairAlert(req.user.userId);
    
    res.status(200).json(updatedTask);
  } catch (error) {
    console.error("Error updating task:", error);
    res.status(500).json({ message: "Failed to update task" });
  }
};

function calculateDespair(task) {
    let despair = 0;
    const today = new Date();
    const deadlineDate = new Date(task.deadline);

    switch (task.status) {
        case 'done': despair = 0; break;
        case 'ignored': despair = 5; break;
        case 'pending': despair = 10; break;
        case 'in-progress': despair = 7; break;
        case 'overdue': despair = 20; break;
        default: despair = 10;
    }

    if (deadlineDate > today) {
        const diffDays = Math.ceil((deadlineDate - today) / (1000 * 60 * 60 * 24));
        if (diffDays <= 1) despair += 25;
        else if (diffDays <= 3) despair += 3;
        else if (diffDays <= 5) despair += 1;
    } else if (deadlineDate < today && task.status !== 'done') {
        despair += 5;
    }

    if (despair >= 30) {
        task.status = 'panic';
    }
    return despair;
}