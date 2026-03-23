const Task = require("../models/Task");

// Shared weighted despair calculation (matches notification service)
const calculateDespairIndex = (tasks) => {
  console.log(`🔢 [DASHBOARD CALC] Calculating despair for ${tasks.length} tasks`);
  
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
      
    } else if (hoursUntilDeadline <= 24 && hoursUntilDeadline > 0) {
      // DUE WITHIN 24 HOURS
      taskDespair += 25;
      imminentCount++;
      
    } else if (hoursUntilDeadline <= 72 && hoursUntilDeadline > 24) {
      // DUE WITHIN 3 DAYS
      taskDespair += 15;
    }
    
    // Cap individual task despair at 100
    taskDespair = Math.min(100, taskDespair);
    
    // Track the highest despair task
    if (taskDespair > highestTaskDespair) {
      highestTaskDespair = taskDespair;
    }
  });
  
  // Start with the worst task
  let finalDespair = highestTaskDespair;
  
  // Add penalties for each additional overdue task
  if (overdueCount > 1) {
    const overduePenalty = (overdueCount - 1) * 15;
    finalDespair += Math.min(40, overduePenalty);
  }
  
  // Add penalty for imminent tasks
  if (imminentCount > 0) {
    const imminentPenalty = imminentCount * 10;
    finalDespair += Math.min(30, imminentPenalty);
  }
  
  // Cap at 100
  return Math.min(100, finalDespair);
};

exports.getDashboardData = async (req, res) => {
  try {
    const userId = req.user.userId;
    // Get ALL tasks
    const tasks = await Task.find({ user: userId });

    const now = new Date();
    
    // Use the SAME calculation as notification service
    const finalDespair = calculateDespairIndex(tasks);
    
    // Count tasks by status
    const overdueCount = tasks.filter(t => t.status === 'overdue').length;
    const pendingCount = tasks.filter(t => t.status === 'pending').length;
    const inProgressCount = tasks.filter(t => t.status === 'in-progress').length;
    const panicCount = tasks.filter(t => t.status === 'panic').length;
    const doneCount = tasks.filter(t => t.status === 'done').length;
    
    // --- Dynamic NPC Commentary ---
    let npcMessage = "Suspiciously quiet... too quiet.";
    
    if (finalDespair >= 90) {
      npcMessage = "I'd tell you to calm down, but statistically, you're already dead.";
    } else if (finalDespair >= 70) {
      // Find the oldest overdue task to suggest dropping
      const oldestOverdue = tasks
        .filter(t => t.status === 'overdue')
        .sort((a, b) => new Date(a.deadline) - new Date(b.deadline))[0];
      
      if (oldestOverdue) {
        npcMessage = `⚠️ ${finalDespair}% despair. Drop "${oldestOverdue.title}" (due ${new Date(oldestOverdue.deadline).toLocaleDateString()}). You're not doing it anyway.`;
      } else {
        npcMessage = `⚠️ ${finalDespair}% despair. You have ${overdueCount} overdue tasks. Drop one. Now.`;
      }
    } else if (finalDespair >= 50) {
      npcMessage = `📊 ${finalDespair}% despair. Sleep is for people who don't have deadlines.`;
    } else if (finalDespair >= 30) {
      npcMessage = `📊 ${finalDespair}% despair. I can hear your heart rate from here.`;
    } else if (finalDespair < 10 && tasks.length > 0) {
      npcMessage = "You're surprisingly calm. Are you forgetting something?";
    }
    
    // Overdue-specific messages for lower despair
    if (overdueCount >= 3 && finalDespair < 70) {
      npcMessage = `You have ${overdueCount} overdue tasks. The oldest is from ${tasks.filter(t => t.status === 'overdue').sort((a,b) => new Date(a.deadline) - new Date(b.deadline))[0]?.title || 'a task'}. Just drop it.`;
    }

    // --- Ritual Generator ---
    const rituals = [
      "Scream into a pillow (Volume 8/10).",
      "Stare at the ceiling and dissociate.",
      "Drink water. No, coffee doesn't count.",
      "Google 'high paying jobs that require no degree'.",
      "Lie on the floor for exactly 3 minutes.",
      "Close all 47 browser tabs. Do it.",
      "Delete one task. Any task. Feel the relief.",
      "Accept that you will fail one thing. Choose which one."
    ];
    const randomRitual = rituals[Math.floor(Math.random() * rituals.length)];

    // --- Urgent Tasks (due in 24h or overdue) ---
    const urgentTasks = tasks
      .filter(t => {
        const deadline = new Date(t.deadline);
        const hoursUntil = (deadline - now) / (1000 * 60 * 60);
        return (hoursUntil <= 24 && hoursUntil > 0) || t.status === 'overdue';
      })
      .sort((a, b) => new Date(a.deadline) - new Date(b.deadline))
      .slice(0, 3)
      .map(t => ({
        id: t._id,
        title: t.title,
        deadline: t.deadline,
        status: t.status
      }));

    res.json({
      despairIndex: finalDespair,
      npcMessage,
      ritual: randomRitual,
      stats: {
        total: tasks.length,
        overdue: overdueCount,
        pending: pendingCount,
        inProgress: inProgressCount,
        panic: panicCount,
        done: doneCount
      },
      urgentTasks
    });

  } catch (error) {
    console.error("[Dashboard Logic Error]", error);
    res.status(500).json({ message: "The server is also having a breakdown." });
  }
};