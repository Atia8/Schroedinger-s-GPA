// frontend/src/pages/AnalyticsPage.jsx
import React, { useState, useEffect } from 'react';
import { motion } from "framer-motion";
import { BarChart3, Calendar, Clock, TrendingUp, Atom } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

export function AnalyticsPage({ sarcasmLevel = 'brutal' }) {
  const [loading, setLoading] = useState(true);
  const [tasks, setTasks]     = useState([]);
  const [stats, setStats]     = useState({
    totalTasks: 0, completedTasks: 0, overdueTasks: 0,
    ignoredTasks: 0, panicTasks: 0, averageDespair: 0,
    peakHour: 'N/A', averageDelay: 0, timeWasted: 0,
    mostProductiveDay: 'N/A', leastProductiveDay: 'N/A'
  });
  const [weeklyData, setWeeklyData] = useState(
    ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'].map(day => ({ day, completed: 0, avoided: 0, total: 0 }))
  );
  const [hourlyData, setHourlyData] = useState(
    Array.from({ length: 24 }, (_, i) => ({
      hour: i === 0 ? '12AM' : i < 12 ? `${i}AM` : i === 12 ? '12PM' : `${i-12}PM`,
      productivity: 0, tasks: 0
    }))
  );

  useEffect(() => { fetchTasks(); }, []);

  const fetchTasks = async () => {
    try {
      const token    = localStorage.getItem('token');
      const response = await fetch('http://localhost:5000/api/tasks', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setTasks(data);
        calculateAnalytics(data);
      }
    } catch (error) {
      console.error('Error fetching tasks:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateAnalytics = (tasksData) => {
    if (!tasksData || tasksData.length === 0) return;

    const totalTasks      = tasksData.length;
    const completedTasks  = tasksData.filter(t => t.status === 'done' || t.status === 'completed').length;
    const overdueTasks    = tasksData.filter(t => t.status === 'overdue').length;
    const ignoredTasks    = tasksData.filter(t => t.status === 'ignored').length;
    const panicTasks      = tasksData.filter(t => t.status === 'panic').length;
    const totalDespair    = tasksData.reduce((sum, t) => sum + (t.despairContribution || 0), 0);
    const averageDespair  = totalTasks > 0 ? Math.round(totalDespair / totalTasks) : 0;

    let totalDelay = 0, delayCount = 0;
    tasksData.forEach(task => {
      if (task.deadline && (task.status === 'done' || task.status === 'completed') && task.updatedAt) {
        const dl  = new Date(task.deadline);
        const com = new Date(task.updatedAt);
        if (com > dl) { totalDelay += Math.ceil((com - dl) / (1000 * 60 * 60 * 24)); delayCount++; }
      }
    });
    const averageDelay = delayCount > 0 ? (totalDelay / delayCount).toFixed(1) : 0;
    const timeWasted   = totalTasks > 0 ? Math.round((ignoredTasks + overdueTasks + panicTasks) / totalTasks * 100) : 0;

    const daysMap    = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
    const weeklyStats = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'].map(day => ({ day, completed: 0, avoided: 0, total: 0 }));

    tasksData.forEach(task => {
      if (task.createdAt) {
        const date    = new Date(task.createdAt);
        const dayName = daysMap[date.getDay()];
        const dayData = weeklyStats.find(d => d.day === dayName);
        if (dayData) {
          dayData.total++;
          if (task.status === 'done' || task.status === 'completed') dayData.completed++;
          else if (['ignored', 'overdue', 'panic'].includes(task.status)) dayData.avoided++;
        }
      }
    });

    let maxCompleted = 0, minCompleted = Infinity;
    let mostProductiveDay = 'N/A', leastProductiveDay = 'N/A';
    weeklyStats.forEach(day => {
      if (day.completed > maxCompleted) { maxCompleted = day.completed; mostProductiveDay = day.day; }
      if (day.completed < minCompleted && day.total > 0) { minCompleted = day.completed; leastProductiveDay = day.day; }
    });

    const hourlyStats = hourlyData.map(h => ({ ...h, tasks: 0, completed: 0 }));
    tasksData.forEach(task => {
      if ((task.status === 'done' || task.status === 'completed') && task.updatedAt) {
        const h         = new Date(task.updatedAt).getHours();
        const hourLabel = h === 0 ? '12AM' : h < 12 ? `${h}AM` : h === 12 ? '12PM' : `${h-12}PM`;
        const hourData  = hourlyStats.find(hd => hd.hour === hourLabel);
        if (hourData) { hourData.tasks++; hourData.completed++; }
      }
    });
    hourlyStats.forEach(h => { h.productivity = totalTasks > 0 ? Math.round((h.completed / totalTasks) * 100) : 0; });

    let maxTasks = 0, peakHour = 'N/A';
    hourlyStats.forEach(h => { if (h.completed > maxTasks) { maxTasks = h.completed; peakHour = h.hour; } });

    setWeeklyData(weeklyStats);
    setHourlyData(hourlyStats);
    setStats({ totalTasks, completedTasks, overdueTasks, ignoredTasks, panicTasks, averageDespair, peakHour, averageDelay, timeWasted, mostProductiveDay, leastProductiveDay });
  };

  const getInsight = () => {
    const insights = [];
    if (stats.completedTasks === 0) insights.push("You haven't completed a single task. This is impressive in the worst possible way.");
    else if (stats.completedTasks < stats.totalTasks * 0.3) insights.push(`You've completed ${stats.completedTasks} of ${stats.totalTasks} tasks. The other ${stats.totalTasks - stats.completedTasks} are judging you.`);
    if (stats.overdueTasks > 0) insights.push(`${stats.overdueTasks} overdue task${stats.overdueTasks > 1 ? 's' : ''}. Each one a monument to your procrastination.`);
    if (stats.ignoredTasks > 0) insights.push(`${stats.ignoredTasks} tasks being actively ignored. Out of sight, still on the list.`);
    if (insights.length === 0) insights.push("No tasks yet. Either you're ahead or you haven't admitted you have work to do.");
    return insights;
  };

  // ── ADDED: Academic Doom Timeline data ───────────────────────────────────
  // All tasks sorted by deadline, with relative timing markers.
  const getDoomTimelineItems = () => {
    if (!tasks.length) return [];
    const now = new Date();
    return [...tasks]
      .sort((a, b) => new Date(a.deadline) - new Date(b.deadline))
      .map(task => {
        const dl       = new Date(task.deadline);
        const isPast   = dl < now;
        const daysLeft = Math.abs(Math.round((dl - now) / (1000 * 60 * 60 * 24)));
        const isDone   = task.status === 'done' || task.status === 'completed';
        const isOverdue = isPast && !isDone;
        return { task, isPast, isDone, isOverdue, daysLeft };
      });
  };

  // ── ADDED: Schrödinger stats ──────────────────────────────────────────────
  const getSchrodingerStats = () => {
    const schrodingerTasks = tasks.filter(t => t.isSchrodinger);
    const resolved         = schrodingerTasks.filter(t => t.schrodingerResolved);
    const wins             = resolved.filter(t => t.schrodingerOutcome === 'submitted').length;
    const losses           = resolved.filter(t => t.schrodingerOutcome === 'failed').length;
    const pending          = schrodingerTasks.filter(t => !t.schrodingerResolved).length;
    return { total: schrodingerTasks.length, resolved: resolved.length, wins, losses, pending };
  };

  const doomItems      = getDoomTimelineItems();
  const schroStats     = getSchrodingerStats();
  const hasSchrodinger = schroStats.total > 0;

  if (loading) {
    return (
      <div className="min-h-screen bg-[#1A1A1B] flex items-center justify-center">
        <p className="text-[#ff6b35] animate-pulse">Auditing your failures...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#1A1A1B] text-white p-6 md:p-12 pt-24">
      <div className="max-w-5xl mx-auto space-y-8">

        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <h2 className="text-4xl text-white mb-2">
            Procrastination <span className="text-[#ff6b35]">Analytics</span>
          </h2>
          <p className="text-gray-400 italic">
            A beautiful visualization of your {tasks.length} poor decisions.
          </p>
        </motion.div>

        {/* Key Stats */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          className="grid grid-cols-1 md:grid-cols-4 gap-4"
        >
          {[
            { icon: <Clock className="w-5 h-5 text-[#ff006e]" />, label: 'Peak Hour',       value: stats.peakHour,      sub: 'Most Productive',     note: '"When panic becomes productivity"' },
            { icon: <Calendar className="w-5 h-5 text-[#00d9ff]" />, label: 'Average',      value: `${stats.averageDelay}d`, sub: 'Average Delay',   note: '"Punctuality is overrated"' },
            { icon: <BarChart3 className="w-5 h-5 text-[#ffa500]" />, label: 'Wasted',       value: `${stats.timeWasted}%`,  sub: 'Time Wasted',     note: '"Consistency is key"' },
            { icon: <TrendingUp className="w-5 h-5 text-[#ff6b35]" />, label: 'Despair',     value: stats.averageDespair,   sub: 'Avg Despair/Task', note: '"Feeling is data"' },
          ].map((card, i) => (
            <div key={i} className="bg-[#23232e] border border-white/10 rounded-xl p-6">
              <div className="flex items-center justify-between mb-2">{card.icon}<span className="text-xs text-gray-500">{card.label}</span></div>
              <p className="text-3xl text-white mb-1">{card.value}</p>
              <p className="text-sm text-gray-400">{card.sub}</p>
              <p className="text-xs text-gray-600 mt-2 italic">{card.note}</p>
            </div>
          ))}
        </motion.div>

        {/* Weekly Pattern Chart */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
          className="bg-[#23232e] border border-white/10 rounded-2xl p-6"
        >
          <h3 className="text-xl text-white mb-6">Weekly Procrastination Pattern</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={weeklyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
              <XAxis dataKey="day" stroke="#a0a0b0" />
              <YAxis stroke="#a0a0b0" />
              <Tooltip contentStyle={{ backgroundColor: '#2a2a38', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: '#fff' }} />
              <Bar dataKey="completed" fill="#06d6a0" radius={[8, 8, 0, 0]} />
              <Bar dataKey="avoided"   fill="#ef233c" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
          <div className="flex items-center justify-center gap-6 mt-4">
            <div className="flex items-center gap-2"><div className="w-3 h-3 bg-[#06d6a0] rounded-full" /><span className="text-sm text-gray-400">Completed ({stats.completedTasks})</span></div>
            <div className="flex items-center gap-2"><div className="w-3 h-3 bg-[#ef233c] rounded-full" /><span className="text-sm text-gray-400">Avoided ({stats.ignoredTasks + stats.overdueTasks + stats.panicTasks})</span></div>
          </div>
        </motion.div>

        {/* Hourly Productivity */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
          className="bg-[#23232e] border border-white/10 rounded-2xl p-6"
        >
          <h3 className="text-xl text-white mb-6">24-Hour Productivity Cycle</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={hourlyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
              <XAxis dataKey="hour" stroke="#a0a0b0" interval={2} />
              <YAxis stroke="#a0a0b0" />
              <Tooltip contentStyle={{ backgroundColor: '#2a2a38', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: '#fff' }}
                formatter={(value, name) => name === 'productivity' ? [`${value}%`, 'Productivity'] : [value, 'Tasks']}
              />
              <Bar dataKey="productivity" radius={[8, 8, 0, 0]}>
                {hourlyData.map((entry, index) => (
                  <Cell key={`cell-${index}`}
                    fill={entry.productivity > 20 ? '#ff6b35' : entry.productivity > 10 ? '#ffa500' : '#06d6a0'}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
          <p className="text-sm text-gray-500 text-center mt-4 italic">
            Orange = Peak procrastination hours • Green = Actually productive hours
          </p>
        </motion.div>

        {/* Status Breakdown */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}
          className="grid grid-cols-2 md:grid-cols-4 gap-4"
        >
          {[
            { label: 'Completed', value: stats.completedTasks, color: '#39ff14' },
            { label: 'Ignored',   value: stats.ignoredTasks,   color: '#8a8a9f' },
            { label: 'Overdue',   value: stats.overdueTasks,   color: '#ff6b35' },
            { label: 'Panic Mode',value: stats.panicTasks,     color: '#ff006e' },
          ].map((item, i) => (
            <div key={i} className="bg-[#23232e] border border-white/10 rounded-xl p-4 text-center">
              <div className="text-2xl font-bold mb-1" style={{ color: item.color }}>{item.value}</div>
              <div className="text-xs text-gray-400">{item.label}</div>
            </div>
          ))}
        </motion.div>

        {/* ── ADDED: Academic Doom Timeline ──────────────────────────────── */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
          className="bg-[#23232e] border border-white/10 rounded-2xl p-6"
        >
          <h3 className="text-xl text-white mb-2">Academic Doom Timeline</h3>
          <p className="text-sm text-gray-500 italic mb-6">Your past mistakes, current tasks, and predicted panic moments.</p>

          {doomItems.length === 0 ? (
            <p className="text-gray-500 italic text-center py-8">No tasks to doom-visualize. Add some tasks first.</p>
          ) : (
            <div className="relative">
              {/* Vertical line */}
              <div className="absolute left-6 top-0 bottom-0 w-px bg-white/10" />

              <div className="space-y-4">
                {doomItems.map(({ task, isPast, isDone, isOverdue, daysLeft }, i) => {
                  const dotColor = isDone ? '#06d6a0' : isOverdue ? '#ff006e' : daysLeft <= 1 ? '#ff6b35' : daysLeft <= 7 ? '#ffd166' : '#8a8a9f';
                  const dotPulse = (isOverdue || daysLeft <= 1) && !isDone;
                  const labelColor = isDone ? 'text-[#06d6a0]' : isOverdue ? 'text-[#ff006e]' : daysLeft <= 1 ? 'text-[#ff6b35]' : daysLeft <= 7 ? 'text-[#ffd166]' : 'text-gray-400';

                  return (
                    <div key={task._id} className="flex items-start gap-6 pl-1">
                      {/* Dot on timeline */}
                      <div className="relative flex-shrink-0 mt-1">
                        <div
                          className={`w-4 h-4 rounded-full border-2 ${dotPulse ? 'animate-pulse' : ''}`}
                          style={{ backgroundColor: dotColor, borderColor: dotColor, marginLeft: '8px' }}
                        />
                      </div>

                      {/* Task card */}
                      <div className={`flex-1 bg-[#1a1a28] border rounded-xl p-4 ${
                        isOverdue ? 'border-[#ff006e]/30' : daysLeft <= 1 && !isDone ? 'border-[#ff6b35]/30' : 'border-white/5'
                      }`}>
                        <div className="flex items-start justify-between">
                          <div>
                            <span className={`text-sm font-semibold ${isDone ? 'line-through text-gray-500' : 'text-white'}`}>
                              {task.title}
                            </span>
                            {task.isSchrodinger && (
                              <span className="ml-2 text-xs text-[#c77dff]">⚛</span>
                            )}
                          </div>
                          <span className={`text-xs font-semibold ${labelColor}`}>
                            {isDone
                              ? '✓ done'
                              : isOverdue
                                ? `${daysLeft}d overdue`
                                : daysLeft === 0
                                  ? 'due TODAY'
                                  : daysLeft === 1
                                    ? 'due TOMORROW'
                                    : `${daysLeft}d left`
                            }
                          </span>
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                          {new Date(task.deadline).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                          {task.schrodingerResolved && (
                            <span className={`ml-2 ${task.schrodingerOutcome === 'submitted' ? 'text-[#06d6a0]' : 'text-[#ff006e]'}`}>
                              ⚛ {task.schrodingerOutcome}
                            </span>
                          )}
                        </div>
                        {/* Stress spike indicator */}
                        {!isDone && daysLeft <= 3 && (
                          <div className="mt-2 text-xs italic text-gray-600">
                            {daysLeft === 0 ? '⚡ Statistically, you will panic about this today.' :
                             daysLeft === 1 ? '⚡ Academic crisis statistically inevitable in <24 hours.' :
                             `⚡ Stress spike predicted in ${daysLeft} days.`}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </motion.div>

        {/* ── ADDED: Schrödinger's Collapsed Tasks ─────────────────────── */}
        {hasSchrodinger && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.45 }}
            className="bg-[#23232e] border border-[#9d4edd]/30 rounded-2xl p-6"
          >
            <div className="flex items-center gap-3 mb-2">
              <Atom className="w-5 h-5 text-[#c77dff]" />
              <h3 className="text-xl text-white">Schrödinger's Experiments</h3>
            </div>
            <p className="text-sm text-gray-500 italic mb-6">
              Tasks placed in quantum superposition. The wave function has spoken.
            </p>

            {/* Win/loss stats */}
            <div className="grid grid-cols-3 gap-4 mb-6">
              {[
                { label: 'In Superposition', value: schroStats.pending,  color: '#c77dff' },
                { label: 'Collapsed: Alive', value: schroStats.wins,     color: '#06d6a0' },
                { label: 'Collapsed: Dead',  value: schroStats.losses,   color: '#ff006e' },
              ].map((item, i) => (
                <div key={i} className="bg-[#1a1a28] border border-white/5 rounded-xl p-4 text-center">
                  <div className="text-2xl font-bold mb-1" style={{ color: item.color }}>{item.value}</div>
                  <div className="text-xs text-gray-500">{item.label}</div>
                </div>
              ))}
            </div>

            {/* Win rate */}
            {schroStats.resolved > 0 && (
              <div className="bg-[#1a1a28] border border-white/5 rounded-xl p-4 mb-4 text-sm text-center">
                <span className="text-gray-400">Quantum survival rate: </span>
                <span className="text-white font-bold">
                  {Math.round((schroStats.wins / schroStats.resolved) * 100)}%
                </span>
                <span className="text-gray-500 text-xs ml-2">
                  ({schroStats.wins} survived, {schroStats.losses} did not)
                </span>
              </div>
            )}

            {/* Resolved task list */}
            {tasks.filter(t => t.isSchrodinger && t.schrodingerResolved).length > 0 && (
              <div className="space-y-2">
                {tasks
                  .filter(t => t.isSchrodinger && t.schrodingerResolved)
                  .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))
                  .map(task => (
                    <div key={task._id}
                      className={`flex items-center justify-between p-3 rounded-xl border ${
                        task.schrodingerOutcome === 'submitted'
                          ? 'bg-[#06d6a0]/5 border-[#06d6a0]/20'
                          : 'bg-[#ff006e]/5 border-[#ff006e]/20'
                      }`}
                    >
                      <span className="text-sm text-white">{task.title}</span>
                      <span className={`text-xs font-semibold ${
                        task.schrodingerOutcome === 'submitted' ? 'text-[#06d6a0]' : 'text-[#ff006e]'
                      }`}>
                        {task.schrodingerOutcome === 'submitted' ? '✓ Cat lived' : '✗ Cat died'}
                      </span>
                    </div>
                  ))
                }
              </div>
            )}

            {schroStats.total > 0 && schroStats.resolved === 0 && (
              <p className="text-gray-500 italic text-sm text-center py-4">
                {schroStats.pending} task{schroStats.pending > 1 ? 's are' : ' is'} currently in superposition.
                The deadline will collapse the wave function.
              </p>
            )}
          </motion.div>
        )}

        {/* Brutal Insights */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}
          className="bg-[#23232e] border border-white/10 rounded-2xl p-6"
        >
          <h3 className="text-xl text-white mb-4">Brutal Insights</h3>
          <div className="space-y-3">
            {getInsight().map((insight, index) => (
              <div key={index} className="bg-[#2a2a38] border border-white/10 rounded-xl p-4 flex items-start gap-3">
                <div className="w-6 h-6 bg-[#ff006e]/20 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-[#ff006e] text-sm">{index + 1}</span>
                </div>
                <p className="text-gray-300 italic">"{insight}"</p>
              </div>
            ))}
          </div>
        </motion.div>

      </div>
    </div>
  );
}
