const Task = require("../models/Task");
const User = require("../models/User");

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

// NPC Commentary based on sarcasm level
function getNPCCommentary(despair, overdueCount, pendingCount, level) {
  const messages = {
    mild: {
      high: `📊 ${despair}% despair. That's concerning. Maybe take a break? Or start something? Just a suggestion.`,
      overdue: `You have ${overdueCount} overdue task(s). Time is a concept, but deadlines are not.`,
      pending: `${pendingCount} task(s) pending. Consider starting soon. Or don't. I'm not your mom.`,
      default: "Suspiciously quiet... too quiet. Everything okay?"
    },
    brutal: {
      high: `📊 ${despair}% despair? Impressive. Almost as impressive as your procrastination skills.`,
      overdue: `${overdueCount} overdue tasks? At this point, just embrace the chaos.`,
      pending: `${pendingCount} tasks waiting. They're not going to do themselves. Well, they're not.`,
      default: "Nothing to do? Either you're ahead or you've given up. I'm betting on the latter."
    },
    damage: {
      high: `📊 ${despair}% despair? You're a disappointment to your future self.`,
      overdue: `${overdueCount} overdue tasks? Just drop out already. Save yourself the misery.`,
      pending: `${pendingCount} tasks pending? Your ancestors didn't survive evolution for this.`,
      default: "No tasks? Either you're a genius or you've accepted failure. Probably the latter."
    }
  };
  
  const mode = messages[level] || messages.brutal;
  
  if (despair >= 70) return mode.high;
  if (overdueCount > 0) return mode.overdue;
  if (pendingCount > 0) return mode.pending;
  return mode.default;
}

// Rituals based on sarcasm level
function getRituals(level) {
  const rituals = {
    mild: [
      "Scream into a pillow (Volume 4/10).",
      "Stare at the ceiling for 2 minutes.",
      "Drink water. Dehydration won't help.",
      "Close 10 browser tabs. Just 10."
    ],
    brutal: [
      "Scream into a pillow (Volume 8/10).",
      "Stare at the ceiling and question your choices.",
      "Google 'jobs that don't require deadlines'.",
      "Delete one task. Any task. Feel the relief."
    ],
    damage: [
      "Scream into a pillow until you pass out.",
      "Accept that you'll fail one thing. Choose which one.",
      "Google 'how to drop out gracefully'.",
      "Delete your most overdue task. It's dead anyway."
    ]
  };
  
  return rituals[level] || rituals.brutal;
}

exports.getDashboardData = async (req, res) => {
  try {
    const userId = req.user.userId;
    
    // Get user with sarcasm level
    const user = await User.findById(userId);
    const sarcasmLevel = user?.sarcasmLevel || 'brutal';
    
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
    
    // --- Dynamic NPC Commentary based on sarcasm level ---
    let npcMessage = getNPCCommentary(finalDespair, overdueCount, pendingCount, sarcasmLevel);
    
    // --- Ritual Generator based on sarcasm level ---
    const rituals = getRituals(sarcasmLevel);
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
      sarcasmLevel, // Send to frontend
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