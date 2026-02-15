import React, { useState, useEffect } from 'react';
import { motion } from "framer-motion";
import { BarChart3, Calendar, Clock, TrendingUp, AlertTriangle } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

export function AnalyticsPage({ sarcasmLevel = 'brutal' }) {
  const [loading, setLoading] = useState(true);
  const [tasks, setTasks] = useState([]);
  const [stats, setStats] = useState({
    totalTasks: 0,
    completedTasks: 0,
    overdueTasks: 0,
    ignoredTasks: 0,
    panicTasks: 0,
    averageDespair: 0,
    peakHour: '12AM',
    averageDelay: 0,
    timeWasted: 0,
    mostProductiveDay: 'Monday',
    leastProductiveDay: 'Monday'
  });

  // Weekly data for chart
  const [weeklyData, setWeeklyData] = useState([
    { day: 'Mon', completed: 0, avoided: 0, total: 0 },
    { day: 'Tue', completed: 0, avoided: 0, total: 0 },
    { day: 'Wed', completed: 0, avoided: 0, total: 0 },
    { day: 'Thu', completed: 0, avoided: 0, total: 0 },
    { day: 'Fri', completed: 0, avoided: 0, total: 0 },
    { day: 'Sat', completed: 0, avoided: 0, total: 0 },
    { day: 'Sun', completed: 0, avoided: 0, total: 0 }
  ]);

  // Hourly productivity data
  const [hourlyData, setHourlyData] = useState([
    { hour: '12AM', productivity: 0, tasks: 0 },
    { hour: '1AM', productivity: 0, tasks: 0 },
    { hour: '2AM', productivity: 0, tasks: 0 },
    { hour: '3AM', productivity: 0, tasks: 0 },
    { hour: '4AM', productivity: 0, tasks: 0 },
    { hour: '5AM', productivity: 0, tasks: 0 },
    { hour: '6AM', productivity: 0, tasks: 0 },
    { hour: '7AM', productivity: 0, tasks: 0 },
    { hour: '8AM', productivity: 0, tasks: 0 },
    { hour: '9AM', productivity: 0, tasks: 0 },
    { hour: '10AM', productivity: 0, tasks: 0 },
    { hour: '11AM', productivity: 0, tasks: 0 },
    { hour: '12PM', productivity: 0, tasks: 0 },
    { hour: '1PM', productivity: 0, tasks: 0 },
    { hour: '2PM', productivity: 0, tasks: 0 },
    { hour: '3PM', productivity: 0, tasks: 0 },
    { hour: '4PM', productivity: 0, tasks: 0 },
    { hour: '5PM', productivity: 0, tasks: 0 },
    { hour: '6PM', productivity: 0, tasks: 0 },
    { hour: '7PM', productivity: 0, tasks: 0 },
    { hour: '8PM', productivity: 0, tasks: 0 },
    { hour: '9PM', productivity: 0, tasks: 0 },
    { hour: '10PM', productivity: 0, tasks: 0 },
    { hour: '11PM', productivity: 0, tasks: 0 }
  ]);

  // Fetch tasks on mount
  useEffect(() => {
    fetchTasks();
  }, []);

  const fetchTasks = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5000/api/tasks', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
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

    // Basic stats
    const totalTasks = tasksData.length;
    const completedTasks = tasksData.filter(t => t.status === 'done').length;
    const overdueTasks = tasksData.filter(t => t.status === 'overdue').length;
    const ignoredTasks = tasksData.filter(t => t.status === 'ignored').length;
    const panicTasks = tasksData.filter(t => t.status === 'panic').length;
    
    // Average despair
    const totalDespair = tasksData.reduce((sum, t) => sum + (t.despairContribution || 0), 0);
    const averageDespair = totalTasks > 0 ? Math.round(totalDespair / totalTasks) : 0;

    // Calculate average delay (in days)
    let totalDelay = 0;
    let delayCount = 0;
    tasksData.forEach(task => {
      if (task.deadline && task.completedAt) {
        const deadline = new Date(task.deadline);
        const completed = new Date(task.completedAt);
        if (completed > deadline) {
          const delayDays = Math.ceil((completed - deadline) / (1000 * 60 * 60 * 24));
          totalDelay += delayDays;
          delayCount++;
        }
      }
    });
    const averageDelay = delayCount > 0 ? (totalDelay / delayCount).toFixed(1) : 0;

    // Time wasted percentage
    const timeWasted = totalTasks > 0 ? Math.round((ignoredTasks + overdueTasks + panicTasks) / totalTasks * 100) : 0;

    // Process weekly data
    const daysMap = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const weeklyStats = weeklyData.map(d => ({ ...d, completed: 0, avoided: 0, total: 0 }));

    tasksData.forEach(task => {
      if (task.createdAt) {
        const date = new Date(task.createdAt);
        const dayIndex = date.getDay(); // 0 = Sunday
        const dayName = daysMap[dayIndex];
        
        const dayData = weeklyStats.find(d => d.day === dayName);
        if (dayData) {
          dayData.total++;
          if (task.status === 'done') {
            dayData.completed++;
          } else if (['ignored', 'overdue', 'panic'].includes(task.status)) {
            dayData.avoided++;
          }
        }
      }
    });

    // Find most/least productive days
    let maxCompleted = 0;
    let minCompleted = Infinity;
    let mostProductiveDay = 'Monday';
    let leastProductiveDay = 'Monday';

    weeklyStats.forEach(day => {
      if (day.completed > maxCompleted) {
        maxCompleted = day.completed;
        mostProductiveDay = day.day;
      }
      if (day.completed < minCompleted && day.total > 0) {
        minCompleted = day.completed;
        leastProductiveDay = day.day;
      }
    });

    // Process hourly data
    const hourlyStats = hourlyData.map(h => ({ ...h, tasks: 0, completed: 0 }));

    tasksData.forEach(task => {
      if (task.completedAt) {
        const date = new Date(task.completedAt);
        const hour = date.getHours();
        const hourLabel = hour === 0 ? '12AM' : 
                         hour < 12 ? `${hour}AM` : 
                         hour === 12 ? '12PM' : `${hour-12}PM`;
        
        const hourData = hourlyStats.find(h => h.hour === hourLabel);
        if (hourData) {
          hourData.tasks++;
          hourData.completed++;
        }
      }
    });

    // Calculate productivity percentage for each hour
    hourlyStats.forEach(hour => {
      hour.productivity = totalTasks > 0 ? Math.round((hour.completed / totalTasks) * 100) : 0;
    });

    // Find peak hour
    let maxTasks = 0;
    let peakHour = '12AM';
    hourlyStats.forEach(hour => {
      if (hour.completed > maxTasks) {
        maxTasks = hour.completed;
        peakHour = hour.hour;
      }
    });

    setWeeklyData(weeklyStats);
    setHourlyData(hourlyStats);
    setStats({
      totalTasks,
      completedTasks,
      overdueTasks,
      ignoredTasks,
      panicTasks,
      averageDespair,
      peakHour,
      averageDelay: averageDelay.toString(),
      timeWasted,
      mostProductiveDay,
      leastProductiveDay
    });
  };

  const getInsight = () => {
    const insights = {
      mild: [
        `You complete ${stats.completedTasks} out of ${stats.totalTasks} tasks. Progress?`,
        `${stats.mostProductiveDay}s are your productive days. ${stats.leastProductiveDay}s? Not so much.`,
        `Peak productivity at ${stats.peakHour}. Night owl detected.`,
      ],
      brutal: [
        `${stats.timeWasted}% of your tasks are ignored or overdue. Impressive commitment to failure.`,
        `You average ${stats.averageDelay} days delay per task. Punctuality isn't your strength.`,
        `${stats.panicTasks} tasks in panic mode. Living on the edge, I see.`,
      ],
      damage: [
        `${stats.ignoredTasks} ignored tasks. At this point, just delete them.`,
        `Your despair score averages ${stats.averageDespair}. Is that pride I smell?`,
        `You're most productive at ${stats.peakHour}. Your circadian rhythm is a suggestion.`,
      ],
    };
    return insights[sarcasmLevel] || insights.brutal;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#1c1c24] flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-[#ff6b35] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-400">Analyzing your procrastination patterns...</p>
        </div>
      </div>
    );
  }

  if (tasks.length === 0) {
    return (
      <div className="min-h-screen bg-[#1c1c24] p-6">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-20"
          >
            <AlertTriangle className="w-20 h-20 text-gray-600 mx-auto mb-4" />
            <h2 className="text-3xl text-white mb-2">No Data to Analyze</h2>
            <p className="text-gray-400 italic">
              Create some tasks first. Then we can judge your patterns.
            </p>
          </motion.div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#1c1c24] p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h2 className="text-4xl text-white mb-2">
            Procrastination <span className="text-[#ff6b35]">Analytics</span>
          </h2>
          <p className="text-gray-400 italic">
            A beautiful visualization of your {tasks.length} poor decisions.
          </p>
        </motion.div>

        {/* Key Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-1 md:grid-cols-4 gap-4"
        >
          <div className="bg-[#23232e] border border-white/10 rounded-xl p-6">
            <div className="flex items-center justify-between mb-2">
              <Clock className="w-5 h-5 text-[#ff006e]" />
              <span className="text-xs text-gray-500">Peak Hour</span>
            </div>
            <p className="text-3xl text-white mb-1">{stats.peakHour}</p>
            <p className="text-sm text-gray-400">Most Productive</p>
            <p className="text-xs text-gray-600 mt-2 italic">
              "When panic becomes productivity"
            </p>
          </div>

          <div className="bg-[#23232e] border border-white/10 rounded-xl p-6">
            <div className="flex items-center justify-between mb-2">
              <Calendar className="w-5 h-5 text-[#00d9ff]" />
              <span className="text-xs text-gray-500">Average</span>
            </div>
            <p className="text-3xl text-white mb-1">{stats.averageDelay}d</p>
            <p className="text-sm text-gray-400">Average Delay</p>
            <p className="text-xs text-gray-600 mt-2 italic">
              "Punctuality is overrated"
            </p>
          </div>

          <div className="bg-[#23232e] border border-white/10 rounded-xl p-6">
            <div className="flex items-center justify-between mb-2">
              <BarChart3 className="w-5 h-5 text-[#ffa500]" />
              <span className="text-xs text-gray-500">Wasted</span>
            </div>
            <p className="text-3xl text-white mb-1">{stats.timeWasted}%</p>
            <p className="text-sm text-gray-400">Time Wasted</p>
            <p className="text-xs text-gray-600 mt-2 italic">
              "Consistency is key"
            </p>
          </div>

          <div className="bg-[#23232e] border border-white/10 rounded-xl p-6">
            <div className="flex items-center justify-between mb-2">
              <TrendingUp className="w-5 h-5 text-[#ff6b35]" />
              <span className="text-xs text-gray-500">Despair</span>
            </div>
            <p className="text-3xl text-white mb-1">{stats.averageDespair}</p>
            <p className="text-sm text-gray-400">Avg Despair/Task</p>
            <p className="text-xs text-gray-600 mt-2 italic">
              "Feeling is data"
            </p>
          </div>
        </motion.div>

        {/* Weekly Pattern */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-[#23232e] border border-white/10 rounded-2xl p-6"
        >
          <h3 className="text-xl text-white mb-6">Weekly Procrastination Pattern</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={weeklyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
              <XAxis dataKey="day" stroke="#a0a0b0" />
              <YAxis stroke="#a0a0b0" />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#2a2a38',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: '8px',
                  color: '#fff',
                }}
              />
              <Bar dataKey="completed" fill="#06d6a0" radius={[8, 8, 0, 0]} />
              <Bar dataKey="avoided" fill="#ef233c" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
          <div className="flex items-center justify-center gap-6 mt-4">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-[#06d6a0] rounded-full"></div>
              <span className="text-sm text-gray-400">Completed ({stats.completedTasks})</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-[#ef233c] rounded-full"></div>
              <span className="text-sm text-gray-400">Avoided ({stats.ignoredTasks + stats.overdueTasks + stats.panicTasks})</span>
            </div>
          </div>
        </motion.div>

        {/* Hourly Productivity Heatmap */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-[#23232e] border border-white/10 rounded-2xl p-6"
        >
          <h3 className="text-xl text-white mb-6">24-Hour Productivity Cycle</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={hourlyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
              <XAxis dataKey="hour" stroke="#a0a0b0" interval={2} />
              <YAxis stroke="#a0a0b0" />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#2a2a38',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: '8px',
                  color: '#fff',
                }}
                formatter={(value, name) => {
                  if (name === 'productivity') return [`${value}%`, 'Productivity'];
                  return [value, 'Tasks Completed'];
                }}
              />
              <Bar dataKey="productivity" radius={[8, 8, 0, 0]}>
                {hourlyData.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
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
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
          className="grid grid-cols-2 md:grid-cols-4 gap-4"
        >
          <div className="bg-[#23232e] border border-white/10 rounded-xl p-4 text-center">
            <div className="text-2xl font-bold text-[#39ff14] mb-1">{stats.completedTasks}</div>
            <div className="text-xs text-gray-400">Completed</div>
          </div>
          <div className="bg-[#23232e] border border-white/10 rounded-xl p-4 text-center">
            <div className="text-2xl font-bold text-[#8a8a9f] mb-1">{stats.ignoredTasks}</div>
            <div className="text-xs text-gray-400">Ignored</div>
          </div>
          <div className="bg-[#23232e] border border-white/10 rounded-xl p-4 text-center">
            <div className="text-2xl font-bold text-[#ff6b35] mb-1">{stats.overdueTasks}</div>
            <div className="text-xs text-gray-400">Overdue</div>
          </div>
          <div className="bg-[#23232e] border border-white/10 rounded-xl p-4 text-center">
            <div className="text-2xl font-bold text-[#ff006e] mb-1">{stats.panicTasks}</div>
            <div className="text-xs text-gray-400">Panic Mode</div>
          </div>
        </motion.div>

        {/* Insights */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-[#23232e] border border-white/10 rounded-2xl p-6"
        >
          <h3 className="text-xl text-white mb-4">Brutal Insights</h3>
          <div className="space-y-3">
            {getInsight().map((insight, index) => (
              <div
                key={index}
                className="bg-[#2a2a38] border border-white/10 rounded-xl p-4 flex items-start gap-3"
              >
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