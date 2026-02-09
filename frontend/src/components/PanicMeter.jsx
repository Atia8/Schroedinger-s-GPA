import React from 'react';

export default function PanicMeter({ value }) {
  let color = "bg-green-500";
  let label = "Suspiciously Calm";

  if (value > 80) {
    color = "bg-red-600 animate-pulse";
    label = "CRITICAL FAILURE IMMINENT";
  } else if (value > 50) {
    color = "bg-orange-500";
    label = "Orange Alert: Snack Advised";
  } else if (value > 25) {
    color = "bg-yellow-400";
    label = "Mild Concern";
  }

  return (
    <div className="bg-gray-900 p-6 rounded-xl border border-gray-700 shadow-lg mb-6">
      <div className="flex justify-between items-end mb-2">
        <h3 className="text-xl font-bold text-gray-200">Panic Meter</h3>
        <span className="text-3xl font-black text-white">{value}%</span>
      </div>
      <div className="w-full bg-gray-700 rounded-full h-6 overflow-hidden">
        <div className={`h-full ${color} transition-all duration-1000 ease-out`} style={{ width: `${value}%` }}></div>
      </div>
      <p className="mt-2 text-right text-sm text-gray-400 uppercase tracking-widest">{label}</p>
    </div>
  );
}