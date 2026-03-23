import React, { useEffect, useState } from 'react';
import PanicMeter from '../components/PanicMeter';
import { AlertTriangle, Zap, Coffee, Wind, Skull, Smile, Bell } from 'lucide-react';

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeEffect, setActiveEffect] = useState(null);

  // Function to trigger despair check on the backend
  const triggerDespairCheck = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5000/api/notifications/check-despair', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const result = await response.json();
      console.log('Despair check result:', result);
    } catch (error) {
      console.error('Failed to trigger despair check:', error);
    }
  };

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await fetch('http://localhost:5000/api/dashboard', {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.ok) {
          const dashboardData = await res.json();
          setData(dashboardData);
          
          // After loading dashboard, check if despair is high and trigger alert
          if (dashboardData.despairIndex >= 70) {
            console.log(`⚠️ Despair index is ${dashboardData.despairIndex}%, checking for alert...`);
            await triggerDespairCheck();
          }
        }
      } catch (err) {
        console.error("Failed to load chaos:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchDashboard();
  }, []);

  // Manual test button function
  const testDespairAlert = async () => {
    console.log('🔔 Manually testing despair alert...');
    await triggerDespairCheck();
    alert('Despair check triggered! Check your bell icon for notification.');
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

  if (loading) return <div className="min-h-screen bg-[#1A1A1B] flex items-center justify-center text-panic-orange animate-pulse">Calculating Despair...</div>;
  if (!data) return <div className="p-10 text-white">Failed to connect to the void.</div>;

  const currentMoods = getMoods(data.despairIndex);

  return (
    <div className="min-h-screen bg-[#1A1A1B] text-white p-6 md:p-12 pt-24">
      {/* Header */}
      <div className="mb-8 flex justify-between items-end">
        <div>
          <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-white to-gray-500 bg-clip-text text-transparent">Chaos Dashboard</h1>
          <p className="text-gray-400">Welcome to your daily breakdown.</p>
        </div>
        
        {/* Add Test Button for Despair Alerts (remove in production) */}
        <button
          onClick={testDespairAlert}
          className="text-xs bg-gray-800 hover:bg-gray-700 px-3 py-1 rounded-lg transition-colors flex items-center gap-1"
          title="Test Despair Alert"
        >
          <Bell size={12} />
          Test Alert
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        
        {/* 1. Panic Meter */}
        <div className="col-span-1 md:col-span-2">
          <PanicMeter value={data.despairIndex} />
        </div>

        {/* 2. NPC Widget */}
        <div className="bg-[#2C2C2E] p-6 rounded-xl border-l-4 border-panic-orange shadow-lg flex flex-col justify-center relative overflow-hidden group">
          <div className="absolute -right-4 -top-4 opacity-5 group-hover:opacity-10 transition-opacity">
            <Skull size={100} />
          </div>
          <h3 className="text-panic-orange font-bold mb-2 uppercase text-xs tracking-widest flex items-center gap-2">
            <Skull size={16}/> Companion Message
          </h3>
          <p className="text-xl italic text-gray-200 z-10">"{data.npcMessage}"</p>
        </div>

        {/* 3. Impending Doom List */}
        <div className="bg-[#2C2C2E] p-6 rounded-xl border border-gray-700 flex flex-col">
          <h3 className="text-gray-400 uppercase text-xs tracking-widest mb-4 flex items-center gap-2">
            <AlertTriangle size={16} className="text-red-500"/> Impending Doom
          </h3>
          <div className="space-y-3 flex-1">
            {data.urgentTasks && data.urgentTasks.length > 0 ? (
              data.urgentTasks.map(task => (
                <div key={task.id} className="flex justify-between items-center p-3 bg-[#1A1A1B] rounded-lg border border-gray-800 hover:border-red-500/50 transition-all group cursor-pointer">
                  <div className="flex items-center gap-3 overflow-hidden">
                    <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse shrink-0"></div>
                    <span className="font-semibold truncate group-hover:text-red-400 transition-colors">{task.title}</span>
                  </div>
                  <span className="text-xs text-gray-500 whitespace-nowrap">{new Date(task.deadline).toLocaleDateString()}</span>
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
             <Smile size={16} className="text-yellow-500"/> Current Vibe
           </h3>
           <div className="grid grid-cols-3 gap-4 w-full h-full content-center">
              {currentMoods.map((emoji, i) => (
                <div 
                  key={i} 
                  className="text-4xl hover:scale-125 transition-transform cursor-help animate-in fade-in zoom-in duration-500" 
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
             <Zap size={16} className="text-blue-500"/> Quick Coping
           </h3>
           <div className="grid grid-cols-2 gap-3 flex-1">
              <button 
                onClick={() => triggerEffect('breathe')}
                className={`p-2 rounded-lg transition-all flex flex-col items-center justify-center gap-1 text-xs font-medium 
                  ${activeEffect === 'breathe' ? 'bg-blue-600 text-white scale-105 shadow-lg shadow-blue-500/50' : 'bg-gray-800 hover:bg-gray-700'}
                `}
              >
                <Wind size={18} className={activeEffect === 'breathe' ? 'animate-ping' : ''} />
                <span>{activeEffect === 'breathe' ? 'Exhale...' : 'Breathe'}</span>
              </button>

              <button 
                onClick={() => triggerEffect('coffee')}
                className={`p-2 rounded-lg transition-all flex flex-col items-center justify-center gap-1 text-xs font-medium 
                  ${activeEffect === 'coffee' ? 'bg-yellow-600 text-white animate-bounce' : 'bg-gray-800 hover:bg-gray-700'}
                `}
              >
                <Coffee size={18} />
                <span>{activeEffect === 'coffee' ? 'JITTERS' : 'Caffeinate'}</span>
              </button>

              <button 
                onClick={() => triggerEffect('blur')}
                className={`p-2 rounded-lg transition-all duration-1000 flex flex-col items-center justify-center gap-1 text-xs font-medium 
                  ${activeEffect === 'blur' ? 'opacity-20 blur-[2px]' : 'bg-gray-800 hover:bg-gray-700'}
                `}
              >
                <Zap size={18} />
                <span>{activeEffect === 'blur' ? '.....' : 'Dissociate'}</span>
              </button>

              <button 
                onClick={() => triggerEffect('scream')}
                className={`p-2 rounded-lg transition-all flex flex-col items-center justify-center gap-1 text-xs font-medium 
                  ${activeEffect === 'scream' ? 'bg-red-600 text-white font-black scale-110' : 'bg-gray-800 hover:bg-gray-700'}
                `}
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
           <h3 className="text-panic-orange uppercase text-xs tracking-widest mb-3">Mandatory Ritual</h3>
           <p className="text-2xl md:text-3xl font-black text-white italic tracking-tight">"{data.ritual}"</p>
        </div>

      </div>
    </div>
  );
}