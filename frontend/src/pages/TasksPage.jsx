// frontend/src/pages/TasksPage.jsx
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Calendar, TrendingUp, Trash2, Atom } from 'lucide-react';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../components/ui/dialog';
import { Input }  from '../components/ui/input';
import { Label }  from '../components/ui/label';

// Personality loading messages for the tasks page
const LOADING_LINES = [
  "Logging this to the permanent record of your choices...",
  "Retrieving your list of unfulfilled obligations...",
  "Counting the things you're avoiding...",
];

// ── Escalation animation variants ────────────────────────────────────────────
const cardVariants = {
  normal:      { scale: 1, x: 0 },
  warning:     { scale: 1 },           // handled via CSS pulse on border
  panic:       { scale: 1 },           // handled via CSS pulse on bg
  hysterical:  {                        // shake animation
    x: [0, -4, 4, -4, 4, -3, 3, -2, 2, 0],
    transition: { duration: 0.6, repeat: Infinity, repeatDelay: 4 }
  },
};

// ── Escalation NPC speech bubbles (Level 3 only) ──────────────────────────────
const HYSTERICAL_NPC_LINES = [
  "You had weeks. WEEKS. And here we are.",
  "This is fine. [It is not fine.]",
  "The deadline is today. I am screaming internally.",
  "I've given up hope. This is documented.",
  "Hostile Mentor has left the building.",
];

export default function TasksPage() {
  const [tasks, setTasks]           = useState([]);
  const [filter, setFilter]         = useState('all');
  const [loading, setLoading]       = useState(true);
  const [loadingLine]               = useState(() => LOADING_LINES[Math.floor(Math.random() * LOADING_LINES.length)]);
  const [isEditingTask, setIsEditingTask]   = useState(false);
  const [editedStatus, setEditedStatus]     = useState('');
  const [selectedTask, setSelectedTask]     = useState(null);
  const [isAddingTask, setIsAddingTask]     = useState(false);
  const [newTitle, setNewTitle]             = useState('');
  const [newDeadline, setNewDeadline]       = useState('');
  const [sarcasmLevel, setSarcasmLevel]     = useState('brutal');
  const [schrodingerLoading, setSchrodingerLoading] = useState(null); // taskId being toggled

  const fetchData = async () => {
    const token = localStorage.getItem('token');
    try {
      const [userRes, tasksRes] = await Promise.all([
        fetch('http://localhost:5000/api/users/profile',  { headers: { Authorization: `Bearer ${token}` } }),
        fetch('http://localhost:5000/api/tasks',          { headers: { Authorization: `Bearer ${token}` } })
      ]);
      const userData  = await userRes.json();
      const tasksData = await tasksRes.json();
      setSarcasmLevel(userData.user?.sarcasmLevel || 'brutal');
      setTasks(tasksData);
    } catch (err) {
      console.error('Failed to fetch data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    window.addEventListener('sarcasmChanged',   fetchData);
    window.addEventListener('refreshDashboard', fetchData);
    return () => {
      window.removeEventListener('sarcasmChanged',   fetchData);
      window.removeEventListener('refreshDashboard', fetchData);
    };
  }, []);

  // ── Schrödinger toggle ────────────────────────────────────────────────────
  const handleToggleSchrodinger = async (taskId, e) => {
    e.stopPropagation();
    setSchrodingerLoading(taskId);
    try {
      const token = localStorage.getItem('token');
      const res   = await fetch(`http://localhost:5000/api/tasks/${taskId}/schrodinger`, {
        method:  'PATCH',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const { task } = await res.json();
        setTasks(prev => prev.map(t => t._id === task._id ? task : t));
        if (selectedTask?._id === taskId) setSelectedTask(task);
      }
    } catch (err) {
      console.error('Schrödinger toggle failed:', err);
    } finally {
      setSchrodingerLoading(null);
    }
  };

  // ── Task roast (existing, unchanged) ─────────────────────────────────────
  const getTaskRoast = (task) => {
    const now            = new Date();
    const deadline       = new Date(task.deadline);
    const daysOverdue    = Math.ceil((now - deadline) / (1000 * 60 * 60 * 24));

    const roastVariations = {
      mild: {
        overdue: [
          `"${task.title}" is ${daysOverdue} day(s) overdue. Time is a concept, but deadlines aren't.`,
          `"${task.title}" has been sitting there for ${daysOverdue} days. It's not going to do itself.`,
        ],
        ignored: [
          `"${task.title}" is being ignored. It sits there. Judging you. Silently.`,
          `"${task.title}" is waiting. And waiting. And waiting...`,
        ],
        panic: [
          `"${task.title}" has pushed you into panic mode. Take a breath. Or don't.`,
        ],
        pending: [
          `"${task.title}" is waiting. It's very patient. Unlike your future self.`,
        ],
        'in-progress': [ `"${task.title}" is in progress. Don't stop now.` ],
        done:          [ `"${task.title}" is done. Miracles do happen.` ],
      },
      brutal: {
        overdue: [
          `"${task.title}" is ${daysOverdue} day(s) overdue. Still procrastinating? Shocking.`,
          `${daysOverdue} days. That's how long "${task.title}" has been ignored. Pathetic.`,
        ],
        ignored: [
          `"${task.title}" is ignored. Just like your responsibilities.`,
          `"${task.title}" is collecting dust. Just like your ambition.`,
        ],
        panic: [ `"${task.title}" is making you panic. Good. Maybe now you'll do something.` ],
        pending: [
          `"${task.title}" is waiting. Your future self hates you already.`,
          `"${task.title}" hasn't been touched. Typical.`,
        ],
        'in-progress': [ `"${task.title}" is in progress. Will it finish? History says no.` ],
        done:          [ `"${task.title}" is done. Took you long enough.` ],
      },
      damage: {
        overdue: [
          `"${task.title}" is ${daysOverdue} day(s) overdue. Your ancestors are ashamed.`,
          `${daysOverdue} days overdue for "${task.title}". Just drop it. It's dead.`,
        ],
        ignored: [
          `"${task.title}" is ignored. Just like your future.`,
          `Ignoring "${task.title}" won't make it disappear. Neither will your problems.`,
        ],
        panic: [ `"${task.title}" pushed you into panic. You're a disappointment to everyone.` ],
        pending: [
          `"${task.title}" is waiting. Your ancestors are rolling in their graves.`,
        ],
        'in-progress': [ `Started "${task.title}". Will you finish? Doubtful.` ],
        done:          [ `"${task.title}" is done. Fluke. Pure fluke.` ],
      }
    };
    const variations = roastVariations[sarcasmLevel] || roastVariations.brutal;
    const roastList  = variations[task.status] || variations.pending;
    return roastList[Math.floor(Math.random() * roastList.length)];
  };

  const handleDeleteTask = async (taskId) => {
    const token = localStorage.getItem('token');
    try {
      await fetch(`http://localhost:5000/api/tasks/${taskId}`, {
        method: 'DELETE', headers: { Authorization: `Bearer ${token}` }
      });
      setTasks(prev => prev.filter(t => t._id !== taskId));
    } catch (err) { console.error(err); }
  };

  const handleUpdateTask = async () => {
    if (!selectedTask) return;
    const token = localStorage.getItem('token');
    try {
      const res = await fetch(`http://localhost:5000/api/tasks/${selectedTask._id}`, {
        method:  'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body:    JSON.stringify({ status: editedStatus }),
      });
      if (res.ok) {
        const updatedTask = await res.json();
        setTasks(prev => prev.map(t => t._id === updatedTask._id ? updatedTask : t));
        setSelectedTask(updatedTask);
        setIsEditingTask(false);
      }
    } catch (err) { console.error(err); }
  };

  const handleAddTask = async () => {
    const token = localStorage.getItem('token');
    if (!newTitle || !newDeadline) return;
    try {
      const res = await fetch('http://localhost:5000/api/tasks', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body:    JSON.stringify({ title: newTitle, deadline: newDeadline }),
      });
      const data = await res.json();
      setTasks([data, ...tasks]);
      setNewTitle('');
      setNewDeadline('');
      setIsAddingTask(false);
    } catch (err) { console.error(err); }
  };

  const getStatusBadge = (status) => {
    const badges = {
      ignored:     <Badge className="bg-gray-600/20 text-gray-400 border-gray-600/30">Ignored</Badge>,
      pending:     <Badge className="bg-yellow-600/20 text-yellow-400 border-yellow-600/30">Pending</Badge>,
      'in-progress': <Badge className="bg-blue-600/20 text-blue-400 border-blue-600/30">In Progress</Badge>,
      panic:       <Badge className="bg-[#ff3366]/20 text-[#ff3366] border-[#ff3366]/30">Panic Imminent</Badge>,
      done:        <Badge className="bg-[#39ff14]/20 text-[#39ff14] border-[#39ff14]/30">Done</Badge>,
      overdue:     <Badge className="bg-[#ff6b35]/20 text-[#ff6b35] border-[#ff6b35]/30">Overdue</Badge>,
    };
    return badges[status] || null;
  };

  const getNpcEmoji = (npcName) => {
    if (!npcName) return '🤖';
    if (npcName.toLowerCase().includes('hostile') || npcName.toLowerCase().includes('mentor')) return '😤';
    if (npcName.toLowerCase().includes('chaotic') || npcName.toLowerCase().includes('friend'))  return '🤪';
    if (npcName.toLowerCase().includes('mom'))   return '🤱';
    return '👁️';
  };

  // ── Escalation styling ────────────────────────────────────────────────────
  const getEscalationStyle = (level) => {
    switch (level) {
      case 'warning':    return 'border-[#ffd166] shadow-[#ffd166]/10';
      case 'panic':      return 'border-[#ff6b35] shadow-[#ff6b35]/20 animate-pulse-slow';
      case 'hysterical': return 'border-[#ff006e] shadow-[#ff006e]/30';
      default:           return 'border-white/10';
    }
  };

  const filterOptions = [
    { value: 'all',     label: 'All Tasks' },
    { value: 'overdue', label: 'Overdue' },
    { value: 'ignored', label: 'Ignored' },
    { value: 'panic',   label: 'Panic Mode' },
    { value: 'done',    label: 'Completed' },
  ];

  const filteredTasks = filter === 'all' ? tasks : tasks.filter(t => t.status === filter);

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <p className="text-[#ff6b35] animate-pulse">{loadingLine}</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="max-w-7xl mx-auto px-6 py-12">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2 text-white">Avoidance Headquarters</h1>
          <p className="text-[#8a8a9f] italic">Your command center for professional procrastination.</p>
          <div className="mt-2 text-xs text-gray-500">
            Roast Mode: <span className="text-[#ff6b35]">{sarcasmLevel.toUpperCase()}</span>
          </div>
        </div>

        <div className="flex gap-6">
          {/* Sidebar filters */}
          <div className="w-64 flex-shrink-0">
            <div className="bg-[#151520] border border-white/10 rounded-2xl p-6 sticky top-24">
              <h3 className="font-bold mb-4 text-white">Filters</h3>
              <div className="space-y-2">
                {filterOptions.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => setFilter(option.value)}
                    className={`w-full text-left px-4 py-2 rounded-lg transition-all ${
                      filter === option.value
                        ? 'bg-[#00d4ff]/10 text-[#00d4ff] border border-[#00d4ff]/30'
                        : 'hover:bg-white/5 text-[#8a8a9f]'
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Task list */}
          <div className="flex-1">
            <AnimatePresence>
              <div className="space-y-4">
                {filteredTasks.map((task) => {
                  const level    = task.escalationLevel || 'normal';
                  const isHysterical = level === 'hysterical';
                  const npcLine  = isHysterical
                    ? HYSTERICAL_NPC_LINES[Math.floor(Math.random() * HYSTERICAL_NPC_LINES.length)]
                    : null;

                  return (
                    <motion.div
                      key={task._id}
                      layout
                      variants={cardVariants}
                      animate={isHysterical ? 'hysterical' : 'normal'}
                      className={`bg-[#151520] border rounded-2xl p-6 cursor-pointer shadow-lg transition-colors
                        ${getEscalationStyle(level)} hover:border-white/20`}
                      onClick={() => setSelectedTask(task)}
                    >
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="text-xl font-bold text-white">{task.title}</h3>
                            {/* Schrödinger indicator */}
                            {task.isSchrodinger && !task.schrodingerResolved && (
                              <span className="text-xs px-2 py-0.5 rounded-full bg-[#9d4edd]/20 text-[#c77dff] border border-[#9d4edd]/30 font-mono">
                                ⚛ superposition
                              </span>
                            )}
                            {task.schrodingerResolved && (
                              <span className={`text-xs px-2 py-0.5 rounded-full font-mono border ${
                                task.schrodingerOutcome === 'submitted'
                                  ? 'bg-[#06d6a0]/20 text-[#06d6a0] border-[#06d6a0]/30'
                                  : 'bg-[#ff006e]/20 text-[#ff006e] border-[#ff006e]/30'
                              }`}>
                                ⚛ {task.schrodingerOutcome === 'submitted' ? 'collapsed: submitted' : 'collapsed: failed'}
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-4 text-sm text-[#8a8a9f]">
                            <div className="flex items-center gap-2">
                              <Calendar size={16} />
                              Due: {task.deadline.slice(0, 10)}
                            </div>
                            <div className="flex items-center gap-2">
                              <TrendingUp size={16} />
                              Despair: +{task.despairContribution || 0}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          {getStatusBadge(task.status)}

                          {/* Schrödinger toggle button */}
                          {task.status !== 'done' && !task.schrodingerResolved && (
                            <button
                              onClick={(e) => handleToggleSchrodinger(task._id, e)}
                              disabled={schrodingerLoading === task._id}
                              className={`p-1.5 rounded-lg transition-colors ${
                                task.isSchrodinger
                                  ? 'text-[#c77dff] bg-[#9d4edd]/20'
                                  : 'text-gray-600 hover:text-[#c77dff] hover:bg-[#9d4edd]/10'
                              }`}
                              title={task.isSchrodinger ? "Remove superposition" : "Enter superposition (Schrödinger's Task)"}
                            >
                              <Atom size={16} className={schrodingerLoading === task._id ? 'animate-spin' : ''} />
                            </button>
                          )}

                          <button
                            onClick={(e) => { e.stopPropagation(); handleDeleteTask(task._id); }}
                            className="text-red-500 hover:text-red-400 transition-colors"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </div>

                      {/* Roast comment */}
                      <div className={`border rounded-xl p-4 backdrop-blur-sm ${
                        isHysterical
                          ? 'bg-gradient-to-br from-[#ff006e]/15 via-[#1a1a28] to-[#ff006e]/10 border-[#ff006e]/30'
                          : level === 'panic'
                            ? 'bg-gradient-to-br from-[#ff6b35]/12 via-[#1a1a28] to-[#ff3366]/10 border-[#ff6b35]/25'
                            : 'bg-gradient-to-br from-[#ff6b35]/10 via-[#1a1a28] to-[#ff3366]/10 border-[#ff6b35]/30'
                      }`}>
                        <p className="text-sm italic text-[#e8e8f0]">"{getTaskRoast(task)}"</p>
                      </div>

                      {/* ADDED: Level 3 (hysterical) NPC speech bubble ──── */}
                      {isHysterical && npcLine && (
                        <div className="mt-3 flex items-start gap-2">
                          <span className="text-lg">😤</span>
                          <div className="bg-[#ff006e]/10 border border-[#ff006e]/20 rounded-xl px-3 py-2 text-xs text-[#ff6b35] italic relative">
                            {npcLine}
                            {/* Speech bubble tail */}
                            <div className="absolute -left-2 top-3 w-0 h-0"
                              style={{
                                borderTop: '5px solid transparent',
                                borderBottom: '5px solid transparent',
                                borderRight: '8px solid rgba(255,0,110,0.2)'
                              }}
                            />
                          </div>
                        </div>
                      )}
                    </motion.div>
                  );
                })}
              </div>
            </AnimatePresence>

            <button
              onClick={() => setIsAddingTask(true)}
              className="fixed bottom-8 right-8 bg-gradient-to-r from-[#00d4ff] to-[#9d4edd] text-white px-6 py-4 rounded-full shadow-2xl hover:shadow-[#00d4ff]/50 transition-all flex items-center gap-3 font-bold"
            >
              <Plus size={24} />
              Add Another Bad Decision
            </button>
          </div>
        </div>
      </div>

      {/* Task detail dialog */}
      <Dialog open={!!selectedTask} onOpenChange={(open) => {
        if (!open) { setSelectedTask(null); setIsEditingTask(false); }
      }}>
        <DialogContent className="bg-[#151520] border-white/10 text-white max-w-2xl">
          {selectedTask && (
            <>
              <DialogHeader>
                <DialogTitle className="text-2xl text-white flex items-center gap-2">
                  {selectedTask.title}
                  {selectedTask.isSchrodinger && !selectedTask.schrodingerResolved && (
                    <span className="text-sm font-normal text-[#c77dff]">⚛ in superposition</span>
                  )}
                </DialogTitle>
              </DialogHeader>

              <div className="space-y-6 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-sm text-[#8a8a9f] mb-1">Status</div>
                    {isEditingTask ? (
                      <select
                        value={editedStatus}
                        onChange={(e) => setEditedStatus(e.target.value)}
                        className="bg-[#1a1a28] border border-white/10 text-white rounded p-1 w-full outline-none"
                      >
                        <option value={selectedTask.status} disabled>Current: {selectedTask.status}</option>
                        <option value="done">Completed</option>
                      </select>
                    ) : (
                      getStatusBadge(selectedTask.status)
                    )}
                  </div>
                  <div>
                    <div className="text-sm text-[#8a8a9f] mb-1">Deadline</div>
                    <div className="text-white">{selectedTask.deadline?.slice(0, 10)}</div>
                  </div>
                  <div>
                    <div className="text-sm text-[#8a8a9f] mb-1">Despair Contribution</div>
                    <div className="text-[#ff3366]">+{selectedTask.despairContribution || 0}</div>
                  </div>
                  <div>
                    <div className="text-sm text-[#8a8a9f] mb-1">Escalation Level</div>
                    <div className={`text-sm font-semibold ${
                      selectedTask.escalationLevel === 'hysterical' ? 'text-[#ff006e]' :
                      selectedTask.escalationLevel === 'panic'      ? 'text-[#ff6b35]' :
                      selectedTask.escalationLevel === 'warning'    ? 'text-[#ffd166]' :
                                                                       'text-gray-400'
                    }`}>
                      {selectedTask.escalationLevel || 'normal'}
                    </div>
                  </div>
                </div>

                {/* Schrödinger section */}
                {!selectedTask.schrodingerResolved && selectedTask.status !== 'done' && (
                  <div className="bg-[#9d4edd]/10 border border-[#9d4edd]/20 rounded-xl p-4">
                    <div className="text-sm text-[#c77dff] font-semibold mb-1">⚛ Schrödinger's Task</div>
                    <p className="text-xs text-gray-400 mb-3">
                      {selectedTask.isSchrodinger
                        ? "This task exists in quantum superposition. At the deadline, the universe will decide: submitted or failed."
                        : "Mark this task as simultaneously done and not done. The deadline collapses the wave function."}
                    </p>
                    <button
                      onClick={(e) => handleToggleSchrodinger(selectedTask._id, e)}
                      className={`text-xs px-3 py-1.5 rounded-lg border transition-all ${
                        selectedTask.isSchrodinger
                          ? 'border-[#ff006e]/30 text-[#ff006e] hover:bg-[#ff006e]/10'
                          : 'border-[#9d4edd]/30 text-[#c77dff] hover:bg-[#9d4edd]/20'
                      }`}
                    >
                      {selectedTask.isSchrodinger ? 'Remove superposition' : 'Enter superposition'}
                    </button>
                  </div>
                )}

                {selectedTask.schrodingerResolved && (
                  <div className={`border rounded-xl p-4 ${
                    selectedTask.schrodingerOutcome === 'submitted'
                      ? 'bg-[#06d6a0]/10 border-[#06d6a0]/30'
                      : 'bg-[#ff006e]/10 border-[#ff006e]/30'
                  }`}>
                    <div className="text-sm font-semibold mb-1" style={{
                      color: selectedTask.schrodingerOutcome === 'submitted' ? '#06d6a0' : '#ff006e'
                    }}>
                      ⚛ Wave Function Collapsed
                    </div>
                    <p className="text-xs text-gray-400">
                      {selectedTask.schrodingerOutcome === 'submitted'
                        ? "The cat was alive. The assignment was submitted. The universe was merciful."
                        : "The cat is dead. The assignment was not submitted. The universe was not merciful."}
                    </p>
                  </div>
                )}

                {/* NPC Comments */}
                <div>
                  <div className="text-sm text-[#8a8a9f] mb-3">NPC Commentary</div>
                  {(!selectedTask.npcComments || selectedTask.npcComments.length === 0) ? (
                    <p className="text-sm italic text-gray-400">No NPC comments yet.</p>
                  ) : (
                    <div className="space-y-3">
                      {selectedTask.npcComments.map((comment, idx) => (
                        <div key={idx} className="bg-[#1a1a28] border border-white/5 rounded-lg p-4">
                          <div className="flex items-start gap-3">
                            <div className="text-2xl">{getNpcEmoji(comment.npc)}</div>
                            <div>
                              <div className="text-[#ff6b35] font-medium mb-1">{comment.npc || 'NPC'}</div>
                              <p className="italic text-white">"{comment.comment}"</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {isEditingTask ? (
                  <div className="flex gap-3">
                    <Button onClick={() => setIsEditingTask(false)} className="flex-1 bg-gray-600 hover:bg-gray-700">Cancel</Button>
                    <Button onClick={handleUpdateTask} className="flex-1 bg-[#00d4ff] text-black hover:bg-[#00d4ff]/90">Save Changes</Button>
                  </div>
                ) : (
                  <div className="flex gap-3">
                    <Button
                      onClick={() => { setEditedStatus(selectedTask.status); setIsEditingTask(true); }}
                      className="flex-1 bg-[#ff6b35] hover:bg-[#ff6b35]/90 text-white"
                    >
                      Edit Task
                    </Button>
                    <Button
                      onClick={() => { handleDeleteTask(selectedTask._id); setSelectedTask(null); }}
                      className="flex-1 bg-red-600 hover:bg-red-700"
                    >
                      Delete Task
                    </Button>
                  </div>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Add task dialog */}
      <Dialog open={isAddingTask} onOpenChange={setIsAddingTask}>
        <DialogContent className="bg-[#151520] border-white/10 text-white">
          <DialogHeader>
            <DialogTitle className="text-white">Add New Task</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label className="text-white">Task Title</Label>
              <Input
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                placeholder="Be honest… will you actually do this?"
                className="bg-[#1a1a28] border-white/10 text-white placeholder:text-[#8a8a9f] placeholder:italic"
              />
            </div>
            <div>
              <Label className="text-white">Deadline</Label>
              <Input
                type="date"
                value={newDeadline}
                onChange={(e) => setNewDeadline(e.target.value)}
                className="bg-[#1a1a28] border-white/10 text-white"
              />
            </div>
            <Button onClick={handleAddTask} className="w-full bg-[#00d4ff] text-black hover:bg-[#00d4ff]/90">
              Add Task (and Regret)
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
