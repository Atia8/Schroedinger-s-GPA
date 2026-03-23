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

// Dynamic NPC Commentary based on context AND sarcasm level
function getNPCCommentary(despair, overdueCount, pendingCount, ignoredCount, panicCount, imminentCount, tasks, level) {
  const now = new Date();
  
  // Find the most urgent task
  const urgentTask = tasks
    .filter(t => t.status !== 'done')
    .sort((a, b) => new Date(a.deadline) - new Date(b.deadline))[0];
  
  // Calculate days until nearest deadline
  let daysUntilNearest = null;
  if (urgentTask && new Date(urgentTask.deadline) > now) {
    daysUntilNearest = Math.ceil((new Date(urgentTask.deadline) - now) / (1000 * 60 * 60 * 24));
  }
  
  const messages = {
    mild: {
      high: () => {
        if (overdueCount >= 3) return `📊 ${despair}% despair. You have ${overdueCount} overdue tasks. Maybe drop the oldest one? Just a thought.`;
        if (imminentCount >= 2) return `📊 ${despair}% despair. ${imminentCount} tasks due soon. Time is a concept, but deadlines aren't.`;
        if (panicCount >= 1) return `📊 ${despair}% despair. You have ${panicCount} task in panic mode. Take a breath.`;
        return `📊 ${despair}% despair. That's concerning. Take a breath. Or start something. Your call.`;
      },
      overdue: () => {
        if (overdueCount === 1) return `You have 1 overdue task. It's not too late... probably.`;
        if (overdueCount >= 5) return `${overdueCount} overdue tasks? At this point, just pick one. Any one.`;
        return `You have ${overdueCount} overdue tasks. The universe isn't judging. Much.`;
      },
      ignored: () => {
        if (ignoredCount === 1) return `You have 1 task you're ignoring. It's still there. Watching.`;
        if (ignoredCount >= 3) return `${ignoredCount} tasks being ignored. They're not going to disappear.`;
        return `You're ignoring ${ignoredCount} tasks. Out of sight, out of mind? Not really.`;
      },
      panic: () => {
        if (panicCount === 1) return `You have 1 task in panic mode. Deep breaths. Or panic. Your choice.`;
        return `${panicCount} tasks in panic mode. At this point, just pick one and start. Any one.`;
      },
      pending: () => {
        if (pendingCount === 0) return `No pending tasks? Either you're ahead or you've given up.`;
        if (pendingCount >= 5) return `${pendingCount} tasks waiting. Maybe start with the easiest one? No pressure.`;
        return `${pendingCount} task(s) waiting. They're very patient. Unlike your future self.`;
      },
      deadlineSoon: () => {
        if (daysUntilNearest === 0) return `"${urgentTask?.title}" is due TODAY. Might want to look at that. Just saying.`;
        if (daysUntilNearest === 1) return `"${urgentTask?.title}" due tomorrow. Sleep is overrated anyway.`;
        if (daysUntilNearest <= 3) return `${daysUntilNearest} days until "${urgentTask?.title}" is due. Plenty of time. Or not.`;
        return `Nothing urgent. Suspiciously quiet... too quiet.`;
      },
      default: () => "Suspiciously quiet... too quiet. Everything okay?"
    },
    brutal: {
      high: () => {
        if (overdueCount >= 3) return `📊 ${despair}% despair. ${overdueCount} overdue tasks. At this point, just embrace the chaos.`;
        if (imminentCount >= 2) return `📊 ${despair}% despair. ${imminentCount} tasks due soon. They're not going to do themselves.`;
        if (panicCount >= 1) return `📊 ${despair}% despair. ${panicCount} task in panic mode. Impressive. Also pathetic.`;
        return `📊 ${despair}% despair? Impressive. Almost as impressive as your procrastination skills.`;
      },
      overdue: () => {
        if (overdueCount === 1) return `${overdueCount} overdue task. Still procrastinating? Shocking.`;
        if (overdueCount >= 5) return `${overdueCount} overdue tasks? Have you considered changing your major?`;
        return `${overdueCount} overdue tasks. Your future self is already disappointed.`;
      },
      ignored: () => {
        if (ignoredCount === 1) return `${ignoredCount} task ignored. Just like your responsibilities.`;
        if (ignoredCount >= 3) return `${ignoredCount} tasks ignored. They're not going to disappear.`;
        return `${ignoredCount} tasks being ignored. Pretending they don't exist won't work.`;
      },
      panic: () => {
        if (panicCount === 1) return `${panicCount} task in panic mode. Too late to panic now. Just do it.`;
        return `${panicCount} tasks in panic mode. Your ancestors didn't survive for this level of panic.`;
      },
      pending: () => {
        if (pendingCount === 0) return "Nothing to do? Either you're ahead or you've given up. I'm betting on the latter.";
        if (pendingCount >= 5) return `${pendingCount} tasks waiting. They're not going to do themselves. Well, they're not.`;
        return `${pendingCount} tasks waiting. Your future self hates you already.`;
      },
      deadlineSoon: () => {
        if (daysUntilNearest === 0) return `"${urgentTask?.title}" is due TODAY. You've had time. Lots of it.`;
        if (daysUntilNearest === 1) return `"${urgentTask?.title}" due tomorrow. Sleep is for people without deadlines.`;
        if (daysUntilNearest <= 3) return `${daysUntilNearest} days until "${urgentTask?.title}" is due. Tick tock.`;
        return "Nothing urgent? Don't worry, you'll procrastinate something eventually.";
      },
      default: () => "Nothing to do? Either you're ahead or you've given up. I'm betting on the latter."
    },
    damage: {
      high: () => {
        if (overdueCount >= 3) return `📊 ${despair}% despair. ${overdueCount} overdue tasks. Just drop out already.`;
        if (imminentCount >= 2) return `📊 ${despair}% despair. ${imminentCount} tasks due soon. Your ancestors are ashamed.`;
        if (panicCount >= 1) return `📊 ${despair}% despair. ${panicCount} task in panic mode. You're a disappointment.`;
        return `📊 ${despair}% despair? You're a disappointment to your future self.`;
      },
      overdue: () => {
        if (overdueCount === 1) return `${overdueCount} overdue task. You had one job. Literally.`;
        if (overdueCount >= 5) return `${overdueCount} overdue tasks? Just drop out. Save yourself the misery.`;
        return `${overdueCount} overdue tasks. Your ancestors didn't survive evolution for this.`;
      },
      ignored: () => {
        if (ignoredCount === 1) return `${ignoredCount} task ignored. Just like your future.`;
        if (ignoredCount >= 3) return `${ignoredCount} tasks ignored. They're not going anywhere. Neither are you.`;
        return `${ignoredCount} tasks being ignored. Your ancestors are rolling in their graves.`;
      },
      panic: () => {
        if (panicCount === 1) return `${panicCount} task in panic mode. Too late. Accept your fate.`;
        return `${panicCount} tasks in panic mode. You're a disappointment to everyone.`;
      },
      pending: () => {
        if (pendingCount === 0) return "No tasks? Either you're a genius or you've accepted failure. Probably the latter.";
        if (pendingCount >= 5) return `${pendingCount} tasks pending? Just accept your fate.`;
        return `${pendingCount} tasks waiting. Your ancestors are rolling in their graves.`;
      },
      deadlineSoon: () => {
        if (daysUntilNearest === 0) return `"${urgentTask?.title}" is due TODAY. You're going to fail. Accept it.`;
        if (daysUntilNearest === 1) return `"${urgentTask?.title}" due tomorrow. You'll do it at 3 AM and hate yourself.`;
        if (daysUntilNearest <= 3) return `${daysUntilNearest} days until "${urgentTask?.title}" is due. You'll probably still procrastinate.`;
        return "Nothing urgent? Enjoy it while it lasts. It won't.";
      },
      default: () => "No tasks? Either you're a genius or you've accepted failure. Probably the latter."
    }
  };
  
  const mode = messages[level] || messages.brutal;
  
  // Priority order for messages
  if (despair >= 70) return mode.high();
  if (overdueCount > 0) return mode.overdue();
  if (panicCount > 0) return mode.panic();  // NEW: Panic status
  if (ignoredCount > 0) return mode.ignored();  // NEW: Ignored status
  if (daysUntilNearest !== null && daysUntilNearest <= 3) return mode.deadlineSoon();
  if (pendingCount > 0) return mode.pending();
  return mode.default();
}

// Dynamic rituals based on context
function getRituals(level, overdueCount, pendingCount, despair) {
  // Context-specific rituals
  if (overdueCount >= 3) {
    return [
      "Delete the oldest overdue task. You're not doing it anyway.",
      "Accept that these 3 tasks are dead. Focus on the rest.",
      "Email your professor. Apologize. Move on.",
      "Drop one class. Your mental health > your GPA."
    ];
  }
  
  if (pendingCount >= 5) {
    return [
      "Pick ONE task. Just one. Do it. Then rest.",
      "Delete the lowest priority task. Feel the freedom.",
      "Break down your largest task into 3 smaller ones.",
      "Use the Pomodoro technique. 25 minutes. That's it."
    ];
  }
  
  if (despair >= 70) {
    return [
      "Drop one task. Seriously. Your mental health matters.",
      "Take 10 minutes. No screens. Just breathe.",
      "Write down what's stressing you. Burn the paper. Metaphorically.",
      "Text a friend. Tell them you're overwhelmed. Let them help."
    ];
  }
  
  const rituals = {
    mild: [
      "Scream into a pillow (Volume 4/10).",
      "Stare at the ceiling for 2 minutes.",
      "Drink water. Dehydration won't help.",
      "Close 10 browser tabs. Just 10.",
      "Pet an animal. If no animal, imagine one."
    ],
    brutal: [
      "Scream into a pillow (Volume 8/10).",
      "Stare at the ceiling and question your choices.",
      "Google 'jobs that don't require deadlines'.",
      "Delete one task. Any task. Feel the relief.",
      "Accept that you will fail one thing. Choose which one."
    ],
    damage: [
      "Scream into a pillow until you pass out.",
      "Accept that you'll fail one thing. Choose which one.",
      "Google 'how to drop out gracefully'.",
      "Delete your most overdue task. It's dead anyway.",
      "Lie on the floor. Stay there. Think about your choices."
    ]
  };
  
  return rituals[level] || rituals.brutal;
}

exports.getDashboardData = async (req, res) => {
  try {
    const userId = req.user.userId;
    
    const user = await User.findById(userId);
    const sarcasmLevel = user?.sarcasmLevel || 'brutal';
    const tasks = await Task.find({ user: userId });

    const now = new Date();
    const finalDespair = calculateDespairIndex(tasks);
    
    // Count ALL status types
    const overdueCount = tasks.filter(t => t.status === 'overdue').length;
    const pendingCount = tasks.filter(t => t.status === 'pending').length;
    const ignoredCount = tasks.filter(t => t.status === 'ignored').length;  // NEW
    const panicCount = tasks.filter(t => t.status === 'panic').length;      // NEW
    const inProgressCount = tasks.filter(t => t.status === 'in-progress').length;
    const doneCount = tasks.filter(t => t.status === 'done').length;
    
    const imminentCount = tasks.filter(t => {
      const deadline = new Date(t.deadline);
      const hoursUntil = (deadline - now) / (1000 * 60 * 60);
      return hoursUntil <= 24 && hoursUntil > 0;
    }).length;
    
    // Pass ALL counts to getNPCCommentary
    const npcMessage = getNPCCommentary(
      finalDespair, 
      overdueCount, 
      pendingCount, 
      ignoredCount,   // NEW
      panicCount,     // NEW
      imminentCount, 
      tasks, 
      sarcasmLevel
    );
    
    const rituals = getRituals(sarcasmLevel, overdueCount, pendingCount, finalDespair);
    const randomRitual = rituals[Math.floor(Math.random() * rituals.length)];
    
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
      sarcasmLevel,
      stats: {
        total: tasks.length,
        overdue: overdueCount,
        pending: pendingCount,
        ignored: ignoredCount,      // NEW
        panic: panicCount,          // NEW
        inProgress: inProgressCount,
        done: doneCount
      },
      urgentTasks
    });

  } catch (error) {
    console.error("[Dashboard Logic Error]", error);
    res.status(500).json({ message: "The server is also having a breakdown." });
  }

};