// backend/utils/despairUtils.js
// ─────────────────────────────────────────────────────────────────────────────
// SINGLE SOURCE OF TRUTH for despair calculations.
// Previously the same formula was copy-pasted in dashboardController.js AND
// notificationService.js and they had quietly diverged. Import from here only.
// ─────────────────────────────────────────────────────────────────────────────

// ── Tier definitions ─────────────────────────────────────────────────────────
const DESPAIR_TIERS = [
  { min: 0,  max: 20,  name: "Functional Delusion",       color: "#06d6a0", emoji: "🧘", intensity: 0.00 },
  { min: 21, max: 45,  name: "Concerning Vibes",          color: "#ffd166", emoji: "😐", intensity: 0.25 },
  { min: 46, max: 65,  name: "Spiraling",                 color: "#ffa500", emoji: "😰", intensity: 0.50 },
  { min: 66, max: 85,  name: "Full Goblin Mode",          color: "#ff6b35", emoji: "😤", intensity: 0.75 },
  { min: 86, max: 100, name: "Academic Extinction Event", color: "#ff006e", emoji: "💀", intensity: 1.00 },
];

function getDespairTier(score) {
  return DESPAIR_TIERS.find(t => score >= t.min && score <= t.max) || DESPAIR_TIERS[0];
}

// ── 4-factor weighted formula ─────────────────────────────────────────────────
//
//  Factor 1 — Deadline Urgency (0–40 pts)
//    Exponential curve: e^(-K * daysLeft). Far away → ~0. Due today → 40pts.
//    Overdue tasks get full urgency + small bonus per extra day past.
//
//  Factor 2 — Overdue Debt (0–25 pts)
//    Logarithmic so 1 overdue task ≈ 15pts, 5 ≈ 25pts. Not 75pts.
//
//  Factor 3 — Momentum (0–20 pts)
//    Rewards recent completions (last 48h). Punishes total inactivity.
//    3 completions yesterday = formula partially forgives 2 overdue tasks.
//
//  Factor 4 — Mood Modifier (−5 to +10 pts)
//    Good mood subtracts up to 5pts; bad mood adds up to 10pts.
//    Neutral (default, no mood data) = 0 adjustment.
//
//  Formula cap: 85. Reserve 86–100 for TRUE PANIC STATE:
//    Requires: overdue ≥ 3 AND recentCompletions = 0 AND ≥1 task due within 24h.
//
// @param {Array}  tasks   Mongoose Task documents or plain objects
// @param {Object} opts    { mood: Number -1..1 }   (optional)
// @returns {Number} integer 0–100
// ─────────────────────────────────────────────────────────────────────────────
function calculateDespairIndex(tasks, opts = {}) {
  if (!tasks || tasks.length === 0) return 0;

  const now        = new Date();
  const cutoff48h  = new Date(now - 48 * 60 * 60 * 1000);
  const K          = 0.28; // urgency decay constant

  const active = tasks.filter(t => t.status !== 'done' && t.status !== 'completed');

  // ── Factor 1: Deadline Urgency (0–40) ──────────────────────────────────────
  let urgencyRaw = 0;
  active.forEach(task => {
    const dl       = new Date(task.deadline);
    const daysLeft = (dl - now) / (1000 * 60 * 60 * 24);
    if (daysLeft <= 0) {
      // Overdue: full urgency + capped bonus for days past
      urgencyRaw += 1.0 + Math.min(0.5, Math.abs(daysLeft) * 0.04);
    } else {
      urgencyRaw += Math.exp(-K * daysLeft);
    }
  });
  const urgencyNorm  = active.length > 0 ? urgencyRaw / active.length : 0;
  const urgencyScore = Math.min(40, urgencyNorm * 40);

  // ── Factor 2: Overdue Debt (0–25) ──────────────────────────────────────────
  const overdueCount = tasks.filter(t => {
    return new Date(t.deadline) < now
      && t.status !== 'done'
      && t.status !== 'completed';
  }).length;
  const overdueScore = overdueCount > 0
    ? Math.min(25, 13 * Math.log2(overdueCount + 1))
    : 0;

  // ── Factor 3: Momentum (0–20) ───────────────────────────────────────────────
  const recentCompletions = tasks.filter(t => {
    const ca  = t.completedAt ? new Date(t.completedAt) : null;
    const ref = ca || (t.status === 'done' ? new Date(t.updatedAt) : null);
    return ref && ref > cutoff48h;
  }).length;
  const inactivityPenalty = active.length > 0 && recentCompletions === 0 ? 10 : 0;
  const momentumBonus     = Math.min(20, recentCompletions * 5);
  const momentumScore     = Math.max(0, inactivityPenalty - momentumBonus);

  // ── Factor 4: Mood Modifier (−5 to +10) ────────────────────────────────────
  const mood      = typeof opts.mood === 'number' ? Math.max(-1, Math.min(1, opts.mood)) : 0;
  const moodScore = mood < 0 ? Math.abs(mood) * 10 : -(mood * 5);

  // ── Combine ─────────────────────────────────────────────────────────────────
  let raw = urgencyScore + overdueScore + momentumScore + moodScore;
  raw = Math.max(0, Math.min(85, raw));

  // ── True Panic State (86–100) ───────────────────────────────────────────────
  const imminentCount = active.filter(t => {
    const h = (new Date(t.deadline) - now) / (1000 * 60 * 60);
    return h >= 0 && h <= 24;
  }).length;

  if (overdueCount >= 3 && recentCompletions === 0 && imminentCount >= 1) {
    raw = 85 + Math.min(15, overdueCount * 2 + imminentCount * 2);
  }

  return Math.round(Math.min(100, Math.max(0, raw)));
}

// ── Escalation level for individual tasks ────────────────────────────────────
// Used by the cron job and task creation to keep escalationLevel current.
function calculateEscalationLevel(task) {
  if (task.status === 'done' || task.status === 'completed') return 'normal';
  const now      = new Date();
  const deadline = new Date(task.deadline);
  const hoursLeft = (deadline - now) / (1000 * 60 * 60);
  const daysCreated = (now - new Date(task.createdAt)) / (1000 * 60 * 60 * 24);

  if (deadline < now) return 'hysterical';             // overdue → hysterical
  if (hoursLeft <= 24) return 'panic';                 // < 24h → panic
  if (hoursLeft <= 72 || daysCreated >= 5) return 'warning'; // < 3 days or neglected
  return 'normal';
}

module.exports = { calculateDespairIndex, getDespairTier, DESPAIR_TIERS, calculateEscalationLevel };
