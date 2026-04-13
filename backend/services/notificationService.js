// backend/services/notificationService.js
// MODIFIED: calculateDespairIndex is now imported from despairUtils.js
// instead of being a duplicated inline method. The logic is the same
// formula — but now both this file and dashboardController use the same
// implementation so they can never silently diverge again.
const Notification = require('../models/Notification');
const Task         = require('../models/Task');
const User         = require('../models/User');
const { calculateDespairIndex } = require('../utils/despairUtils');

class NotificationService {

  constructor(socketManager) {
    this.socketManager = socketManager;
  }

  async shouldSendNotification(userId, type) {
    try {
      const user  = await User.findById(userId);
      if (!user) return false;
      const prefs = user.notificationPreferences || {
        deadlineReminders: true,
        dailyRoasts:       false,
        despairAlerts:     true
      };
      const typeToPref = {
        'deadline':        'deadlineReminders',
        'daily_roast':     'dailyRoasts',
        'despair_alert':   'despairAlerts',
        'achievement':     null,
        'system':          null,
        'contextual_roast': null
      };
      const prefKey = typeToPref[type];
      if (prefKey === null || prefKey === undefined) return true;
      return prefs[prefKey] === true;
    } catch (error) {
      console.error('Error checking notification preferences:', error);
      return true;
    }
  }

  async createNotification(userId, notificationData) {
    try {
      const shouldSend = await this.shouldSendNotification(userId, notificationData.type);
      if (!shouldSend) {
        console.log(`Skipped ${notificationData.type} for user ${userId} (disabled)`);
        return null;
      }
      const notification = new Notification({ user: userId, ...notificationData });
      await notification.save();
      if (this.socketManager) {
        this.socketManager.sendToUser(userId, {
          type: 'new_notification',
          notification: {
            _id:       notification._id,
            type:      notification.type,
            title:     notification.title,
            message:   notification.message,
            createdAt: notification.createdAt,
            read:      notification.read,
            metadata:  notification.metadata
          }
        });
        await this.socketManager.sendUnreadCount(userId);
      }
      return notification;
    } catch (error) {
      console.error('Failed to create notification:', error);
      return null;
    }
  }

  async getUserNotifications(userId, page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    const [notifications, total] = await Promise.all([
      Notification.find({ user: userId }).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      Notification.countDocuments({ user: userId })
    ]);
    return { notifications, pagination: { page, limit, total, pages: Math.ceil(total / limit) } };
  }

  async getUnreadCount(userId) {
    return await Notification.countDocuments({ user: userId, read: false });
  }

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

  async markAllAsRead(userId) {
    const result = await Notification.updateMany({ user: userId, read: false }, { read: true });
    if (this.socketManager) await this.socketManager.sendUnreadCount(userId);
    return result;
  }

  async deleteNotification(userId, notificationId) {
    const result = await Notification.findOneAndDelete({ _id: notificationId, user: userId });
    if (result && this.socketManager) await this.socketManager.sendUnreadCount(userId);
    return result;
  }

  async checkAndCreateDeadlineReminders() {
    const now          = new Date();
    const next24Hours  = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    const tasks        = await Task.find({
      deadline: { $gte: now, $lte: next24Hours },
      status:   { $nin: ['done', 'completed'] }
    }).populate('user');
    for (const task of tasks) {
      const hoursLeft = Math.ceil((task.deadline - now) / (1000 * 60 * 60));
      await this.createNotification(task.user._id, {
        type:  'deadline',
        title: 'Deadline Approaching',
        message: `"${task.title}" is due in ${hoursLeft} hours.`,
        metadata: { taskId: task._id, priority: hoursLeft < 6 ? 'high' : 'medium', actionUrl: `/tasks/${task._id}` }
      });
    }
  }

  async createDailyRoast(userId) {
    const user = await User.findById(userId);
    if (!user) return;
    const roasts = {
      mild:   [
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
    const userRoasts  = roasts[user.sarcasmLevel] || roasts.brutal;
    const randomRoast = userRoasts[Math.floor(Math.random() * userRoasts.length)];
    await this.createNotification(userId, {
      type:     'daily_roast',
      title:    'Daily Roast',
      message:  randomRoast,
      metadata: { priority: 'low' }
    });
  }

  async checkAndCreateDespairAlert(userId) {
    const tasks        = await Task.find({ user: userId });
    const despairIndex = calculateDespairIndex(tasks); // MODIFIED: uses shared util

    if (despairIndex < 70) return;

    const recentAlert = await Notification.findOne({
      user:      userId,
      type:      'despair_alert',
      createdAt: { $gt: new Date(Date.now() - 24 * 60 * 60 * 1000) }
    });
    if (recentAlert) return;

    const user          = await User.findById(userId);
    const sarcasmLevel  = user?.sarcasmLevel || 'brutal';
    const now           = new Date();
    const overdueTasks  = tasks.filter(t => new Date(t.deadline) < now && t.status !== 'done');
    const oldestOverdue = overdueTasks.sort((a, b) => new Date(a.deadline) - new Date(b.deadline))[0];
    const overdueCount  = overdueTasks.length;
    const pendingCount  = tasks.filter(t => t.status === 'pending').length;

    let dropSuggestion = '';
    if (oldestOverdue) {
      const daysOverdue = Math.ceil((now - new Date(oldestOverdue.deadline)) / (1000 * 60 * 60 * 24));
      dropSuggestion = `\n\nConsider dropping: "${oldestOverdue.title}" (${daysOverdue} days overdue).`;
    }

    const openers = {
      mild:   `Your despair index is at ${despairIndex}%. That's concerning.`,
      brutal: `${despairIndex}% despair? Impressive numbers. Too bad it's not helping your grades.`,
      damage: `${despairIndex}% despair? You're a disappointment.`
    };

    let message = openers[sarcasmLevel] || openers.brutal;
    if (overdueCount > 0) message += `\n\nYou have ${overdueCount} overdue task${overdueCount > 1 ? 's' : ''}.`;
    if (pendingCount > 0) message += `\n${pendingCount} pending task${pendingCount > 1 ? 's' : ''} waiting.`;
    message += dropSuggestion;
    message += oldestOverdue
      ? `\n\nReal talk: one less task = one less stress. You can't do everything.`
      : `\n\nPick 3 tasks. Do those. Ignore the rest. You're not superhuman.`;

    await this.createNotification(userId, {
      type:  'despair_alert',
      title: 'Critical Despair Level',
      message,
      metadata: { despairIndex, priority: 'high', suggestedDropTaskId: oldestOverdue?._id || null }
    });
  }

  async checkAndSendContextualRoasts() {
    const now          = new Date();
    const threeDaysAgo = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000);
    const ignoredTasks = await Task.find({
      status:    { $in: ['pending', 'ignored'] },
      createdAt: { $lt: threeDaysAgo },
      $or: [
        { lastRoastedAt: null },
        { lastRoastedAt: { $lt: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000) } }
      ]
    }).populate('user');

    for (const task of ignoredTasks) {
      const daysIgnored  = Math.ceil((now - task.createdAt) / (1000 * 60 * 60 * 24));
      const user         = await User.findById(task.user);
      const sarcasmLevel = user?.sarcasmLevel || 'brutal';
      const roastMessage = this.generateRoast(task.title, daysIgnored, sarcasmLevel);

      await this.createNotification(task.user, {
        type:  'contextual_roast',
        title: 'Contextual Roast',
        message: roastMessage,
        metadata: { taskId: task._id, daysIgnored, priority: 'medium', actionUrl: `/tasks/${task._id}` }
      });

      task.lastRoastedAt = now;
      await task.save();
    }
  }

  // MODIFIED: roasts now reference the actual task name (was already doing this correctly)
  generateRoast(taskTitle, daysIgnored, sarcasmLevel) {
    const roasts = {
      mild: {
        3:  `"${taskTitle}" has been sitting there for ${daysIgnored} days. Maybe look at it? No pressure.`,
        7:  `"${taskTitle}" is a week old. Time is a concept, but deadlines aren't.`,
        14: `"${taskTitle}" is 2 weeks old. At this point, just delete it. You're not doing it.`
      },
      brutal: {
        3:  `"${taskTitle}" ignored for ${daysIgnored} days. Still procrastinating? Shocking.`,
        7:  `"${taskTitle}" is a week old. Your future self is already disappointed.`,
        14: `"${taskTitle}" is 2 weeks old. Just drop it. You're not that person.`
      },
      damage: {
        3:  `"${taskTitle}" ignored for ${daysIgnored} days. Your ancestors didn't survive evolution for this.`,
        7:  `"${taskTitle}" is a week old. At this point, just embrace failure.`,
        14: `"${taskTitle}" is 2 weeks old. Delete it. You're never doing it. Accept it.`
      }
    };
    const level = roasts[sarcasmLevel] || roasts.brutal;
    if (daysIgnored >= 14) return level[14] || level[7];
    if (daysIgnored >= 7)  return level[7]  || level[3];
    return level[3] || `"${taskTitle}" has been ignored for ${daysIgnored} days.`;
  }
}

module.exports = NotificationService;
