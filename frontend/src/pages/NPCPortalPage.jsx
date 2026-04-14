// frontend/src/pages/NPCPortalPage.jsx
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Lock, CheckCircle, Sparkles, RefreshCw, ChevronRight } from 'lucide-react';

// ── NPC roster definition ─────────────────────────────────────────────────────
// Each NPC has a distinct voice, personality, visual identity, and unlock condition.
// Preview lines are generated client-side using the user's real despair data.
const NPC_ROSTER = [
  {
    id: 'hostileMentor',
    name: 'The Hostile Mentor',
    title: 'Professor of Your Failures',
    emoji: '👨‍🏫',
    accentColor: '#00d4ff',
    bgColor: 'rgba(0, 212, 255, 0.06)',
    borderColor: 'rgba(0, 212, 255, 0.25)',
    activeBorder: 'rgba(0, 212, 255, 0.8)',
    tags: ['Specific', 'Academic', 'Withering'],
    backstory:
      'A tenured professor who has seen exactly your type before — three times this semester alone. He doesn\'t hate you. He\'s just profoundly, specifically disappointed. His feedback is always accurate, always surgical, and always two weeks too late to be useful.',
    unlockCondition: null,
    // Per-tier preview lines. taskName is injected from the user's most urgent task.
    previewLines: {
      calm:    (t) => t ? `"${t}" is still pending. Interesting choice.`                                   : 'Nothing overdue? I am watching. Carefully.',
      mid:     (t) => t ? `"${t}" — we discussed this. You ignored my advice. Here we are.`               : 'The despair metrics are concerning. Not surprising, but concerning.',
      high:    (t) => t ? `"${t}". Specifically. What is your plan for it. I will wait.`                  : 'I have seen this trajectory before. I have watched it fail before.',
      extreme: (t) => t ? `"${t}" is overdue. Your entire academic record is watching.`                   : 'The heat death of your GPA is imminent. I am, as always, unsurprised.',
    },
  },
  {
    id: 'chaoticFriend',
    name: 'The Chaotic Friend',
    title: 'Agent of Academic Entropy',
    emoji: '🤪',
    accentColor: '#ffd166',
    bgColor: 'rgba(255, 209, 102, 0.06)',
    borderColor: 'rgba(255, 209, 102, 0.25)',
    activeBorder: 'rgba(255, 209, 102, 0.8)',
    tags: ['Unhinged', 'Hyped', 'Chaotic Good'],
    backstory:
      'Your friend who dropped two courses last semester and somehow has a better GPA than you. She operates entirely on vibes, sheer luck, and a frankly alarming tolerance for consequences. She means well. She has never once given useful advice. You keep asking anyway.',
    unlockCondition: null,
    previewLines: {
      calm:    (t) => t ? `Skip "${t}"! Go eat something! YOLO! It\'ll be fine!!`                         : 'You\'re literally fine?? Go outside!! Touch grass!! NOW!!',
      mid:     (t) => t ? `Okay so for "${t}" — just submit SOMETHING. Anything. Even vibes count!!`      : 'Okay okay okay we can FIX this. Have you tried just... doing it RIGHT NOW?',
      high:    (t) => t ? `"${t}"?? My cousin submitted something 3 days late and got full marks so JUST DO IT!!` : 'THIS IS FINE. WE ARE FINE. ARE WE FINE? YES. PROBABLY. GO.',
      extreme: ()  => 'OKAY PANIC MODE. DROP EVERYTHING. SUBMIT SOMETHING. ANYTHING. NOW. GO. WHY ARE YOU STILL READING THIS??',
    },
  },
  {
    id: 'momFriend',
    name: 'The Mom Friend',
    title: 'Carrier of Unnecessary Guilt',
    emoji: '🤱',
    accentColor: '#ff6b9d',
    bgColor: 'rgba(255, 107, 157, 0.06)',
    borderColor: 'rgba(255, 107, 157, 0.25)',
    activeBorder: 'rgba(255, 107, 157, 0.8)',
    tags: ['Worried', 'Caring', 'Passive Guilt'],
    backstory:
      'She\'s already eaten, already slept 8 hours, and already submitted everything a week early. She isn\'t judging you — she\'s just worried. Her concern is genuine. Her comparisons to her cousin\'s roommate\'s grades are entirely accidental. Mostly.',
    unlockCondition: null,
    previewLines: {
      calm:    (t) => t ? `Have you eaten? Also "${t}" — I\'m just saying, it\'s there. No rush. Have you eaten?` : 'You seem okay! Did you sleep? You look tired. Are you sure you\'re okay?',
      mid:     (t) => t ? `I\'m not worried. I\'m just. "${t}". Have you started it? My cousin submitted hers last week.` : 'Your despair score is going up. I\'m sending you a snack recommendation. Please eat.',
      high:    (t) => t ? `"${t}" — honey I\'m scared. My sister\'s friend\'s daughter finished this course early and she said —`  : 'I just want you to be okay. I made you a study playlist. Please use it. Please sleep.',
      extreme: ()  => 'Oh no. Oh no no no. Okay. First — eat something. Second — I\'m texting my cousin who knows a professor. Don\'t argue.',
    },
  },
  {
    id: 'theMirror',
    name: 'The Mirror',
    title: 'You, But From Later Tonight',
    emoji: '🪞',
    accentColor: '#9d4edd',
    bgColor: 'rgba(157, 78, 221, 0.06)',
    borderColor: 'rgba(157, 78, 221, 0.25)',
    activeBorder: 'rgba(157, 78, 221, 0.8)',
    tags: ['Eerie', 'Prophetic', 'Future Dread'],
    backstory:
      'Not a character. Not a bot. You, arriving from the night before the deadline, carrying the specific exhaustion of someone who made exactly the choices you\'re making right now. The messages are eerily specific. You\'ll wonder how it knew.',
    unlockCondition: { field: 'worstEverDespair', threshold: 80 },
    unlockLabel: 'Reach 80%+ despair once to unlock',
    previewLines: {
      calm:    (t) => t ? `I\'m you. From tomorrow. "${t}" — you didn\'t start it. I\'m watching you not start it right now.` : 'It\'s quiet now. It won\'t be. I remember this specific quiet.',
      mid:     (t) => t ? `I remember this moment. "${t}" was right there. I still didn\'t do it. You\'re about to make that choice.` : 'The despair gets worse. I\'m here to confirm that.',
      high:    (t) => t ? `"${t}". You\'re thinking about starting it. You won\'t. I know because I was there.`                : 'It\'s me. From 4 hours from now. It\'s not fine. You know what to do.',
      extreme: (t) => t ? `The deadline for "${t}" passed while I was deciding whether to start. I\'m you. Just start.`        : 'This is where it ends. Unless you act now. I didn\'t. You still can.',
    },
  },
];

// ── Relationship state display config ─────────────────────────────────────────
const REL_STATE = {
  neutral:      { label: 'Neutral',              pct: 5,  color: '#666',    bg: 'rgba(100,100,100,0.3)' },
  concerned:    { label: 'Concerned',             pct: 30, color: '#ffd166', bg: 'rgba(255,209,102,0.3)' },
  disappointed: { label: 'Tired of This',         pct: 55, color: '#ffa500', bg: 'rgba(255,165,0,0.3)' },
  given_up:     { label: 'Given Up',              pct: 80, color: '#ff6b35', bg: 'rgba(255,107,53,0.3)' },
  impressed:    { label: 'Reluctantly Impressed', pct: 100,color: '#06d6a0', bg: 'rgba(6,214,160,0.3)' },
};

// Map NPC id to the User.npcRelationshipState key
const NPC_STATE_KEY = {
  hostileMentor: 'hostileMentor',
  chaoticFriend: 'chaoticFriend',
  momFriend:     'momFriend',
  theMirror:     null, // The Mirror has no relationship state — it's always eerie
};

function getPreviewTier(despairIndex) {
  if (despairIndex >= 86) return 'extreme';
  if (despairIndex >= 66) return 'high';
  if (despairIndex >= 46) return 'mid';
  return 'calm';
}

// ── RelationshipBar sub-component ─────────────────────────────────────────────
function RelationshipBar({ state }) {
  const cfg = REL_STATE[state] || REL_STATE.neutral;
  return (
    <div className="mt-3">
      <div className="flex justify-between items-center mb-1">
        <span className="text-[10px] uppercase tracking-widest text-gray-500">Relationship</span>
        <span className="text-[10px] font-semibold" style={{ color: cfg.color }}>{cfg.label}</span>
      </div>
      <div className="w-full bg-gray-800 rounded-full h-1.5 overflow-hidden">
        <motion.div
          className="h-full rounded-full"
          style={{ background: cfg.color }}
          initial={{ width: 0 }}
          animate={{ width: `${cfg.pct}%` }}
          transition={{ duration: 1, delay: 0.3, ease: 'easeOut' }}
        />
      </div>
    </div>
  );
}

// ── Main NPCPortalPage ────────────────────────────────────────────────────────
export default function NPCPortalPage() {
  const [userData, setUserData]         = useState(null);
  const [dashData, setDashData]         = useState(null);
  const [loading, setLoading]           = useState(true);
  const [saving, setSaving]             = useState(false);
  const [activeNPC, setActiveNPC]       = useState('hostileMentor');
  const [hoveredNPC, setHoveredNPC]     = useState(null);
  const [confirmSelect, setConfirmSelect] = useState(null); // npc id being confirmed
  const [saveSuccess, setSaveSuccess]   = useState(false);
  const [unlockPulse, setUnlockPulse]   = useState(false);

  // ── Fetch user profile + dashboard data ──────────────────────────────────
  useEffect(() => {
    const fetchAll = async () => {
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };
      try {
        const [userRes, dashRes] = await Promise.all([
          fetch('http://localhost:5000/api/users/profile', { headers }),
          fetch('http://localhost:5000/api/dashboard',     { headers }),
        ]);
        const uData = await userRes.json();
        const dData = await dashRes.json();
        setUserData(uData.user || uData);
        setDashData(dData);
        setActiveNPC(uData.user?.activeNPC || uData.activeNPC || 'hostileMentor');
      } catch (err) {
        console.error('NPCPortal: fetch failed', err);
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, []);

  // Pulse the Mirror card when user first unlocks it
  useEffect(() => {
    if (!userData) return;
    if ((userData.worstEverDespair || 0) >= 80) {
      setUnlockPulse(true);
      setTimeout(() => setUnlockPulse(false), 3000);
    }
  }, [userData]);

  // ── Save active NPC selection ─────────────────────────────────────────────
  const handleSelect = async (npcId) => {
    if (npcId === activeNPC) return;
    setSaving(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('http://localhost:5000/api/users/npc', {
        method:  'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body:    JSON.stringify({ activeNPC: npcId }),
      });
      if (res.ok) {
        setActiveNPC(npcId);
        setConfirmSelect(null);
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 2500);
        // Broadcast so Dashboard and Tasks page refresh their NPC display
        window.dispatchEvent(new Event('npcChanged'));
        window.dispatchEvent(new Event('refreshDashboard'));
      }
    } catch (err) {
      console.error('NPCPortal: save failed', err);
    } finally {
      setSaving(false);
    }
  };

  // ── Derive preview data from dashboard ──────────────────────────────────
  const despairIndex   = dashData?.despairIndex  ?? 0;
  const tier           = getPreviewTier(despairIndex);
  const urgentTaskName = dashData?.urgentTasks?.[0]?.title || null;

  // ── Is NPC unlocked? ──────────────────────────────────────────────────────
  const isUnlocked = (npc) => {
    if (!npc.unlockCondition) return true;
    const { field, threshold } = npc.unlockCondition;
    return (userData?.[field] || 0) >= threshold;
  };

  // ── Active NPC info for banner ────────────────────────────────────────────
  const activeNPCDef = NPC_ROSTER.find(n => n.id === activeNPC) || NPC_ROSTER[0];

  if (loading) {
    return (
      <div className="min-h-screen bg-[#1A1A1B] flex items-center justify-center">
        <p className="text-[#9d4edd] animate-pulse text-lg">Summoning your companions...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#1A1A1B] text-white p-6 md:p-12 pt-24">

      {/* ── Save success toast ─────────────────────────────────────────────── */}
      <AnimatePresence>
        {saveSuccess && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-20 left-1/2 -translate-x-1/2 z-50 px-6 py-3 rounded-full
              bg-[#06d6a0]/20 text-[#06d6a0] border border-[#06d6a0]/40 text-sm font-semibold"
          >
            <CheckCircle size={14} className="inline mr-2" />
            Companion updated. They're already judging you.
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Page header ───────────────────────────────────────────────────── */}
      <div className="mb-10">
        <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-white to-gray-500 bg-clip-text text-transparent">
          Choose Your Companion
        </h1>
        <p className="text-gray-400 text-sm max-w-xl">
          Your companion's voice follows you everywhere — dashboard roasts, task escalations, notification alerts.
          They remember how badly you've been doing. Choose carefully.
        </p>
      </div>

      {/* ── Active companion banner ────────────────────────────────────────── */}
      <motion.div
        key={activeNPC}
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-10 p-5 rounded-2xl flex items-center gap-5 relative overflow-hidden"
        style={{
          background: activeNPCDef.bgColor,
          border: `1px solid ${activeNPCDef.activeBorder}`,
        }}
      >
        {/* Background glow */}
        <div
          className="absolute inset-0 opacity-5 pointer-events-none"
          style={{ background: `radial-gradient(ellipse at left, ${activeNPCDef.accentColor}, transparent 70%)` }}
        />

        {/* Avatar */}
        <div
          className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl shrink-0 relative z-10"
          style={{ background: `${activeNPCDef.accentColor}18`, border: `1px solid ${activeNPCDef.accentColor}40` }}
        >
          {activeNPCDef.emoji}
        </div>

        {/* Info */}
        <div className="flex-1 relative z-10">
          <div className="flex items-center gap-3 mb-1">
            <span className="text-xs font-semibold uppercase tracking-widest" style={{ color: activeNPCDef.accentColor }}>
              Active companion
            </span>
            <span
              className="text-[10px] px-2 py-0.5 rounded-full font-semibold"
              style={{ background: `${activeNPCDef.accentColor}20`, color: activeNPCDef.accentColor }}
            >
              ● LIVE
            </span>
          </div>
          <h2 className="text-xl font-bold text-white">{activeNPCDef.name}</h2>
          <p className="text-sm text-gray-400 mt-0.5">{activeNPCDef.title}</p>
        </div>

        {/* Current live quote */}
        <div
          className="hidden md:block max-w-xs p-4 rounded-xl italic text-sm text-gray-200 relative z-10"
          style={{ background: 'rgba(0,0,0,0.3)', borderLeft: `3px solid ${activeNPCDef.accentColor}` }}
        >
          "{activeNPCDef.previewLines[tier](urgentTaskName)}"
        </div>
      </motion.div>

      {/* ── Despair context bar ────────────────────────────────────────────── */}
      <div className="mb-8 flex items-center gap-3 text-xs text-gray-500">
        <RefreshCw size={12} />
        <span>
          Previews are based on your current despair index:{' '}
          <span style={{ color: dashData?.tier?.color || '#ff6b35' }} className="font-semibold">
            {despairIndex}% — {dashData?.tier?.name || 'Unknown'}
          </span>
          {urgentTaskName && (
            <span className="ml-2">
              | Most urgent task: <span className="text-white">"{urgentTaskName}"</span>
            </span>
          )}
        </span>
      </div>

      {/* ── NPC grid ──────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {NPC_ROSTER.map((npc, idx) => {
          const unlocked       = isUnlocked(npc);
          const isActive       = activeNPC === npc.id;
          const isHovered      = hoveredNPC === npc.id;
          const isConfirming   = confirmSelect === npc.id;
          const relStateKey    = NPC_STATE_KEY[npc.id];
          const relState       = relStateKey
            ? (userData?.npcRelationshipState?.[relStateKey] || 'neutral')
            : null;
          const previewQuote   = npc.previewLines[tier](urgentTaskName);
          const isMirrorUnlock = npc.id === 'theMirror' && unlocked && unlockPulse;

          return (
            <motion.div
              key={npc.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: unlocked ? 1 : 0.5, y: 0 }}
              transition={{ delay: idx * 0.08 }}
              onMouseEnter={() => unlocked && setHoveredNPC(npc.id)}
              onMouseLeave={() => setHoveredNPC(null)}
              className="relative rounded-2xl overflow-hidden transition-all duration-300"
              style={{
                background: isActive ? npc.bgColor : 'rgba(44,44,46,0.8)',
                border: `1px solid ${
                  isActive    ? npc.activeBorder :
                  isHovered   ? npc.borderColor  :
                  'rgba(255,255,255,0.08)'
                }`,
                boxShadow: isMirrorUnlock ? `0 0 30px ${npc.accentColor}40` : 'none',
              }}
            >
              {/* Active ribbon */}
              {isActive && (
                <div
                  className="absolute top-0 left-0 right-0 h-0.5"
                  style={{ background: `linear-gradient(90deg, transparent, ${npc.accentColor}, transparent)` }}
                />
              )}

              {/* Lock overlay */}
              {!unlocked && (
                <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-black/60 rounded-2xl">
                  <Lock size={32} className="text-gray-500 mb-3" />
                  <p className="text-gray-400 text-sm font-semibold">{npc.unlockLabel}</p>
                  <p className="text-gray-600 text-xs mt-1">
                    Current worst: {userData?.worstEverDespair || 0}% / 80%
                  </p>
                  <div className="mt-3 w-40 bg-gray-800 rounded-full h-1.5">
                    <div
                      className="h-full rounded-full bg-[#9d4edd] transition-all duration-1000"
                      style={{ width: `${Math.min(100, ((userData?.worstEverDespair || 0) / 80) * 100)}%` }}
                    />
                  </div>
                </div>
              )}

              <div className="p-6">
                {/* Card header */}
                <div className="flex items-start gap-4 mb-4">
                  <div
                    className="w-14 h-14 rounded-xl flex items-center justify-center text-2xl shrink-0"
                    style={{ background: `${npc.accentColor}15`, border: `1px solid ${npc.accentColor}30` }}
                  >
                    {npc.emoji}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-base font-bold text-white">{npc.name}</h3>
                      {isActive && (
                        <span
                          className="text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider"
                          style={{ background: `${npc.accentColor}20`, color: npc.accentColor }}
                        >
                          Active
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-500 mt-0.5">{npc.title}</p>
                  </div>
                </div>

                {/* Personality tags */}
                <div className="flex flex-wrap gap-2 mb-4">
                  {npc.tags.map(tag => (
                    <span
                      key={tag}
                      className="text-[10px] px-2 py-0.5 rounded-md font-semibold uppercase tracking-wide"
                      style={{ background: `${npc.accentColor}12`, color: `${npc.accentColor}cc` }}
                    >
                      {tag}
                    </span>
                  ))}
                </div>

                {/* Backstory */}
                <p className="text-sm text-gray-400 leading-relaxed mb-4 italic">
                  {npc.backstory}
                </p>

                {/* Live preview quote */}
                <div
                  className="p-3 rounded-lg mb-4 text-sm text-gray-200 italic"
                  style={{ background: 'rgba(0,0,0,0.3)', borderLeft: `2px solid ${npc.accentColor}60` }}
                >
                  <span className="text-[10px] not-italic uppercase tracking-widest text-gray-600 block mb-1">
                    {npc.id === 'theMirror' ? '📡 Transmission' : '💬 Right now, they\'d say'}
                  </span>
                  "{previewQuote}"
                </div>

                {/* Relationship bar (not for The Mirror) */}
                {relState && <RelationshipBar state={relState} />}

                {/* The Mirror: eerie status instead of relationship */}
                {npc.id === 'theMirror' && unlocked && (
                  <div className="mt-3">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-[10px] uppercase tracking-widest text-gray-500">Signal strength</span>
                      <span className="text-[10px] font-semibold text-[#9d4edd]">
                        {despairIndex >= 66 ? 'Strong' : despairIndex >= 46 ? 'Clear' : 'Faint'}
                      </span>
                    </div>
                    <div className="w-full bg-gray-800 rounded-full h-1.5 overflow-hidden">
                      <motion.div
                        className="h-full rounded-full bg-[#9d4edd]"
                        animate={{ width: [`${Math.max(20, despairIndex)}%`, `${Math.max(30, despairIndex + 5)}%`, `${Math.max(20, despairIndex)}%`] }}
                        transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                      />
                    </div>
                  </div>
                )}

                {/* Select / Confirm buttons */}
                <div className="mt-5">
                  {isActive ? (
                    <div
                      className="w-full py-2.5 rounded-xl text-sm font-semibold flex items-center justify-center gap-2"
                      style={{ background: `${npc.accentColor}15`, color: npc.accentColor }}
                    >
                      <CheckCircle size={14} />
                      Currently active
                    </div>
                  ) : isConfirming ? (
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleSelect(npc.id)}
                        disabled={saving}
                        className="flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all"
                        style={{ background: npc.accentColor, color: '#000' }}
                      >
                        {saving ? 'Switching...' : 'Confirm switch'}
                      </button>
                      <button
                        onClick={() => setConfirmSelect(null)}
                        className="px-4 py-2.5 rounded-xl text-sm text-gray-400 border border-gray-700 hover:bg-gray-800 transition-all"
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => unlocked && setConfirmSelect(npc.id)}
                      disabled={!unlocked}
                      className="w-full py-2.5 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition-all"
                      style={{
                        background: isHovered ? `${npc.accentColor}20` : 'transparent',
                        color: isHovered ? npc.accentColor : '#6b7280',
                        border: `1px solid ${isHovered ? npc.borderColor : 'rgba(255,255,255,0.08)'}`,
                      }}
                    >
                      Choose this companion
                      <ChevronRight size={14} />
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* ── Relationship guide ─────────────────────────────────────────────── */}
      <div className="mt-10 p-6 rounded-2xl bg-gray-900/50 border border-gray-800">
        <h3 className="text-sm font-bold text-gray-300 mb-4 flex items-center gap-2">
          <Sparkles size={14} className="text-[#ffd166]" />
          How relationships work
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {Object.entries(REL_STATE).map(([key, cfg]) => (
            <div key={key} className="text-center">
              <div
                className="w-full h-1 rounded-full mb-2"
                style={{ background: cfg.color, opacity: 0.7 }}
              />
              <p className="text-[11px] font-semibold" style={{ color: cfg.color }}>{cfg.label}</p>
              <p className="text-[10px] text-gray-600 mt-0.5">
                {key === 'neutral'      && 'Clean slate'}
                {key === 'concerned'    && '1+ overdue'}
                {key === 'disappointed' && '3+ overdue'}
                {key === 'given_up'     && '5+ overdue'}
                {key === 'impressed'    && '3 completions in 48h'}
              </p>
            </div>
          ))}
        </div>
        <p className="text-xs text-gray-600 mt-4">
          Relationship states evolve automatically based on your task behavior. Completing 3 tasks in 48 hours after being in "Disappointed" or "Given Up" triggers a redemption arc — your companion becomes reluctantly impressed.
          States persist between sessions and affect the commentary tone everywhere.
        </p>
      </div>

    </div>
  );
}
