// backend/controllers/dashboardController.js
const Task = require("../models/Task");
const User = require("../models/User");
const { calculateDespairIndex, getDespairTier } = require("../utils/despairUtils");

// ── NPC relationship state transitions ───────────────────────────────────────
// Returns the next relationship state for a given NPC based on current context.
function evolveNpcState(currentState, overdueCount, recentCompletions, despair) {
  // Redemption arc: streak while previously disappointed
  if (recentCompletions >= 3 && ['disappointed', 'given_up'].includes(currentState)) {
    return 'impressed';
  }
  // Recovery from impressed back to neutral if things go bad again
  if (currentState === 'impressed' && despair >= 66) {
    return 'concerned';
  }
  // Progressive disappointment path
  if (overdueCount >= 5 && despair >= 66) return 'given_up';
  if (overdueCount >= 3 && despair >= 46) return 'disappointed';
  if (overdueCount >= 1 && despair >= 21) return 'concerned';
  if (overdueCount === 0 && despair <= 20 && currentState !== 'impressed') return 'neutral';
  return currentState; // no change
}

// ── Tier-aware NPC commentary ─────────────────────────────────────────────────
// Each NPC now references actual task names and reacts to their relationship state.
function getNPCCommentary(despair, tier, overdueCount, pendingCount, ignoredCount, panicCount, imminentCount, tasks, sarcasmLevel, npcState) {
  const now = new Date();

  const urgentTask = tasks
    .filter(t => t.status !== 'done')
    .sort((a, b) => new Date(a.deadline) - new Date(b.deadline))[0];

  const daysUntilNearest = urgentTask && new Date(urgentTask.deadline) > now
    ? Math.ceil((new Date(urgentTask.deadline) - now) / (1000 * 60 * 60 * 24))
    : null;

  const overdueTask = tasks
    .filter(t => new Date(t.deadline) < now && t.status !== 'done')
    .sort((a, b) => new Date(a.deadline) - new Date(b.deadline))[0];

  // ── Tier-based opening lines (shared across sarcasm levels, escalate by tier) ──
  const tierGreetings = {
    "Functional Delusion":       "Suspiciously productive. This cannot last.",
    "Concerning Vibes":          "Something is wrong, but you haven't admitted it yet.",
    "Spiraling":                 "The descent has begun. Buckle up.",
    "Full Goblin Mode":          "You have fully committed to the chaos. Respect.",
    "Academic Extinction Event": "The heat death of your GPA is imminent."
  };

  // ── NPC relationship state prefix ─────────────────────────────────────────
  const relationshipPrefix = {
    neutral:      '',
    concerned:    'I was going to let this go, but — ',
    disappointed: 'We have been here before. I am tired. ',
    given_up:     '[The NPC stares at you in silence.] ...Fine. ',
    impressed:    'Wait. You\'re actually doing it? ...Okay. '
  };

  const prefix = relationshipPrefix[npcState?.hostileMentor || 'neutral'];

  const messages = {
    mild: {
      "Functional Delusion": () =>
        overdueTask
          ? `"${overdueTask.title}" is still there. But the vibe is okay for now.`
          : "Nothing pressing. Enjoy it. The calm is always temporary.",

      "Concerning Vibes": () =>
        urgentTask
          ? `"${urgentTask.title}" is ${daysUntilNearest === 0 ? 'due today' : `due in ${daysUntilNearest} days`}. That's worth looking at.`
          : `${despair}% despair. Something is adding up, even if it's not obvious.`,

      "Spiraling": () =>
        overdueTask
          ? `"${overdueTask.title}" has been waiting. So has your future self.`
          : `${despair}% is a lot. Take a breath. Try one task.`,

      "Full Goblin Mode": () =>
        overdueCount >= 3
          ? `${overdueCount} overdue tasks. "${overdueTask?.title}" is the oldest. Maybe start there.`
          : `${despair}% despair. You're not okay, but you could be. Eventually.`,

      "Academic Extinction Event": () =>
        `${despair}%. ${imminentCount > 0 ? `"${urgentTask?.title}" is due within 24 hours.` : ''} This is the situation you created. It can still be fixed.`
    },

    brutal: {
      "Functional Delusion": () =>
        overdueTask
          ? `"${overdueTask.title}" is just sitting there. Very brave of you to ignore it.`
          : "Nothing to do? Don't worry. You'll procrastinate something soon.",

      "Concerning Vibes": () =>
        urgentTask
          ? `"${urgentTask.title}" — ${daysUntilNearest === 0 ? 'due TODAY' : `${daysUntilNearest} days left`}. Impressive that you're still here.`
          : `${despair}% despair. That's not nothing. Just so you know.`,

      "Spiraling": () =>
        overdueTask
          ? `"${overdueTask.title}" is overdue. So is your sense of urgency.`
          : `${despair}% and spiraling. Efficient work.`,

      "Full Goblin Mode": () =>
        overdueCount >= 3
          ? `${overdueCount} overdue tasks. The oldest is "${overdueTask?.title}". It remembers you.`
          : `${despair}% despair. Your future self is already disappointed. Again.`,

      "Academic Extinction Event": () =>
        `${prefix}${despair}%. ${overdueCount} overdue. ${imminentCount > 0 ? `"${urgentTask?.title}" due within 24h.` : ''} This is fine. (It is not fine.)`
    },

    damage: {
      "Functional Delusion": () =>
        overdueTask
          ? `"${overdueTask.title}" has been abandoned. Your ancestors are rolling in their graves.`
          : "No tasks? Either you're a genius or you've accepted failure. Probably the latter.",

      "Concerning Vibes": () =>
        urgentTask
          ? `"${urgentTask.title}" is ${daysUntilNearest === 0 ? 'due TODAY' : `due in ${daysUntilNearest} days`}. You'll procrastinate until it's not.`
          : `${despair}% despair. Concerning is too soft a word.`,

      "Spiraling": () =>
        overdueTask
          ? `"${overdueTask.title}" is overdue. Just like your entire life plan.`
          : `${despair}% and you're just watching it happen.`,

      "Full Goblin Mode": () =>
        overdueCount >= 3
          ? `${prefix}${overdueCount} overdue tasks. "${overdueTask?.title}" died first. The rest followed. Classic.`
          : `${prefix}${despair}% despair. Drop out. Save yourself the slow suffering.`,

      "Academic Extinction Event": () =>
        `${prefix}${despair}%. ${overdueCount} overdue. ${imminentCount > 0 ? `"${urgentTask?.title}" is due TODAY.` : ''} Just drop out already.`
    }
  };

  const mode = messages[sarcasmLevel] || messages.brutal;
  const fn   = mode[tier.name] || mode["Concerning Vibes"];
  return fn();
}

// ── Rituals (context-sensitive, unchanged logic) ──────────────────────────────
function getRituals(sarcasmLevel, overdueCount, pendingCount, despair, acceptanceClicks) {
  // Zen of Failure ritual unlocks after 3+ acceptance clicks in a week
  if (acceptanceClicks >= 3) {
    return [
      "Sit with it. Just... sit with it. That's the whole ritual.",
      "You have accepted your fate. The universe respects this. Do nothing.",
      "The Zen of Failure: breathe in the chaos, breathe out the GPA expectations.",
      "Nothing. You've earned nothing. And somehow that's okay."
    ];
  }

  if (overdueCount >= 3) {
    return [
      "Delete the oldest overdue task. You're not doing it anyway.",
      "Accept that these tasks are dead. Focus on what isn't.",
      "Email your professor. Apologize. Move on. Seriously.",
      "Drop one thing. Your mental health > your GPA."
    ];
  }
  if (pendingCount >= 5) {
    return [
      "Pick ONE task. Just one. Do it. Then rest.",
      "Delete the lowest priority task. Feel the freedom.",
      "Break your largest task into 3 smaller ones.",
      "Pomodoro: 25 minutes. That's it. You can survive 25 minutes."
    ];
  }
  if (despair >= 66) {
    return [
      "Lie on the floor for 4 minutes. This is legitimate therapy.",
      "Write down everything stressing you. Burn the paper. Metaphorically.",
      "Text a friend. Tell them you're overwhelmed. Let them help.",
      "Take 10 minutes. No screens. Just breathe. I mean it."
    ];
  }

  const rituals = {
    mild:   [
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
  return rituals[sarcasmLevel] || rituals.brutal;
}

// ── GET /api/dashboard ────────────────────────────────────────────────────────
exports.getDashboardData = async (req, res) => {
  try {
    const userId = req.user.userId;
    const user   = await User.findById(userId);
    const tasks  = await Task.find({ user: userId });

    const sarcasmLevel    = user?.sarcasmLevel || 'brutal';
    const npcState        = user?.npcRelationshipState || {};
    const acceptanceClicks = user?.acceptanceClicks || 0;
    const now             = new Date();

    // ── Compute despair ──────────────────────────────────────────────────────
    const finalDespair = calculateDespairIndex(tasks);
    const tier         = getDespairTier(finalDespair);
    const prevDespair  = user?.lastDespairScore || finalDespair;
    const despairDelta = finalDespair - prevDespair; // negative = index dropped (good)

    // ── Counts ───────────────────────────────────────────────────────────────
    const overdueCount    = tasks.filter(t => new Date(t.deadline) < now && t.status !== 'done' && t.status !== 'completed').length;
    const pendingCount    = tasks.filter(t => t.status === 'pending').length;
    const ignoredCount    = tasks.filter(t => t.status === 'ignored').length;
    const panicCount      = tasks.filter(t => t.status === 'panic').length;
    const inProgressCount = tasks.filter(t => t.status === 'in-progress').length;
    const doneCount       = tasks.filter(t => t.status === 'done' || t.status === 'completed').length;
    const imminentCount   = tasks.filter(t => {
      const h = (new Date(t.deadline) - now) / (1000 * 60 * 60);
      return h >= 0 && h <= 24 && t.status !== 'done';
    }).length;

    const recentCompletions = tasks.filter(t => {
      const ca  = t.completedAt ? new Date(t.completedAt) : null;
      const ref = ca || (t.status === 'done' ? new Date(t.updatedAt) : null);
      return ref && ref > new Date(now - 48 * 60 * 60 * 1000);
    }).length;

    // ── Update user record ───────────────────────────────────────────────────
    const worstEver        = Math.max(finalDespair, user?.worstEverDespair || 0);
    const isNewPersonalLow = finalDespair > (user?.worstEverDespair || 0);

    // Evolve NPC relationship states
    const newNpcState = {
      hostileMentor: evolveNpcState(npcState.hostileMentor || 'neutral', overdueCount, recentCompletions, finalDespair),
      chaoticFriend: evolveNpcState(npcState.chaoticFriend || 'neutral', overdueCount, recentCompletions, finalDespair),
      momFriend:     evolveNpcState(npcState.momFriend     || 'neutral', overdueCount, recentCompletions, finalDespair),
    };

    // Persist changes asynchronously (don't await — don't block the response)
    User.findByIdAndUpdate(userId, {
      lastDespairScore:    finalDespair,
      worstEverDespair:    worstEver,
      npcRelationshipState: newNpcState
    }).catch(e => console.error('[Dashboard] Failed to update user record:', e));

    // ── NPC message and ritual ────────────────────────────────────────────────
    const npcMessage = getNPCCommentary(
      finalDespair, tier, overdueCount, pendingCount, ignoredCount,
      panicCount, imminentCount, tasks, sarcasmLevel, newNpcState
    );
    const rituals     = getRituals(sarcasmLevel, overdueCount, pendingCount, finalDespair, acceptanceClicks);
    const randomRitual = rituals[Math.floor(Math.random() * rituals.length)];

    const urgentTasks = tasks
      .filter(t => {
        const h = (new Date(t.deadline) - now) / (1000 * 60 * 60);
        return (h <= 24 && h > 0) || (new Date(t.deadline) < now && t.status !== 'done');
      })
      .sort((a, b) => new Date(a.deadline) - new Date(b.deadline))
      .slice(0, 3)
      .map(t => ({ id: t._id, title: t.title, deadline: t.deadline, status: t.status }));

    res.json({
      despairIndex: finalDespair,
      despairDelta,                  // NEW: frontend uses this for drop/spike animations
      tier,                          // NEW: { name, color, emoji, intensity }
      isNewPersonalLow,              // NEW: triggers "new low" badge
      worstEverDespair:    worstEver,
      npcMessage,
      npcRelationshipState: newNpcState,
      ritual: randomRitual,
      sarcasmLevel,
      acceptanceClicks,
      stats: {
        total:      tasks.length,
        overdue:    overdueCount,
        pending:    pendingCount,
        ignored:    ignoredCount,
        panic:      panicCount,
        inProgress: inProgressCount,
        done:       doneCount
      },
      urgentTasks
    });

  } catch (error) {
    console.error("[Dashboard] Error:", error);
    res.status(500).json({ message: "The server is also having a breakdown." });
  }
};

// ── POST /api/dashboard/accept-fate ──────────────────────────────────────────
// The big button that does nothing except document acceptance and give the NPC
// something to say about it.
// Add to dashboardRoutes.js: router.post('/accept-fate', auth, dashboardController.acceptFate);
exports.acceptFate = async (req, res) => {
  try {
    const userId = req.user.userId;
    const user   = await User.findById(userId);
    const now    = new Date();

    // Reset counter if last click was > 7 days ago
    const daysSinceLast = user.lastAcceptanceAt
      ? (now - new Date(user.lastAcceptanceAt)) / (1000 * 60 * 60 * 24)
      : 999;
    const newCount = daysSinceLast > 7 ? 1 : (user.acceptanceClicks || 0) + 1;

    await User.findByIdAndUpdate(userId, {
      acceptanceClicks: newCount,
      lastAcceptanceAt: now
    });

    const responses = {
      mild:   [
        "Acceptance is the first step. The tasks are still there, but okay.",
        "You've accepted your fate. The universe respects this, mildly.",
        "Noted. You accept it. The work remains. But noted."
      ],
      brutal: [
        "Growth. Terrible, useless growth.",
        "You've accepted it. The deadline has not.",
        "At last. Acceptance. The tasks don't care, but I'm logging this."
      ],
      damage: [
        "The cat is in the box. The assignment is not submitted. Both are true.",
        "You accept your fate. Your fate does not accept this as submission.",
        "Documented. 'User accepted fate.' Nothing changes. Everything changes."
      ]
    };

    const level   = user.sarcasmLevel || 'brutal';
    const options = responses[level];
    const message = options[Math.floor(Math.random() * options.length)];

    const zenUnlocked = newCount >= 3;

    res.json({
      message,
      acceptanceClicks: newCount,
      zenUnlocked,  // frontend can show special ritual if true
      zenMessage: zenUnlocked
        ? "The Zen of Failure ritual is now available. You've earned it."
        : null
    });

  } catch (err) {
    console.error("[acceptFate] Error:", err);
    res.status(500).json({ message: "Even acceptance failed. That's impressive." });
  }
};
