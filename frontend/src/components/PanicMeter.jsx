// frontend/src/components/PanicMeter.jsx
import React from 'react';

// Mirror of DESPAIR_TIERS in despairUtils.js — keep in sync if you change tier names
const TIERS = [
  { max: 20,  name: "Functional Delusion",       bar: "bg-[#06d6a0]",                       text: "text-[#06d6a0]",  emoji: "🧘" },
  { max: 45,  name: "Concerning Vibes",          bar: "bg-[#ffd166]",                       text: "text-[#ffd166]",  emoji: "😐" },
  { max: 65,  name: "Spiraling",                 bar: "bg-[#ffa500]",                       text: "text-[#ffa500]",  emoji: "😰" },
  { max: 85,  name: "Full Goblin Mode",          bar: "bg-[#ff6b35]",                       text: "text-[#ff6b35]",  emoji: "😤" },
  { max: 100, name: "Academic Extinction Event", bar: "bg-[#ff006e] animate-pulse",         text: "text-[#ff006e]",  emoji: "💀" },
];

function getTier(value) {
  return TIERS.find(t => value <= t.max) || TIERS[TIERS.length - 1];
}

export default function PanicMeter({ value, despairDelta, isNewPersonalLow }) {
  const tier = getTier(value);

  // Delta display: show if the index moved meaningfully (±3 or more)
  const showDelta = despairDelta !== undefined && Math.abs(despairDelta) >= 3;
  const deltaIsGood = despairDelta < 0; // dropping = good

  return (
    <div className="bg-gray-900 p-6 rounded-xl border border-gray-700 shadow-lg mb-6">

      {/* Header row */}
      <div className="flex justify-between items-end mb-3">
        <div>
          <h3 className="text-xl font-bold text-gray-200">Panic Meter</h3>
          {/* Tier name */}
          <span className={`text-xs font-semibold uppercase tracking-widest mt-1 ${tier.text}`}>
            {tier.emoji} {tier.name}
          </span>
        </div>

        <div className="text-right">
          <span className="text-3xl font-black text-white">{value}%</span>

          {/* Despair delta badge */}
          {showDelta && (
            <div className={`text-xs font-semibold mt-1 ${deltaIsGood ? 'text-[#06d6a0]' : 'text-[#ff6b35]'}`}>
              {deltaIsGood
                ? `↓ ${Math.abs(despairDelta)} pts — relief earned`
                : `↑ ${Math.abs(despairDelta)} pts — situation worsening`}
            </div>
          )}

          {/* New personal low badge */}
          {isNewPersonalLow && (
            <div className="text-xs text-[#ff006e] font-bold mt-1 animate-pulse">
              🏆 New personal low
            </div>
          )}
        </div>
      </div>

      {/* Progress bar */}
      <div className="w-full bg-gray-700 rounded-full h-6 overflow-hidden">
        <div
          className={`h-full ${tier.bar} transition-all duration-1000 ease-out`}
          style={{ width: `${value}%` }}
        />
      </div>

      {/* Tier threshold markers */}
      <div className="relative mt-1 h-2">
        {[20, 45, 65, 85].map(threshold => (
          <div
            key={threshold}
            className="absolute top-0 w-px h-2 bg-gray-600 opacity-50"
            style={{ left: `${threshold}%` }}
          />
        ))}
      </div>

      {/* Tier labels below bar */}
      <div className="flex justify-between mt-1 text-[10px] text-gray-600">
        <span>Delusion</span>
        <span>Concerning</span>
        <span>Spiraling</span>
        <span>Goblin</span>
        <span>Extinction</span>
      </div>
    </div>
  );
}
