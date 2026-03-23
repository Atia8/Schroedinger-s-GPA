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
  
// Check despair and create alert with drop suggestion
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
      
      // Find the oldest overdue task
      const overdueTasks = tasks.filter(t => t.status === 'overdue');
      const oldestOverdue = overdueTasks.sort((a, b) => 
        new Date(a.deadline) - new Date(b.deadline)
      )[0];
      
      // Count tasks due in next 24h
      const now = new Date();
      const imminentTasks = tasks.filter(t => {
        const deadline = new Date(t.deadline);
        const hoursUntil = (deadline - now) / (1000 * 60 * 60);
        return hoursUntil <= 24 && hoursUntil > 0 && t.status !== 'done';
      });
      
      // Build drop suggestion
      let dropSuggestion = "";
      if (oldestOverdue) {
        const daysOverdue = Math.ceil((now - new Date(oldestOverdue.deadline)) / (1000 * 60 * 60 * 24));
        dropSuggestion = `\n\n🗑️ DROP: "${oldestOverdue.title}"\n   Due: ${new Date(oldestOverdue.deadline).toLocaleDateString()} (${daysOverdue} days overdue)\n   You're never doing it. Drop it. Focus on the rest.`;
      } else if (imminentTasks.length > 2) {
        dropSuggestion = `\n\n🗑️ DROP SUGGESTION:\n   You have ${imminentTasks.length} tasks due in 24h.\n   You can't do all. Pick the least important and drop it.\n   Survival > perfection.`;
      } else if (tasks.length > 5 && tasks.filter(t => t.status === 'pending').length > 3) {
        dropSuggestion = `\n\n🗑️ DROP SUGGESTION:\n   You have ${tasks.length} tasks.\n   Realistically, you'll finish 3-4. Drop the lowest priority one now.`;
      }
      
      // Count stats for message
      const overdueCount = overdueTasks.length;
      const pendingCount = tasks.filter(t => t.status === 'pending').length;
      
      // Build the full message
      let message = "";
      const sarcasmLevel = user?.sarcasmLevel || 'brutal';
      
      if (sarcasmLevel === 'mild') {
        message = `Your despair index is at ${despairIndex}%. That's concerning.`;
      } else if (sarcasmLevel === 'damage') {
        message = `${despairIndex}% despair? You're a disappointment.`;
      } else {
        message = `${despairIndex}% despair? Impressive numbers. Too bad it's not helping your grades.`;
      }
      
      // Add context
      if (overdueCount > 0) {
        message += `\n\n📊 You have ${overdueCount} overdue task${overdueCount > 1 ? 's' : ''}.`;
      }
      if (pendingCount > 0) {
        message += `\n📊 ${pendingCount} pending task${pendingCount > 1 ? 's' : ''} waiting.`;
      }
      
      // Add drop suggestion
      message += dropSuggestion;
      
      // Add final encouragement
      if (oldestOverdue) {
        message += `\n\n💡 Real talk: One less task = one less stress. You can't do everything. That's okay.`;
      } else {
        message += `\n\n💡 Pick 3 tasks. Do those. Ignore the rest. You're not superhuman.`;
      }
      
      await this.createNotification(userId, {
        type: 'despair_alert',
        title: '⚠️ Critical Despair Level!',
        message: message,
        metadata: {
          despairIndex,
          priority: 'high',
          suggestedDropTaskId: oldestOverdue?._id || null
        }
      });
      
      console.log(`✅ [DESPAIR] Despair alert sent for ${despairIndex}% with drop suggestion`);
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
// Add this new function to the NotificationService class

// Check for ignored tasks and send contextual roasts
async checkAndSendContextualRoasts() {
  console.log(`🔥 [ROAST] Checking for ignored tasks...`);
  
  const now = new Date();
  const threeDaysAgo = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000);
  
  // Find tasks that:
  // 1. Are pending or ignored (not started)
  // 2. Created at least 3 days ago
  // 3. Haven't been roasted in the last 7 days
  const ignoredTasks = await Task.find({
    status: { $in: ['pending', 'ignored'] },
    createdAt: { $lt: threeDaysAgo },
    $or: [
      { lastRoastedAt: null },
      { lastRoastedAt: { $lt: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000) } }
    ]
  }).populate('user');
  
  console.log(`🔥 [ROAST] Found ${ignoredTasks.length} ignored tasks`);
  
  for (const task of ignoredTasks) {
    const daysIgnored = Math.ceil((now - task.createdAt) / (1000 * 60 * 60 * 24));
    
    // Get user's sarcasm level for personalized roast
    const user = await User.findById(task.user);
    const sarcasmLevel = user?.sarcasmLevel || 'brutal';
    
    // Generate roast based on days ignored and sarcasm level
    const roastMessage = this.generateRoast(task.title, daysIgnored, sarcasmLevel);
    
    // Send as notification
    await this.createNotification(task.user, {
      type: 'contextual_roast',
      title: '🔥 Contextual Roast',
      message: roastMessage,
      metadata: {
        taskId: task._id,
        daysIgnored: daysIgnored,
        priority: 'medium',
        actionUrl: `/tasks/${task._id}`
      }
    });
    
    // Update last roasted timestamp
    task.lastRoastedAt = now;
    await task.save();
    
    console.log(`🔥 [ROAST] Roasted "${task.title}" (ignored for ${daysIgnored} days)`);
  }
}

// Generate roast based on days ignored and sarcasm level
generateRoast(taskTitle, daysIgnored, sarcasmLevel) {
  const roasts = {
    mild: {
      3: `"${taskTitle}" has been sitting there for 3 days. Maybe look at it? No pressure.`,
      7: `"${taskTitle}" is 1 week old. Time is a concept, but deadlines aren't.`,
      14: `"${taskTitle}" is 2 weeks old. At this point, just delete it. You're not doing it.`
    },
    brutal: {
      3: `"${taskTitle}" ignored for 3 days. Still procrastinating? Shocking.`,
      7: `"${taskTitle}" is 1 week old. Your future self is already disappointed.`,
      14: `"${taskTitle}" is 2 weeks old. Just drop it. You're not that person.`
    },
    damage: {
      3: `"${taskTitle}" ignored for 3 days. Your ancestors didn't survive evolution for this.`,
      7: `"${taskTitle}" is 1 week old. At this point, just embrace failure.`,
      14: `"${taskTitle}" is 2 weeks old. Delete it. You're never doing it. Accept it.`
    }
  };
  
  const level = roasts[sarcasmLevel] || roasts.brutal;
  
  if (daysIgnored >= 14) return level[14] || level[7];
  if (daysIgnored >= 7) return level[7] || level[3];
  return level[3] || `"${taskTitle}" has been ignored for ${daysIgnored} days. Maybe start? Or don't.`;
}
}

module.exports = NotificationService;