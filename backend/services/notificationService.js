const Notification = require('../models/Notification');
const Task = require('../models/Task');
const User = require('../models/User');

class NotificationService {
  
  constructor(socketManager) {
    this.socketManager = socketManager;
  }

  // Check if user has enabled this notification type
  async shouldSendNotification(userId, type) {
    try {
      const user = await User.findById(userId);
      if (!user) return false;
      
      const prefs = user.notificationPreferences || {
        deadlineReminders: true,
        dailyRoasts: false,
        despairAlerts: true
      };
      
      // Map notification types to preference keys
      const typeToPref = {
        'deadline': 'deadlineReminders',
        'daily_roast': 'dailyRoasts',
        'despair_alert': 'despairAlerts',
        'achievement': null, // Always send
        'system': null // Always send
      };
      
      const prefKey = typeToPref[type];
      if (prefKey === null) return true; // Always send
      if (!prefKey) return true; // Unknown type, send by default
      
      return prefs[prefKey] === true;
    } catch (error) {
      console.error('Error checking notification preferences:', error);
      return true; // Send by default if error
    }
  }

  // Create notification ONLY if user has enabled that type
  async createNotification(userId, notificationData) {
    try {
      // Check if user wants this type of notification
      const shouldSend = await this.shouldSendNotification(userId, notificationData.type);
      
      if (!shouldSend) {
        console.log(`🔕 Skipped ${notificationData.type} notification for user ${userId} (disabled in settings)`);
        return null;
      }

      const notification = new Notification({
        user: userId,
        ...notificationData
      });
      
      await notification.save();
      
      // Push to user via WebSocket if online
      if (this.socketManager) {
        this.socketManager.sendToUser(userId, {
          type: 'new_notification',
          notification: {
            _id: notification._id,
            type: notification.type,
            title: notification.title,
            message: notification.message,
            createdAt: notification.createdAt,
            read: notification.read,
            metadata: notification.metadata
          }
        });
        
        // Update unread count
        await this.socketManager.sendUnreadCount(userId);
      }
      
      console.log(`🔔 Sent ${notificationData.type} notification to user ${userId}`);
      return notification;
    } catch (error) {
      console.error('Failed to create notification:', error);
      return null;
    }
  }
  
  // Get user's notifications with pagination
  async getUserNotifications(userId, page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    
    const [notifications, total] = await Promise.all([
      Notification.find({ user: userId })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Notification.countDocuments({ user: userId })
    ]);
    
    return {
      notifications,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    };
  }
  
  // Get unread count
  async getUnreadCount(userId) {
    return await Notification.countDocuments({ 
      user: userId, 
      read: false 
    });
  }
  
  // Mark as read with WebSocket update
  async markAsRead(userId, notificationId) {
    const notification = await Notification.findOneAndUpdate(
      { _id: notificationId, user: userId },
      { read: true },
      { new: true }
    );
    
    if (notification && this.socketManager) {
      await this.socketManager.sendUnreadCount(userId);
    }
    
    return notification;
  }
  
  // Mark all as read with WebSocket update
  async markAllAsRead(userId) {
    const result = await Notification.updateMany(
      { user: userId, read: false },
      { read: true }
    );
    
    if (this.socketManager) {
      await this.socketManager.sendUnreadCount(userId);
    }
    
    return result;
  }
  
  // Delete notification with WebSocket update
  async deleteNotification(userId, notificationId) {
    const result = await Notification.findOneAndDelete({
      _id: notificationId,
      user: userId
    });
    
    if (result && this.socketManager) {
      await this.socketManager.sendUnreadCount(userId);
    }
    
    return result;
  }
  
  // Check deadlines and create notifications
  async checkAndCreateDeadlineReminders() {
    const now = new Date();
    const next24Hours = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    
    const tasks = await Task.find({
      deadline: { $gte: now, $lte: next24Hours },
      status: { $nin: ['done', 'completed'] }
    }).populate('user');
    
    for (const task of tasks) {
      const hoursLeft = Math.ceil((task.deadline - now) / (1000 * 60 * 60));
      
      await this.createNotification(task.user._id, {
        type: 'deadline',
        title: '⏰ Deadline Approaching!',
        message: `"${task.title}" is due in ${hoursLeft} hours.`,
        metadata: {
          taskId: task._id,
          priority: hoursLeft < 6 ? 'high' : 'medium',
          actionUrl: `/tasks/${task._id}`
        }
      });
    }
  }
  
  // Create daily roast notification
  async createDailyRoast(userId) {
    const user = await User.findById(userId);
    if (!user) return;
    
    const roasts = {
      mild: [
        "Consider starting something today. No pressure, but time is a concept.",
        "Your tasks are waiting. They're very patient. Unlike your future self."
      ],
      brutal: [
        "Still procrastinating? Shocking. Absolutely shocking.",
        "Your future self is already disappointed. Just start already."
      ],
      damage: [
        "At this point, just embrace the chaos. Or don't. I don't care.",
        "Your ancestors didn't survive evolution for this level of procrastination."
      ]
    };
    
    const userRoasts = roasts[user.sarcasmLevel] || roasts.brutal;
    const randomRoast = userRoasts[Math.floor(Math.random() * userRoasts.length)];
    
    await this.createNotification(userId, {
      type: 'daily_roast',
      title: '☕ Daily Roast',
      message: randomRoast,
      metadata: { priority: 'low' }
    });
  }
  
// Check despair and create alert
async checkAndCreateDespairAlert(userId) {
  console.log(`📊 [DESPAIR] Checking despair for user ${userId}`);
  
  const tasks = await Task.find({ user: userId });
  const despairIndex = this.calculateDespairIndex(tasks);
  
  console.log(`📊 [DESPAIR] Calculated despair index: ${despairIndex}%`);
  
  // Only create alert if despair >= 70
  if (despairIndex >= 70) {
    // Check if we've sent an alert in the last 24 hours
    const recentAlert = await Notification.findOne({
      user: userId,
      type: 'despair_alert',
      createdAt: { $gt: new Date(Date.now() - 24 * 60 * 60 * 1000) }
    });
    
    if (!recentAlert) {
      const user = await User.findById(userId);
      const messages = {
        mild: `Your despair index is at ${despairIndex}%. That's concerning. Take a break!`,
        brutal: `${despairIndex}% despair? Impressive numbers. Too bad it's not helping your grades.`,
        damage: `${despairIndex}% despair? You're a disappointment to everyone, including yourself.`
      };
      
      const message = messages[user?.sarcasmLevel || 'brutal'] || messages.brutal;
      
      await this.createNotification(userId, {
        type: 'despair_alert',
        title: '⚠️ Critical Despair Level!',
        message: message,
        metadata: {
          despairIndex,
          priority: 'high'
        }
      });
      
      console.log(`✅ [DESPAIR] Despair alert sent for ${despairIndex}%`);
    } else {
      console.log(`⏰ [DESPAIR] Skipping - alert sent within last 24 hours`);
    }
  } else {
    console.log(`✅ [DESPAIR] Despair ${despairIndex}% < 70%, no alert needed`);
  }
}

calculateDespairIndex(tasks) {
  console.log(`🔢 [CALC] Calculating despair for ${tasks.length} tasks`);
  
  if (tasks.length === 0) return 0;
  
  let highestTaskDespair = 0;
  let overdueCount = 0;
  let imminentCount = 0; // Due within 24h
  const now = new Date();
  
  tasks.forEach(task => {
    let taskDespair = 0;
    
    // Base despair from status
    switch (task.status) {
      case 'done':
        taskDespair = 0;
        break;
      case 'ignored':
        taskDespair = 5;
        break;
      case 'pending':
        taskDespair = 10;
        break;
      case 'in-progress':
        taskDespair = 7;
        break;
      case 'overdue':
        taskDespair = 20;
        overdueCount++;
        break;
      case 'panic':
        taskDespair = 30;
        overdueCount++;
        break;
      default:
        taskDespair = 10;
    }
    
    const deadlineDate = new Date(task.deadline);
    const hoursUntilDeadline = (deadlineDate - now) / (1000 * 60 * 60);
    
    // Add proximity bonuses
    if (deadlineDate < now && task.status !== 'done') {
      // OVERDUE: Add bonus based on days overdue
      const daysOverdue = Math.ceil((now - deadlineDate) / (1000 * 60 * 60 * 24));
      taskDespair += Math.min(30, daysOverdue * 5);
      console.log(`  ${task.title}: OVERDUE by ${daysOverdue} days → ${taskDespair} despair`);
      
    } else if (hoursUntilDeadline <= 24 && hoursUntilDeadline > 0) {
      // DUE WITHIN 24 HOURS
      taskDespair += 25;
      imminentCount++;
      console.log(`  ${task.title}: DUE in ${Math.ceil(hoursUntilDeadline)}h → ${taskDespair} despair`);
      
    } else if (hoursUntilDeadline <= 72 && hoursUntilDeadline > 24) {
      // DUE WITHIN 3 DAYS
      taskDespair += 15;
      console.log(`  ${task.title}: DUE in ${Math.ceil(hoursUntilDeadline/24)} days → ${taskDespair} despair`);
      
    } else if (hoursUntilDeadline > 72) {
      // FUTURE TASKS
      console.log(`  ${task.title}: FUTURE → ${taskDespair} despair`);
    }
    
    // Cap individual task despair at 100
    taskDespair = Math.min(100, taskDespair);
    
    // Track the highest despair task
    if (taskDespair > highestTaskDespair) {
      highestTaskDespair = taskDespair;
    }
  });
  
  // NEW LOGIC: Start with the worst task
  let finalDespair = highestTaskDespair;
  
  // Add penalties for each additional overdue task (stacking penalty)
  if (overdueCount > 1) {
    // Each additional overdue task adds 15% penalty
    const overduePenalty = (overdueCount - 1) * 15;
    finalDespair += Math.min(40, overduePenalty);
    console.log(`  +${overduePenalty} penalty for ${overdueCount} overdue tasks`);
  }
  
  // Add penalty for imminent tasks (due within 24h)
  if (imminentCount > 0) {
    const imminentPenalty = imminentCount * 10;
    finalDespair += Math.min(30, imminentPenalty);
    console.log(`  +${imminentPenalty} penalty for ${imminentCount} imminent tasks`);
  }
  
  // Cap at 100
  finalDespair = Math.min(100, finalDespair);
  
  console.log(`🔢 [CALC] Highest task: ${highestTaskDespair}, Final: ${finalDespair}%`);
  
  return finalDespair;
}
}

module.exports = NotificationService;