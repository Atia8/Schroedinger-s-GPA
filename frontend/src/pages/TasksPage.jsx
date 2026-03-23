import { useState, useEffect } from 'react';
import { Plus, Calendar, TrendingUp, X, Trash2 } from 'lucide-react';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../components/ui/dialog';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';

export default function TasksPage() {
  const [tasks, setTasks] = useState([]);
  const [filter, setFilter] = useState('all');
  const [selectedTask, setSelectedTask] = useState(null);
  const [isAddingTask, setIsAddingTask] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDeadline, setNewDeadline] = useState('');
  const [sarcasmLevel, setSarcasmLevel] = useState('brutal');

  // Fetch user's sarcasm level and tasks
  const fetchData = async () => {
    const token = localStorage.getItem('token');
    
    // Get user's sarcasm level
    try {
      const userRes = await fetch('http://localhost:5000/api/users/profile', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const userData = await userRes.json();
      setSarcasmLevel(userData.user?.sarcasmLevel || 'brutal');
    } catch (err) {
      console.error('Failed to fetch user:', err);
    }
    
    // Get tasks
    fetch('http://localhost:5000/api/tasks', {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
    })
      .then(res => res.json())
      .then(data => setTasks(data))
      .catch(err => console.error(err));
  };

  useEffect(() => {
    fetchData();
    
    // Listen for sarcasm changes from settings
    const handleSarcasmChange = () => fetchData();
    window.addEventListener('sarcasmChanged', handleSarcasmChange);
    window.addEventListener('refreshDashboard', handleSarcasmChange);
    
    return () => {
      window.removeEventListener('sarcasmChanged', handleSarcasmChange);
      window.removeEventListener('refreshDashboard', handleSarcasmChange);
    };
  }, []);

  // Generate roast based on task and sarcasm level
  const getTaskRoast = (task) => {
    const now = new Date();
    const deadline = new Date(task.deadline);
    const hoursUntil = (deadline - now) / (1000 * 60 * 60);
    
    const roasts = {
      mild: {
        overdue: `"${task.title}" is overdue. Time is a concept, but deadlines aren't.`,
        dueSoon: `"${task.title}" is due in ${Math.ceil(hoursUntil)} hours. Consider starting.`,
        pending: `"${task.title}" is waiting. It's very patient. Unlike your future self.`
      },
      brutal: {
        overdue: `"${task.title}" is overdue. Still procrastinating? Shocking.`,
        dueSoon: `"${task.title}" is due in ${Math.ceil(hoursUntil)} hours. They're not going to do themselves.`,
        pending: `"${task.title}" is waiting. Your future self is already disappointed.`
      },
      damage: {
        overdue: `"${task.title}" is overdue. At this point, just drop it.`,
        dueSoon: `"${task.title}" is due in ${Math.ceil(hoursUntil)} hours. Your ancestors didn't survive for this.`,
        pending: `"${task.title}" is waiting. Just accept your fate.`
      }
    };
    
    const mode = roasts[sarcasmLevel] || roasts.brutal;
    
    if (task.status === 'overdue') return mode.overdue;
    if (hoursUntil <= 24 && hoursUntil > 0) return mode.dueSoon;
    return mode.pending;
  };

  // Get NPC emoji based on sarcasm level
  const getNpcEmoji = () => {
    if (sarcasmLevel === 'damage') return '💀';
    if (sarcasmLevel === 'brutal') return '😈';
    return '😐';
  };

  // Get NPC name based on sarcasm level
  const getNpcName = () => {
    if (sarcasmLevel === 'damage') return 'The Destroyer';
    if (sarcasmLevel === 'brutal') return 'Honest Friend';
    return 'Passive Mentor';
  };

  // --- DELETE TASK FUNCTION ---
  const handleDeleteTask = async (taskId) => {
    const token = localStorage.getItem('token');
    try {
      await fetch(`http://localhost:5000/api/tasks/${taskId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` },
      });
      setTasks(prev => prev.filter(t => t._id !== taskId));
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddTask = async () => {
    const token = localStorage.getItem('token'); 
    if (!newTitle || !newDeadline) return;
    try {
      const res = await fetch('http://localhost:5000/api/tasks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ title: newTitle, deadline: newDeadline }),
      });
      const data = await res.json();
      setTasks([data, ...tasks]);
      setNewTitle('');
      setNewDeadline('');
      setIsAddingTask(false);
    } catch (err) {
      console.error(err);
    }
  };

  const getStatusBadge = (status) => {
    const badges = {
      ignored: <Badge className="bg-[#8a8a9f]/20 text-[#8a8a9f] border-[#8a8a9f]/30">Ignored</Badge>,
      panic: <Badge className="bg-[#ff3366]/20 text-[#ff3366] border-[#ff3366]/30">Panic Imminent</Badge>,
      done: <Badge className="bg-[#39ff14]/20 text-[#39ff14] border-[#39ff14]/30">Miraculously Done</Badge>,
      overdue: <Badge className="bg-[#ff6b35]/20 text-[#ff6b35] border-[#ff6b35]/30">Overdue</Badge>,
    };
    return badges[status] || null;
  };

  const filterOptions = [
    { value: 'all', label: 'All Tasks' },
    { value: 'overdue', label: 'Overdue' },
    { value: 'ignored', label: 'Ignored' },
    { value: 'done', label: 'Completed' },
    { value: 'panic', label: 'Panic Mode' },
  ];

  const filteredTasks = filter === 'all' ? tasks : tasks.filter(t => t.status === filter);

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="max-w-7xl mx-auto px-6 py-12">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2 text-white">Avoidance Headquarters</h1>
          <p className="text-[#8a8a9f] italic">Your command center for professional procrastination.</p>
          <div className="mt-2 text-xs text-gray-500">
            Roast Mode: <span className="text-[#ff6b35]">{sarcasmLevel.toUpperCase()}</span>
          </div>
        </div>

        <div className="flex gap-6">
          {/* Left Sidebar - Filters */}
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
          
          {/* Main Content */}
          <div className="flex-1">
            <div className="space-y-4">
              {filteredTasks.map((task) => (
                <div
                  key={task._id}
                  className="bg-[#151520] border border-white/10 rounded-2xl p-6 hover:border-white/20 transition-all cursor-pointer shadow-lg shadow-black/20"
                  onClick={() => setSelectedTask(task)}
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h3 className="text-xl font-bold mb-2 text-white">{task.title}</h3>
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
                    {getStatusBadge(task.status)}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteTask(task._id);
                      }}
                      className="ml-2 text-red-500 hover:text-red-700"
                    >
                      <Trash2 size={20} />
                    </button>
                  </div>
                  
                  {/* Roast Panel - Dynamic based on sarcasm level */}
                  <div className="bg-gradient-to-br from-[#ff6b35]/10 via-[#1a1a28] to-[#ff3366]/10 border border-[#ff6b35]/30 rounded-xl p-5 backdrop-blur-sm">
                    <div className="flex items-center gap-2 mb-3">
                      <div className="w-2 h-2 rounded-full bg-[#ff6b35] animate-pulse" />
                      <span className="text-sm font-bold text-[#ff6b35]">ROAST PANEL</span>
                    </div>
                    
                    <div className="space-y-3">
                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 rounded-full bg-[#2a2a3f] flex items-center justify-center text-lg flex-shrink-0">
                          {getNpcEmoji()}
                        </div>
                        <div className="flex-1">
                          <div className="text-xs text-[#ff6b35] font-medium mb-1">
                            {getNpcName()}:
                          </div>
                          <p className="text-sm italic text-[#e8e8f0]">"{getTaskRoast(task)}"</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            
            {/* Floating Add Button */}
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
      
      {/* Task Details Drawer */}
      <Dialog open={!!selectedTask} onOpenChange={() => setSelectedTask(null)}>
        <DialogContent className="bg-[#151520] border-white/10 text-white max-w-2xl">
          {selectedTask && (
            <>
              <DialogHeader>
                <DialogTitle className="text-2xl text-white">{selectedTask.title}</DialogTitle>
              </DialogHeader>
              
              <div className="space-y-6 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-sm text-[#8a8a9f] mb-1">Status</div>
                    {getStatusBadge(selectedTask.status)}
                  </div>
                  <div>
                    <div className="text-sm text-[#8a8a9f] mb-1">Deadline</div>
                    <div className="text-white">{selectedTask.deadline}</div>
                  </div>
                  <div>
                    <div className="text-sm text-[#8a8a9f] mb-1">Despair Contribution</div>
                    <div className="text-[#ff3366]">+{selectedTask.despairContribution || 0}</div>
                  </div>
                </div>
                
                <div>
                  <div className="text-sm text-[#8a8a9f] mb-3">NPC Commentary</div>
                  <div className="bg-[#1a1a28] border border-white/5 rounded-lg p-4">
                    <div className="flex items-start gap-3">
                      <div className="text-2xl">{getNpcEmoji()}</div>
                      <div>
                        <div className="text-[#ff6b35] font-medium mb-1">{getNpcName()}</div>
                        <p className="italic text-white">"{getTaskRoast(selectedTask)}"</p>
                      </div>
                    </div>
                  </div>
                </div>
                
                <Button className="w-full bg-[#00d4ff] text-black hover:bg-[#00d4ff]/90">
                  Edit Task
                </Button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
      
      {/* Add Task Modal */}
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
            <Button
              onClick={handleAddTask}
              className="w-full bg-[#00d4ff] text-black hover:bg-[#00d4ff]/90"
            >
              Add Task (and Regret)
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}