// frontend/src/pages/Dashboard.jsx
import React, { useEffect, useState, useRef } from 'react';
import PanicMeter from '../components/PanicMeter';
import { AlertTriangle, Zap, Coffee, Wind, Skull, Smile, CheckCircle } from 'lucide-react';

// Personality loading messages — shown while the dashboard fetches
const LOADING_LINES = [
  "Summoning your academic regrets...",
  "Calculating your specific failure mode...",
  "Asking the void about your GPA...",
  "Compiling evidence against you...",
  "Cross-referencing your choices with consequences...",
];

export default function Dashboard() {
  const [data, setData]               = useState(null);
  const [loading, setLoading]         = useState(true);
  const [loadingLine]                 = useState(() => LOADING_LINES[Math.floor(Math.random() * LOADING_LINES.length)]);
  const [activeEffect, setActiveEffect] = useState(null);
  const [sarcasmLevel, setSarcasmLevel] = useState('brutal');
  const [deltaToast, setDeltaToast]   = useState(null); // { message, isGood }
  const [acceptanceResult, setAcceptanceResult] = useState(null);
  const containerRef = useRef(null);

  const triggerDespairCheck = async () => {
    try {
      const token = localStorage.getItem('token');
      await fetch('http://localhost:5000/api/notifications/check-despair', {
        method:  'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
    } catch (error) {
      console.error('Failed to trigger despair check:', error);
    }
  };

  // ── Fetch dashboard ────────────────────────────────────────────────────────
  const fetchDashboard = async () => {
    try {
      const token = localStorage.getItem('token');
      const res   = await fetch('http://localhost:5000/api/dashboard', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const dashboardData = await res.json();
        setData(dashboardData);
        setSarcasmLevel(dashboardData.sarcasmLevel || 'brutal');
        if (dashboardData.despairIndex >= 70) await triggerDespairCheck();
      }
    } catch (err) {
      console.error("Failed to load chaos:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
    window.addEventListener('sarcasmChanged',    fetchDashboard);
    window.addEventListener('refreshDashboard',  fetchDashboard);
    return () => {
      window.removeEventListener('sarcasmChanged',   fetchDashboard);
      window.removeEventListener('refreshDashboard', fetchDashboard);
    };
  }, []);

  // ── ADDED: Despair-reactive CSS variable injection ─────────────────────────
  // As the despair index rises, --despair-intensity (0.0–1.0) bleeds into
  // border colors and background tints across the whole dashboard.
  // Under 30%: clean. 60%+: orange tint. 85%+: red pulse. 100%: shake.
  useEffect(() => {
    if (!data) return;
    const intensity = data.tier?.intensity ?? (data.despairIndex / 100);
    document.documentElement.style.setProperty('--despair-intensity', intensity.toFixed(2));

    // Remove all tier classes, add current one
    document.documentElement.classList.remove(
      'despair-calm', 'despair-concerning', 'despair-spiraling',
      'despair-goblin', 'despair-extinction'
    );
    const tierMap = {
      "Functional Delusion":       'despair-calm',
      "Concerning Vibes":          'despair-concerning',
      "Spiraling":                 'despair-spiraling',
      "Full Goblin Mode":          'despair-goblin',
      "Academic Extinction Event": 'despair-extinction',
    };
    const cls = tierMap[data.tier?.name];
    if (cls) document.documentElement.classList.add(cls);

    return () => {
      document.documentElement.style.setProperty('--despair-intensity', '0');
    };
  }, [data?.despairIndex, data?.tier?.name]);

  // ── ADDED: Despair delta toast ─────────────────────────────────────────────
  // When the index meaningfully drops (delta < −3), briefly show a green toast.
  // When it spikes (delta > +5), show an orange warning.
  useEffect(() => {
    if (!data) return;
    const delta = data.despairDelta;
    if (!delta || Math.abs(delta) < 3) return;

    if (delta < -3) {
      setDeltaToast({
        message: `↓ ${Math.abs(delta)} pts — The despair is retreating. Enjoy it while it lasts.`,
        isGood:  true
      });
    } else if (delta > 5) {
      setDeltaToast({
        message: `↑ ${delta} pts — Things have gotten measurably worse.`,
        isGood:  false
      });
    }
    const timer = setTimeout(() => setDeltaToast(null), 4000);
    return () => clearTimeout(timer);
  }, [data?.despairDelta]);

  // ── Accept fate handler ────────────────────────────────────────────────────
  const handleAcceptFate = async () => {
    try {
      const token = localStorage.getItem('token');
      const res   = await fetch('http://localhost:5000/api/dashboard/accept-fate', {
        method:  'POST',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const result = await res.json();
        setAcceptanceResult(result);
        setTimeout(() => setAcceptanceResult(null), 5000);
        // Re-fetch so ritual updates if Zen unlocked
        if (result.zenUnlocked) fetchDashboard();
      }
    } catch (err) {
      console.error('acceptFate failed:', err);
    }
  };

  const triggerEffect = (effect) => {
    setActiveEffect(effect);
    setTimeout(() => setActiveEffect(null), 2000);
  };

  const getMoods = (index) => {
    if (index > 80) return ['💀', '⚰️', '🥀', '📉', '👻', '🚮'];
    if (index > 50) return ['😰', '🔥', '🏃', '🍷', '🗑️', '🤡'];
    if (index > 25) return ['😐', '☕', '📧', '🩹', '🌩️', '🫠'];
    return ['🧘', '🍵', '✨', '🛌', '🐢', '🌸'];
  };

  // ── NPC identity based on sarcasm + relationship state ──────────────────────
  const getNpcDisplay = () => {
    const relState = data?.npcRelationshipState?.hostileMentor || 'neutral';
    const stateLabels = {
      neutral:     '',
      concerned:   ' [concerned]',
      disappointed:' [tired of this]',
      given_up:    ' [given up]',
      impressed:   ' [reluctantly impressed]',
    };
    const names = {
      damage: 'The Destroyer',
      brutal: 'Honest Friend',
      mild:   'Passive Mentor',
    };
    const emojis = {
      damage: '💀', brutal: '😈', mild: '😐',
    };
    const name  = names[sarcasmLevel] || 'Honest Friend';
    const emoji = emojis[sarcasmLevel] || '😈';
    return { name: name + (stateLabels[relState] || ''), emoji };
  };

  // ── Loading ────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-screen bg-[#1A1A1B] flex items-center justify-center">
        <p className="text-[#ff6b35] animate-pulse text-lg">{loadingLine}</p>
      </div>
    );
  }
  if (!data) return <div className="p-10 text-white">Failed to connect to the void.</div>;

  const currentMoods = getMoods(data.despairIndex);
  const npc          = getNpcDisplay();

  return (
    <div
      ref={containerRef}
      className="min-h-screen bg-[#1A1A1B] text-white p-6 md:p-12 pt-24"
      style={{
        // Reactive border tint — bleeds orange/red as intensity rises
        '--reactive-border': `color-mix(in srgb, #ff6b35 calc(var(--despair-intensity, 0) * 40%), transparent)`,
      }}
    >
      {/* ── Despair delta toast ─────────────────────────────────────────────── */}
      {deltaToast && (
        <div className={`fixed top-20 left-1/2 -translate-x-1/2 z-50 px-6 py-3 rounded-full text-sm font-semibold shadow-lg transition-all
          ${deltaToast.isGood
            ? 'bg-[#06d6a0]/20 text-[#06d6a0] border border-[#06d6a0]/40'
            : 'bg-[#ff6b35]/20 text-[#ff6b35] border border-[#ff6b35]/40'
          }`}
        >
          {deltaToast.message}
        </div>
      )}

      {/* ── Acceptance result toast ─────────────────────────────────────────── */}
      {acceptanceResult && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 px-6 py-3 rounded-full text-sm font-semibold shadow-lg
          bg-[#9d4edd]/20 text-[#c77dff] border border-[#9d4edd]/40 max-w-sm text-center"
        >
          {acceptanceResult.message}
          {acceptanceResult.zenUnlocked && (
            <div className="text-xs text-[#06d6a0] mt-1">✨ Zen of Failure unlocked</div>
          )}
        </div>
      )}

      {/* ── Header ──────────────────────────────────────────────────────────── */}
      <div className="mb-8 flex justify-between items-end">
        <div>
          <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-white to-gray-500 bg-clip-text text-transparent">
            Chaos Dashboard
          </h1>
          <p className="text-gray-400">Welcome to your daily breakdown.</p>
          <div className="mt-1 text-xs text-gray-500">
            Roast Mode: <span className="text-[#ff6b35]">{sarcasmLevel.toUpperCase()}</span>
            {' '}| NPC: {npc.emoji} {npc.name}
            {data.tier && (
              <span style={{ color: data.tier.color }} className="ml-2">
                | {data.tier.emoji} {data.tier.name}
              </span>
            )}
          </div>
        </div>

        {/* ── ADDED: I Accept My Fate button ──────────────────────────────── */}
        <button
          onClick={handleAcceptFate}
          className="flex items-center gap-2 px-5 py-3 rounded-xl border border-[#9d4edd]/30 bg-[#9d4edd]/10
            text-[#c77dff] text-sm font-semibold hover:bg-[#9d4edd]/20 transition-all"
          title="Click 3 times in a week to unlock the Zen of Failure ritual"
        >
          <CheckCircle size={16} />
          I Accept My Fate
          {data.acceptanceClicks > 0 && (
            <span className="text-xs opacity-60">({data.acceptanceClicks}/3)</span>
          )}
        </button>
      </div>

      <div
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
        style={{
          // Cards subtly inherit the reactive border color at higher despair tiers
          '--card-border': 'var(--reactive-border, transparent)',
        }}
      >

        {/* 1. Panic Meter — now receives tier data */}
        <div className="col-span-1 md:col-span-2">
          <PanicMeter
            value={data.despairIndex}
            despairDelta={data.despairDelta}
            isNewPersonalLow={data.isNewPersonalLow}
          />
        </div>

        {/* 2. NPC Widget — reacts to tier and relationship state */}
        <div
          className="bg-[#2C2C2E] p-6 rounded-xl shadow-lg flex flex-col justify-center relative overflow-hidden group"
          style={{
            borderLeft: `4px solid ${data.tier?.color || '#ff6b35'}`,
          }}
        >
          <div className="absolute -right-4 -top-4 opacity-5 group-hover:opacity-10 transition-opacity">
            <Skull size={100} />
          </div>
          <h3
            className="font-bold mb-2 uppercase text-xs tracking-widest flex items-center gap-2"
            style={{ color: data.tier?.color || '#ff6b35' }}
          >
            {npc.emoji} {npc.name}
          </h3>
          <p className="text-xl italic text-gray-200 z-10">"{data.npcMessage}"</p>

          {/* Worst ever despair display */}
          {data.worstEverDespair > 0 && (
            <p className="text-xs text-gray-600 mt-3">
              Personal worst: {data.worstEverDespair}%
              {data.despairIndex < data.worstEverDespair && (
                <span className="text-[#06d6a0] ml-1">— currently below record ✓</span>
              )}
            </p>
          )}
        </div>

        {/* 3. Impending Doom List */}
        <div className="bg-[#2C2C2E] p-6 rounded-xl border border-gray-700 flex flex-col"
          style={{ borderColor: data.despairIndex > 65 ? 'var(--reactive-border)' : undefined }}
        >
          <h3 className="text-gray-400 uppercase text-xs tracking-widest mb-4 flex items-center gap-2">
            <AlertTriangle size={16} className="text-red-500" /> Impending Doom
          </h3>
          <div className="space-y-3 flex-1">
            {data.urgentTasks && data.urgentTasks.length > 0 ? (
              data.urgentTasks.map(task => (
                <div key={task.id}
                  className="flex justify-between items-center p-3 bg-[#1A1A1B] rounded-lg border border-gray-800 hover:border-red-500/50 transition-all group cursor-pointer"
                >
                  <div className="flex items-center gap-3 overflow-hidden">
                    <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse shrink-0" />
                    <span className="font-semibold truncate group-hover:text-red-400 transition-colors">{task.title}</span>
                  </div>
                  <span className="text-xs text-gray-500 whitespace-nowrap">
                    {new Date(task.deadline).toLocaleDateString()}
                  </span>
                </div>
              ))
            ) : (
              <div className="h-full flex items-center justify-center text-gray-600 italic text-sm">
                No imminent threats... yet.
              </div>
            )}
          </div>
        </div>

        {/* 4. Mood Board */}
        <div className="bg-[#2C2C2E] p-6 rounded-xl border border-gray-700 flex flex-col items-center text-center">
          <h3 className="text-gray-400 uppercase text-xs tracking-widest mb-6 flex items-center gap-2">
            <Smile size={16} className="text-yellow-500" /> Current Vibe
          </h3>
          <div className="grid grid-cols-3 gap-4 w-full h-full content-center">
            {currentMoods.map((emoji, i) => (
              <div
                key={i}
                className="text-4xl hover:scale-125 transition-transform cursor-help"
                style={{ animationDelay: `${i * 100}ms` }}
              >
                {emoji}
              </div>
            ))}
          </div>
        </div>

        {/* 5. Quick Coping */}
        <div className="bg-[#2C2C2E] p-6 rounded-xl border border-gray-700 flex flex-col">
          <h3 className="text-gray-400 uppercase text-xs tracking-widest mb-4 flex items-center gap-2">
            <Zap size={16} className="text-blue-500" /> Quick Coping
          </h3>
          <div className="grid grid-cols-2 gap-3 flex-1">
            <button
              onClick={() => triggerEffect('breathe')}
              className={`p-2 rounded-lg transition-all flex flex-col items-center justify-center gap-1 text-xs font-medium
                ${activeEffect === 'breathe' ? 'bg-blue-600 text-white scale-105 shadow-lg shadow-blue-500/50' : 'bg-gray-800 hover:bg-gray-700'}`}
            >
              <Wind size={18} className={activeEffect === 'breathe' ? 'animate-ping' : ''} />
              <span>{activeEffect === 'breathe' ? 'Exhale...' : 'Breathe'}</span>
            </button>
            <button
              onClick={() => triggerEffect('coffee')}
              className={`p-2 rounded-lg transition-all flex flex-col items-center justify-center gap-1 text-xs font-medium
                ${activeEffect === 'coffee' ? 'bg-yellow-600 text-white animate-bounce' : 'bg-gray-800 hover:bg-gray-700'}`}
            >
              <Coffee size={18} />
              <span>{activeEffect === 'coffee' ? 'JITTERS' : 'Caffeinate'}</span>
            </button>
            <button
              onClick={() => triggerEffect('blur')}
              className={`p-2 rounded-lg transition-all duration-1000 flex flex-col items-center justify-center gap-1 text-xs font-medium
                ${activeEffect === 'blur' ? 'opacity-20 blur-[2px]' : 'bg-gray-800 hover:bg-gray-700'}`}
            >
              <Zap size={18} />
              <span>{activeEffect === 'blur' ? '.....' : 'Dissociate'}</span>
            </button>
            <button
              onClick={() => triggerEffect('scream')}
              className={`p-2 rounded-lg transition-all flex flex-col items-center justify-center gap-1 text-xs font-medium
                ${activeEffect === 'scream' ? 'bg-red-600 text-white font-black scale-110' : 'bg-gray-800 hover:bg-gray-700'}`}
            >
              <Skull size={18} className={activeEffect === 'scream' ? 'animate-spin' : ''} />
              <span>{activeEffect === 'scream' ? 'AHHHHH!' : 'Scream'}</span>
            </button>
          </div>
        </div>

        {/* 6. Ritual */}
        <div className="md:col-span-2 lg:col-span-3 bg-gradient-to-r from-[#2C2C2E] to-[#1A1A1B] p-8 rounded-xl border border-gray-700 relative overflow-hidden group hover:border-panic-orange/30 transition-colors">
          <div className="absolute -top-10 -right-10 opacity-5 group-hover:opacity-10 transition-opacity duration-1000">
            <Skull size={200} />
          </div>
          <h3 className="uppercase text-xs tracking-widest mb-3"
            style={{ color: data.tier?.color || '#ff6b35' }}
          >
            {data.acceptanceClicks >= 3 ? '☯️ Zen of Failure Ritual' : 'Mandatory Ritual'}
          </h3>
          <p className="text-2xl md:text-3xl font-black text-white italic tracking-tight">
            "{data.ritual}"
          </p>
        </div>

      </div>
    </div>
  );
}
