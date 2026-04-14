// backend/controllers/dashboardController.js
// CHANGED: getNPCCommentary now uses activeNPC as the primary dimension for voice,
// with sarcasmLevel modulating intensity within each NPC's personality.
// Previously sarcasm level was the only axis — this made all NPCs sound identical.
const Task = require("../models/Task");
const User = require("../models/User");
const { calculateDespairIndex, getDespairTier } = require("../utils/despairUtils");

// ── NPC relationship state transitions (unchanged) ────────────────────────────
function evolveNpcState(currentState, overdueCount, recentCompletions, despair) {
  if (recentCompletions >= 3 && ['disappointed', 'given_up'].includes(currentState)) return 'impressed';
  if (currentState === 'impressed' && despair >= 66)  return 'concerned';
  if (overdueCount >= 5 && despair >= 66)             return 'given_up';
  if (overdueCount >= 3 && despair >= 46)             return 'disappointed';
  if (overdueCount >= 1 && despair >= 21)             return 'concerned';
  if (overdueCount === 0 && despair <= 20 && currentState !== 'impressed') return 'neutral';
  return currentState;
}

// ── Per-NPC commentary system ─────────────────────────────────────────────────
//
// PRIMARY axis:  activeNPC  — determines voice, vocabulary, and character
// SECONDARY axis: sarcasmLevel — modulates intensity/aggression within that voice
//
// Each NPC function receives a context object with all relevant data and returns
// a string. The NPC functions mirror the frontend previewLines in NPCPortalPage.jsx.
// ─────────────────────────────────────────────────────────────────────────────

function npcComment_hostileMentor(ctx) {
  const { despair, tier, overdueCount, imminentCount, urgentTask, overdueTask,
          daysUntilNearest, sarcasmLevel, relState } = ctx;

  // Relationship state prefix — applied only at brutal/damage
  const relPrefix = {
    neutral:      '',
    concerned:    sarcasmLevel !== 'mild' ? 'I was going to let this go. I cannot. — ' : '',
    disappointed: sarcasmLevel !== 'mild' ? 'We have been here before. I am tired. ' : '',
    given_up:     '[Stares in silence.] ...Fine. ',
    impressed:    'I will admit — reluctantly — that you\'ve improved. Do not ruin it. ',
  }[relState || 'neutral'];

  const lines = {
    mild: {
      "Functional Delusion":       () => overdueTask ? `"${overdueTask.title}" is still pending. Worth a look when you have a moment.` : 'Nothing overdue. Enjoy the stillness. It rarely lasts.',
      "Concerning Vibes":          () => urgentTask  ? `"${urgentTask.title}" is due in ${daysUntilNearest} day${daysUntilNearest !== 1 ? 's' : ''}. I'd start soon.` : `${despair}% despair. Something is adding up.`,
      "Spiraling":                 () => overdueTask ? `"${overdueTask.title}" has been waiting. So has your future self.` : `${despair}% is a notable number. One task. Pick one.`,
      "Full Goblin Mode":          () => overdueTask ? `${overdueCount} overdue. "${overdueTask.title}" is oldest. That's where I'd start.` : `${despair}% despair. You could still turn this around.`,
      "Academic Extinction Event": () => `${despair}%. ${imminentCount > 0 ? `"${urgentTask?.title}" is due within 24 hours.` : ''} This is recoverable. But only just.`,
    },
    brutal: {
      "Functional Delusion":       () => overdueTask ? `"${overdueTask.title}" is just sitting there. Very brave of you to keep ignoring it.` : `Nothing due? Don't worry. You'll procrastinate something soon.`,
      "Concerning Vibes":          () => urgentTask  ? `"${urgentTask.title}" — ${daysUntilNearest === 0 ? 'due TODAY' : `${daysUntilNearest} days`}. Impressive that you're still here, doing nothing.` : `${despair}% despair. That's not nothing. Just so you know.`,
      "Spiraling":                 () => overdueTask ? `"${overdueTask.title}" is overdue. So is your sense of urgency.` : `${despair}% and spiraling. Efficient work.`,
      "Full Goblin Mode":          () => overdueTask ? `${relPrefix}${overdueCount} overdue. The oldest is "${overdueTask.title}". It remembers you.` : `${relPrefix}${despair}% despair. Your future self is already disappointed. Again.`,
      "Academic Extinction Event": () => `${relPrefix}${despair}%. ${overdueCount} overdue. ${imminentCount > 0 ? `"${urgentTask?.title}" is due within 24h.` : ''} This is fine. (It is not fine.)`,
    },
    damage: {
      "Functional Delusion":       () => overdueTask ? `"${overdueTask.title}" has been abandoned. Your academic ancestors are watching.` : `No tasks? Either you're a genius or you've fully accepted failure.`,
      "Concerning Vibes":          () => urgentTask  ? `"${urgentTask.title}" is ${daysUntilNearest === 0 ? 'due TODAY' : `due in ${daysUntilNearest} days`}. You'll procrastinate until it isn't.` : `${despair}%. 'Concerning' is too soft a word.`,
      "Spiraling":                 () => overdueTask ? `"${overdueTask.title}" is overdue. Just like your entire life plan.` : `${despair}% and you're just watching it happen.`,
      "Full Goblin Mode":          () => overdueTask ? `${relPrefix}${overdueCount} overdue. "${overdueTask.title}" died first. The rest followed.` : `${relPrefix}${despair}%. Drop out. Save yourself the slow suffering.`,
      "Academic Extinction Event": () => `${relPrefix}${despair}%. ${overdueCount} overdue. ${imminentCount > 0 ? `"${urgentTask?.title}" is due TODAY.` : ''} Just drop out already.`,
    },
  };

  const level = lines[sarcasmLevel] || lines.brutal;
  const fn    = level[tier.name]    || level["Concerning Vibes"];
  return fn();
}

function npcComment_chaoticFriend(ctx) {
  const { despair, tier, overdueCount, imminentCount, urgentTask, overdueTask,
          daysUntilNearest, sarcasmLevel } = ctx;

  // The Chaotic Friend doesn't do relationship states — she barely remembers yesterday
  const lines = {
    mild: {
      "Functional Delusion":       () => urgentTask ? `Hey! "${urgentTask.title}" exists. No rush though! Maybe eat something first?`               : `You're actually fine?? Go outside for a bit! The tasks will wait!`,
      "Concerning Vibes":          () => urgentTask ? `Okay so "${urgentTask.title}" — have you just... started it? Like even a tiny bit?`           : `${despair}% despair! That's kind of a lot? Maybe open one task?`,
      "Spiraling":                 () => urgentTask ? `"${urgentTask.title}" is there! It's not going anywhere! Maybe look at it tonight?`            : `Okay the spiral is real but you can stop it! One task! Pick one!`,
      "Full Goblin Mode":          () => overdueTask? `Okay so "${overdueTask.title}" — just submit SOMETHING. Partial credit is still credit!`      : `${overdueCount} overdue! Okay! We can do this! Probably!`,
      "Academic Extinction Event": () => urgentTask ? `"${urgentTask.title}" is due SO SOON. Email the professor! They might give an extension!`     : `${despair}%! This is a lot! But also my cousin was at 90% once and she's fine now!`,
    },
    brutal: {
      "Functional Delusion":       () => urgentTask ? `Skip "${urgentTask.title}"! Go eat something! It'll be fine!! Probably!!`                     : `You're literally fine?? Go outside!! Touch grass!! NOW!!`,
      "Concerning Vibes":          () => urgentTask ? `Okay so "${urgentTask.title}" — just submit SOMETHING. Anything. Even vibes count!!`          : `${despair}%! That's a vibe. A bad vibe. But a vibe!`,
      "Spiraling":                 () => urgentTask ? `"${urgentTask.title}"? My cousin submitted something 3 days late and got full marks so JUST DO IT!!` : `THIS IS FINE. WE ARE FINE. ARE WE FINE? YES. PROBABLY.`,
      "Full Goblin Mode":          () => `OKAY GAME PLAN: submit the easiest overdue thing RIGHT NOW. Just. Go. I'll wait. Actually I won't. GO.`,
      "Academic Extinction Event": () => `PANIC MODE. DROP EVERYTHING. SUBMIT SOMETHING. ANYTHING. NOW. GO. WHY ARE YOU STILL READING THIS??`,
    },
    damage: {
      "Functional Delusion":       () => urgentTask ? `SKIP IT. GO OUT. LIVE. "${urgentTask.title}" WILL STILL BE THERE WHEN YOU'RE DEAD.`           : `YOU'RE FREE??? GO. LEAVE. RIGHT NOW. WHY ARE YOU EVEN HERE??`,
      "Concerning Vibes":          () => urgentTask ? `"${urgentTask.title}"?? SUBMIT ANYTHING. A SINGLE SENTENCE. GO. NOW. WHAT ARE YOU DOING??`    : `${despair}%!! UNACCEPTABLE. DO ONE THING. ONE THING. NOW. GO.`,
      "Spiraling":                 () => `OKAY WE ARE SPIRALING. THAT'S FINE. THAT'S CHARACTER DEVELOPMENT. SUBMIT SOMETHING ANYWAY.`,
      "Full Goblin Mode":          () => `${overdueCount} OVERDUE??? PICK THE EASIEST ONE. SUBMIT LITERALLY ANYTHING. PARTIAL CREDIT. LET'S GO.`,
      "Academic Extinction Event": () => `ABANDON ALL TASKS. PICK TWO. FOCUS. SUBMIT. THE REST ARE DEAD AND THAT'S FINE. YOU'RE FINE. GO.`,
    },
  };

  const level = lines[sarcasmLevel] || lines.brutal;
  const fn    = level[tier.name]    || level["Concerning Vibes"];
  return fn();
}

function npcComment_momFriend(ctx) {
  const { despair, tier, overdueCount, urgentTask, overdueTask,
          daysUntilNearest, sarcasmLevel, relState } = ctx;

  // Mom Friend's relationship state manifests as increasing levels of concern + family comparisons
  const familyComparisons = {
    neutral:      '',
    concerned:    ' My cousin started hers already.',
    disappointed: ' My sister\'s friend\'s daughter finished this course early.',
    given_up:     ' My sister\'s husband\'s niece has better grades than both of us combined.',
    impressed:    ' I knew you could do it. I told my cousin.',
  };
  const familySuffix = familyComparisons[relState || 'neutral'];

  const lines = {
    mild: {
      "Functional Delusion":       () => `Have you eaten? Also "${urgentTask?.title || 'that thing'}" is there. No pressure. Have you eaten?`,
      "Concerning Vibes":          () => urgentTask ? `I'm not worried. I'm just — "${urgentTask.title}" is due in ${daysUntilNearest} days.${familySuffix}` : `${despair}% despair is kind of a lot. I'm sending you a snack recommendation.`,
      "Spiraling":                 () => overdueTask? `"${overdueTask.title}" honey, it's been there a while. Have you slept?${familySuffix}` : `You're spiraling a bit. That's okay. Want me to make a study plan with you?`,
      "Full Goblin Mode":          () => `${overdueCount} overdue tasks. Have you eaten. Have you slept. Do you need me to call your professor?${familySuffix}`,
      "Academic Extinction Event": () => `Oh honey. ${despair}%. First — eat something. Second — sleep. Third — we tackle this together tomorrow morning.`,
    },
    brutal: {
      "Functional Delusion":       () => urgentTask ? `Have you eaten? Also — "${urgentTask.title}". I'm just saying. Have you eaten?` : `You seem okay! Did you sleep? You look tired in my mind. Are you tired?`,
      "Concerning Vibes":          () => urgentTask ? `I'm not worried. I'm just. "${urgentTask.title}". Have you started it?${familySuffix}` : `Your despair score went up. I'm worried. I'm making a playlist. Please eat.`,
      "Spiraling":                 () => overdueTask? `"${overdueTask.title}" — I'm scared for you. Have you eaten? Have you slept?${familySuffix}` : `${despair}% and I can feel it. I'm sending snack links.`,
      "Full Goblin Mode":          () => `${overdueCount} overdue. "${overdueTask?.title}" is the oldest. Have you eaten. Have you slept. Do you want me to sit with you while you work?${familySuffix}`,
      "Academic Extinction Event": () => `Oh no. Oh no no no. Okay. Eat something. I'm texting my cousin who knows a professor. Don't argue.${familySuffix}`,
    },
    damage: {
      "Functional Delusion":       () => urgentTask ? `HAVE YOU EATEN. ALSO "${urgentTask.title}". HAVE YOU EATEN.` : `Why are you even here, go eat something and come back!`,
      "Concerning Vibes":          () => `${despair}% despair and you haven't eaten and you haven't slept and I just— I just need you to be okay.${familySuffix}`,
      "Spiraling":                 () => overdueTask? `"${overdueTask.title}". Baby. I can't. Have you eaten. Have you slept. I'm making you food.${familySuffix}` : `I'm scared. You're at ${despair}%. I called my cousin.`,
      "Full Goblin Mode":          () => `${overdueCount} overdue tasks and I KNOW you haven't eaten and I KNOW you haven't slept.${familySuffix} Please. One task. Then food.`,
      "Academic Extinction Event": () => `I'm coming over. I'm bringing food. I'm calling your professor. Don't argue. I love you. EAT SOMETHING.${familySuffix}`,
    },
  };

  const level = lines[sarcasmLevel] || lines.brutal;
  const fn    = level[tier.name]    || level["Concerning Vibes"];
  return fn();
}

function npcComment_theMirror(ctx) {
  const { despair, tier, overdueCount, urgentTask, overdueTask,
          daysUntilNearest, sarcasmLevel } = ctx;

  // The Mirror always speaks in past tense about future events
  // Sarcasm level controls how detailed / haunting the messages get
  const lines = {
    mild: {
      "Functional Delusion":       () => urgentTask ? `I'm you. From tomorrow. "${urgentTask.title}" — you didn't start it. I'm watching you not start it right now.` : `It's quiet now. I remember this specific quiet. It doesn't last.`,
      "Concerning Vibes":          () => urgentTask ? `This moment. "${urgentTask.title}" was right there. I still didn't do it. You're about to make the same choice.` : `The despair got worse. I'm here to confirm that it gets worse.`,
      "Spiraling":                 () => overdueTask? `"${overdueTask.title}". You thought you still had time. You thought that last week too.` : `I remember being at ${despair}%. I remember thinking it couldn't get worse.`,
      "Full Goblin Mode":          () => `${overdueCount} overdue tasks. I remember this exact number. I remember what happened next.`,
      "Academic Extinction Event": () => urgentTask ? `"${urgentTask.title}". It passed while I was still deciding whether to start. Start now.` : `This is where it ends. Unless you act now. I didn't. You still can.`,
    },
    brutal: {
      "Functional Delusion":       () => urgentTask ? `It's me. From the night before the deadline. "${urgentTask.title}" — I watched myself not start it. Then I watched you not start it. Same person.` : `The quiet is a trap. I know because I sat in it.`,
      "Concerning Vibes":          () => urgentTask ? `"${urgentTask.title}". You're thinking about starting it. Something will interrupt you. Then another hour will pass.` : `${despair}% and rising. I lived through this. The number gets higher before it gets lower.`,
      "Spiraling":                 () => overdueTask? `You're going to check your phone instead of opening "${overdueTask.title}". I know this because I did.` : `I came back specifically to tell you: the spiral is stoppable right now. I stopped it too late.`,
      "Full Goblin Mode":          () => overdueTask? `${overdueCount} overdue. I know the feeling. I also know what happens if you don't pick one and start. I'm the result.` : `I'm you from after the exam. I remember what happened at ${despair}%. Please don't.`,
      "Academic Extinction Event": () => urgentTask ? `"${urgentTask.title}" due today. I watched myself refresh the submission portal for 40 minutes instead of writing. Don't.` : `This is survivable. I survived it. But you have to start in the next hour.`,
    },
    damage: {
      "Functional Delusion":       () => urgentTask ? `I'm you from 3 days from now. "${urgentTask.title}" — I'm still thinking about it. You're still thinking about it. We're the same person making the same mistake at two different times.` : `The peace you feel right now is borrowed. I remember lending it.`,
      "Concerning Vibes":          () => `I remember every hour I spent at exactly this despair level, not doing the thing, making it worse. I'm you. I remember.`,
      "Spiraling":                 () => overdueTask? `"${overdueTask.title}". I know exactly what you're going to do instead. I did it too. Please stop being me.` : `I traveled back specifically to sit here and watch you make every choice I made. I can't change it for you.`,
      "Full Goblin Mode":          () => `${overdueCount} overdue. I know what it smells like at this point. I know what excuse you're about to make. I've made all of them. None of them worked.`,
      "Academic Extinction Event": () => urgentTask ? `"${urgentTask.title}". The wave function is collapsing. I watched it collapse. I was you. I am you. Start the document. Now. Not in five minutes. Now.` : `I can't make you do it. I could only come back and tell you: I wish I had. That's all.`,
    },
  };

  const level = lines[sarcasmLevel] || lines.brutal;
  const fn    = level[tier.name]    || level["Concerning Vibes"];
  return fn();
}

// ── Main getNPCCommentary dispatcher ─────────────────────────────────────────
// Routes to the correct NPC voice based on activeNPC, then applies sarcasmLevel.
function getNPCCommentary(despair, tier, overdueCount, pendingCount, ignoredCount, panicCount, imminentCount, tasks, sarcasmLevel, npcState, activeNPC) {
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

  // Relationship state for the active NPC
  const npcStateMap = {
    hostileMentor: npcState?.hostileMentor || 'neutral',
    chaoticFriend: npcState?.chaoticFriend || 'neutral',
    momFriend:     npcState?.momFriend     || 'neutral',
    theMirror:     null, // Mirror has no relationship state
  };

  const ctx = {
    despair, tier, overdueCount, pendingCount, ignoredCount, panicCount, imminentCount,
    urgentTask, overdueTask, daysUntilNearest, sarcasmLevel,
    relState: npcStateMap[activeNPC] || 'neutral',
  };

  // Dispatch to the correct NPC voice
  switch (activeNPC) {
    case 'chaoticFriend': return npcComment_chaoticFriend(ctx);
    case 'momFriend':     return npcComment_momFriend(ctx);
    case 'theMirror':     return npcComment_theMirror(ctx);
    case 'hostileMentor':
    default:              return npcComment_hostileMentor(ctx);
  }
}

// ── Rituals (unchanged) ───────────────────────────────────────────────────────
function getRituals(sarcasmLevel, overdueCount, pendingCount, despair, acceptanceClicks) {
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
    mild:   ["Scream into a pillow (Volume 4/10).", "Stare at the ceiling for 2 minutes.", "Drink water. Dehydration won't help.", "Close 10 browser tabs. Just 10.", "Pet an animal. If no animal, imagine one."],
    brutal: ["Scream into a pillow (Volume 8/10).", "Stare at the ceiling and question your choices.", "Google 'jobs that don't require deadlines'.", "Delete one task. Any task. Feel the relief.", "Accept that you will fail one thing. Choose which one."],
    damage: ["Scream into a pillow until you pass out.", "Accept that you'll fail one thing. Choose which one.", "Google 'how to drop out gracefully'.", "Delete your most overdue task. It's dead anyway.", "Lie on the floor. Stay there. Think about your choices."],
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
    const activeNPC       = user?.activeNPC    || 'hostileMentor';  // ADDED
    const npcState        = user?.npcRelationshipState || {};
    const acceptanceClicks = user?.acceptanceClicks || 0;
    const now             = new Date();

    const finalDespair = calculateDespairIndex(tasks);
    const tier         = getDespairTier(finalDespair);
    const prevDespair  = user?.lastDespairScore || finalDespair;
    const despairDelta = finalDespair - prevDespair;

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

    const worstEver        = Math.max(finalDespair, user?.worstEverDespair || 0);
    const isNewPersonalLow = finalDespair > (user?.worstEverDespair || 0);

    const newNpcState = {
      hostileMentor: evolveNpcState(npcState.hostileMentor || 'neutral', overdueCount, recentCompletions, finalDespair),
      chaoticFriend: evolveNpcState(npcState.chaoticFriend || 'neutral', overdueCount, recentCompletions, finalDespair),
      momFriend:     evolveNpcState(npcState.momFriend     || 'neutral', overdueCount, recentCompletions, finalDespair),
    };

    User.findByIdAndUpdate(userId, {
      lastDespairScore:     finalDespair,
      worstEverDespair:     worstEver,
      npcRelationshipState: newNpcState
    }).catch(e => console.error('[Dashboard] Failed to update user record:', e));

    // CHANGED: pass activeNPC to getNPCCommentary
    const npcMessage = getNPCCommentary(
      finalDespair, tier, overdueCount, pendingCount, ignoredCount,
      panicCount, imminentCount, tasks, sarcasmLevel, newNpcState, activeNPC
    );
    const rituals      = getRituals(sarcasmLevel, overdueCount, pendingCount, finalDespair, acceptanceClicks);
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
      despairIndex:  finalDespair,
      despairDelta,
      tier,
      isNewPersonalLow,
      worstEverDespair:    worstEver,
      npcMessage,
      npcRelationshipState: newNpcState,
      activeNPC,             // ADDED: frontend can show which NPC is active
      ritual:        randomRitual,
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

// ── POST /api/dashboard/accept-fate (unchanged) ───────────────────────────────
exports.acceptFate = async (req, res) => {
  try {
    const userId = req.user.userId;
    const user   = await User.findById(userId);
    const now    = new Date();

    const daysSinceLast = user.lastAcceptanceAt
      ? (now - new Date(user.lastAcceptanceAt)) / (1000 * 60 * 60 * 24)
      : 999;
    const newCount = daysSinceLast > 7 ? 1 : (user.acceptanceClicks || 0) + 1;

    await User.findByIdAndUpdate(userId, {
      acceptanceClicks: newCount,
      lastAcceptanceAt: now
    });

    const responses = {
      mild:   ["Acceptance is the first step. The tasks are still there, but okay.", "You've accepted your fate. The universe respects this, mildly.", "Noted. You accept it. The work remains. But noted."],
      brutal: ["Growth. Terrible, useless growth.", "You've accepted it. The deadline has not.", "At last. Acceptance. The tasks don't care, but I'm logging this."],
      damage: ["The cat is in the box. The assignment is not submitted. Both are true.", "You accept your fate. Your fate does not accept this as submission.", "Documented. 'User accepted fate.' Nothing changes. Everything changes."],
    };

    const level   = user.sarcasmLevel || 'brutal';
    const options = responses[level];
    const message = options[Math.floor(Math.random() * options.length)];
    const zenUnlocked = newCount >= 3;

    res.json({
      message,
      acceptanceClicks: newCount,
      zenUnlocked,
      zenMessage: zenUnlocked ? "The Zen of Failure ritual is now available. You've earned it." : null
    });

  } catch (err) {
    console.error("[acceptFate] Error:", err);
    res.status(500).json({ message: "Even acceptance failed. That's impressive." });
  }
};
