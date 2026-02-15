const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const Task = require('../models/Task');

// Apply auth middleware to all analytics routes
router.use(authMiddleware.authenticateToken);

// Get comprehensive analytics for user
router.get('/', async (req, res) => {
  try {
    const userId = req.user.userId;
    
    // Get all tasks for this user
    const tasks = await Task.find({ user: userId });
    
    if (!tasks || tasks.length === 0) {
      return res.json({
        success: true,
        data: {
          totalTasks: 0,
          completedTasks: 0,
          overdueTasks: 0,
          ignoredTasks: 0,
          panicTasks: 0,
          inProgressTasks: 0,
          pendingTasks: 0,
          averageDespair: 0,
          totalDespair: 0,
          weeklyStats: [],
          hourlyStats: [],
          statusBreakdown: {},
          insights: []
        }
      });
    }

    // Basic counts
    const totalTasks = tasks.length;
    const completedTasks = tasks.filter(t => t.status === 'done').length;
    const overdueTasks = tasks.filter(t => t.status === 'overdue').length;
    const ignoredTasks = tasks.filter(t => t.status === 'ignored').length;
    const panicTasks = tasks.filter(t => t.status === 'panic').length;
    const inProgressTasks = tasks.filter(t => t.status === 'in-progress').length;
    const pendingTasks = tasks.filter(t => t.status === 'pending').length;

    // Despair calculations
    const totalDespair = tasks.reduce((sum, t) => sum + (t.despairContribution || 0), 0);
    const averageDespair = totalTasks > 0 ? Math.round(totalDespair / totalTasks) : 0;

    // Status breakdown
    const statusBreakdown = {
      done: completedTasks,
      overdue: overdueTasks,
      ignored: ignoredTasks,
      panic: panicTasks,
      'in-progress': inProgressTasks,
      pending: pendingTasks
    };

    // Weekly stats
    const daysMap = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const weeklyStats = daysMap.map(day => ({
      day,
      completed: 0,
      avoided: 0,
      total: 0
    }));

    tasks.forEach(task => {
      if (task.createdAt) {
        const date = new Date(task.createdAt);
        const dayIndex = date.getDay();
        const dayName = daysMap[dayIndex];
        
        const dayData = weeklyStats.find(d => d.day === dayName);
        if (dayData) {
          dayData.total++;
          if (task.status === 'done') {
            dayData.completed++;
          } else if (['ignored', 'overdue', 'panic'].includes(task.status)) {
            dayData.avoided++;
          }
        }
      }
    });

    // Hourly stats (productivity by hour)
    const hourlyStats = [];
    for (let i = 0; i < 24; i++) {
      const hour = i === 0 ? '12AM' : 
                  i < 12 ? `${i}AM` : 
                  i === 12 ? '12PM' : `${i-12}PM`;
      hourlyStats.push({
        hour,
        completed: 0,
        productivity: 0
      });
    }

    tasks.forEach(task => {
      if (task.completedAt) {
        const date = new Date(task.completedAt);
        const hour = date.getHours();
        const hourData = hourlyStats[hour];
        if (hourData) {
          hourData.completed++;
        }
      }
    });

    // Calculate productivity percentage
    hourlyStats.forEach(hour => {
      hour.productivity = totalTasks > 0 ? Math.round((hour.completed / totalTasks) * 100) : 0;
    });

    // Calculate average delay
    let totalDelay = 0;
    let delayCount = 0;
    tasks.forEach(task => {
      if (task.deadline && task.completedAt) {
        const deadline = new Date(task.deadline);
        const completed = new Date(task.completedAt);
        if (completed > deadline) {
          const delayDays = Math.ceil((completed - deadline) / (1000 * 60 * 60 * 24));
          totalDelay += delayDays;
          delayCount++;
        }
      }
    });
    const averageDelay = delayCount > 0 ? (totalDelay / delayCount).toFixed(1) : 0;

    // Time wasted percentage
    const timeWasted = totalTasks > 0 
      ? Math.round(((ignoredTasks + overdueTasks + panicTasks) / totalTasks) * 100) 
      : 0;

    // Find peak productive hour
    let maxCompleted = 0;
    let peakHour = '12AM';
    hourlyStats.forEach((hour, index) => {
      if (hour.completed > maxCompleted) {
        maxCompleted = hour.completed;
        peakHour = hour.hour;
      }
    });

    // Find most/least productive days
    let maxDayCompleted = 0;
    let minDayCompleted = Infinity;
    let mostProductiveDay = 'Monday';
    let leastProductiveDay = 'Monday';

    weeklyStats.forEach(day => {
      if (day.completed > maxDayCompleted) {
        maxDayCompleted = day.completed;
        mostProductiveDay = day.day;
      }
      if (day.completed < minDayCompleted && day.total > 0) {
        minDayCompleted = day.completed;
        leastProductiveDay = day.day;
      }
    });

    res.json({
      success: true,
      data: {
        totalTasks,
        completedTasks,
        overdueTasks,
        ignoredTasks,
        panicTasks,
        inProgressTasks,
        pendingTasks,
        averageDespair,
        totalDespair,
        averageDelay,
        timeWasted,
        peakHour,
        mostProductiveDay,
        leastProductiveDay,
        weeklyStats,
        hourlyStats,
        statusBreakdown
      }
    });

  } catch (error) {
    console.error('Analytics error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch analytics' 
    });
  }
});

// Get trend data (last 30 days)
router.get('/trends', async (req, res) => {
  try {
    const userId = req.user.userId;
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const tasks = await Task.find({
      user: userId,
      createdAt: { $gte: thirtyDaysAgo }
    }).sort({ createdAt: 1 });

    // Group by date
    const trendData = {};
    tasks.forEach(task => {
      const date = task.createdAt.toISOString().split('T')[0];
      if (!trendData[date]) {
        trendData[date] = {
          date,
          completed: 0,
          created: 0,
          despair: 0
        };
      }
      trendData[date].created++;
      if (task.status === 'done') {
        trendData[date].completed++;
      }
      trendData[date].despair += task.despairContribution || 0;
    });

    res.json({
      success: true,
      data: Object.values(trendData)
    });

  } catch (error) {
    console.error('Trends error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch trends' 
    });
  }
});

// Get NPC roast statistics
router.get('/roasts', async (req, res) => {
  try {
    const userId = req.user.userId;
    const tasks = await Task.find({ 
      user: userId,
      'npcComments.0': { $exists: true } // Tasks with at least one NPC comment
    });

    let totalRoasts = 0;
    const roastsByNPC = {};

    tasks.forEach(task => {
      if (task.npcComments && task.npcComments.length > 0) {
        totalRoasts += task.npcComments.length;
        task.npcComments.forEach(comment => {
          const npcName = comment.npc || 'Unknown NPC';
          roastsByNPC[npcName] = (roastsByNPC[npcName] || 0) + 1;
        });
      }
    });

    res.json({
      success: true,
      data: {
        totalRoasts,
        roastsByNPC,
        roastedTasks: tasks.length
      }
    });

  } catch (error) {
    console.error('Roast stats error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch roast statistics' 
    });
  }
});

module.exports = router;