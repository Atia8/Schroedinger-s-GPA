const Task = require("../models/Task");

exports.getDashboardData = async (req, res) => {
  try {
    const userId = req.user.userId;
    // Get all pending/in-progress tasks
    const tasks = await Task.find({ 
      user: userId, 
      status: { $ne: 'completed' } 
    });

    const now = new Date();
    
    // --- 1. The Variables of Doom ---
    let rawDespair = 0;
    let overdueCount = 0;
    let imminentCount = 0; // Due within 24h
    let loomingCount = 0;  // Due within 3 days
    
    // --- 2. The Calculation Loop ---
    tasks.forEach(task => {
      // A. Baseline Anxiety: The mere existence of a task costs you mental energy
      rawDespair += 2; 

      if (!task.deadline) return;

      const diffInMs = new Date(task.deadline) - now;
      const diffInHours = diffInMs / (1000 * 60 * 60);

      // B. The Proximity Penalties
      if (diffInHours < 0) {
        // OVERDUE: The "You Failed" Tax
        overdueCount++;
        rawDespair += 30; // Massive penalty
      } else if (diffInHours < 24) {
        // IMMINENT: The "All Nighter" Tax
        imminentCount++;
        rawDespair += 15;
      } else if (diffInHours < 72) {
        // LOOMING: The "Weekend Ruined" Tax
        loomingCount++;
        rawDespair += 10;
      } else if (diffInHours < 168) {
        // FUTURE: The "Sunday Scaries" Tax
        rawDespair += 5;
      }
    });

    // --- 3. The Snowball Effect (Multipliers) ---
    // If you have a cluster of deadlines, stress compounds exponentially.
    const panicCluster = overdueCount + imminentCount + loomingCount;
    
    if (panicCluster >= 5) {
      rawDespair *= 1.5; // "System Failure" Multiplier
    } else if (panicCluster >= 3) {
      rawDespair *= 1.25; // "Overwhelmed" Multiplier
    }

    // Cap at 100 (but strictly keep it non-negative)
    const finalDespair = Math.min(Math.max(Math.round(rawDespair), 0), 100);

    // --- 4. Dynamic NPC Commentary ---
    let npcMessage = "Suspiciously quiet... too quiet.";
    
    if (finalDespair === 100) {
      npcMessage = "I'd tell you to calm down, but statistically, you're already dead.";
    } else if (overdueCount > 2) {
      npcMessage = `You have ${overdueCount} overdue tasks. Have you considered changing your major?`;
    } else if (imminentCount > 1) {
      npcMessage = "Sleep is for people who don't have deadlines in 24 hours.";
    } else if (panicCluster > 4) {
      npcMessage = "Your schedule looks like a cry for help.";
    } else if (finalDespair > 50) {
      npcMessage = "I can hear your heart rate from here.";
    } else if (finalDespair < 10 && tasks.length > 0) {
      npcMessage = "You're surprisingly calm. Are you forgetting something?";
    }

    // --- 5. Ritual Generator (Unhinged Edition) ---
    const rituals = [
      "Scream into a pillow (Volume 8/10).",
      "Stare at the ceiling and dissociate.",
      "Drink water. No, coffee doesn't count.",
      "Google 'high paying jobs that require no degree'.",
      "Lie on the floor for exactly 3 minutes.",
      "Close all 47 browser tabs. Do it."
    ];
    const randomRitual = rituals[Math.floor(Math.random() * rituals.length)];

    // --- 6. The "Impending Doom" List (UPDATED) ---
    // ✅ Filter OUT overdue tasks first (so we only show future problems)
    const futureTasks = tasks.filter(t => new Date(t.deadline) > now);
    
    // Sort tasks by deadline (closest first)
    const sortedTasks = futureTasks.sort((a, b) => new Date(a.deadline) - new Date(b.deadline));
    
    // Get Top 3 "Life Ruiners"
    const urgentTasks = sortedTasks.slice(0, 3).map(t => ({
      id: t._id,
      title: t.title,
      deadline: t.deadline,
      escalationLevel: t.escalationLevel || 'normal'
    }));

    res.json({
      despairIndex: finalDespair,
      npcMessage,
      ritual: randomRitual,
      stats: {
        total: tasks.length,
        overdue: overdueCount,
        panic: panicCluster
      },
      urgentTasks
    });

  } catch (error) {
    console.error("[Dashboard Logic Error]", error);
    res.status(500).json({ message: "The server is also having a breakdown." });
  }
};