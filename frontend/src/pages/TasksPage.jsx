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

  const fetchData = async () => {
    const token = localStorage.getItem('token');
    
    try {
      const userRes = await fetch('http://localhost:5000/api/users/profile', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const userData = await userRes.json();
      setSarcasmLevel(userData.user?.sarcasmLevel || 'brutal');
    } catch (err) {
      console.error('Failed to fetch user:', err);
    }
    
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
    
    const handleSarcasmChange = () => fetchData();
    window.addEventListener('sarcasmChanged', handleSarcasmChange);
    window.addEventListener('refreshDashboard', handleSarcasmChange);
    
    return () => {
      window.removeEventListener('sarcasmChanged', handleSarcasmChange);
      window.removeEventListener('refreshDashboard', handleSarcasmChange);
    };
  }, []);

// Dynamic roast based on task status and sarcasm level (WITH VARIATIONS)
const getTaskRoast = (task) => {
  const now = new Date();
  const deadline = new Date(task.deadline);
  const hoursUntilDeadline = (deadline - now) / (1000 * 60 * 60);
  const daysUntil = Math.ceil(hoursUntilDeadline / 24);
  const daysOverdue = Math.ceil((now - deadline) / (1000 * 60 * 60 * 24));
  
  // Multiple roast variations for each status
  const roastVariations = {
    mild: {
      overdue: [
        `"${task.title}" is ${daysOverdue} day(s) overdue. Time is a concept, but deadlines aren't.`,
        `"${task.title}" has been sitting there for ${daysOverdue} days. It's not going to do itself.`,
        `"${task.title}" is ${daysOverdue} day(s) overdue. Consider starting. Or don't. Your call.`
      ],
      ignored: [
        `"${task.title}" is being ignored. It sits there. Judging you. Silently.`,
        `"${task.title}" is pretending not to exist. You're good at that.`,
        `"${task.title}" is waiting. And waiting. And waiting...`
      ],
      panic: [
        `"${task.title}" has pushed you into panic mode. Take a breath. Or don't.`,
        `"${task.title}" is causing chaos. Deep breaths. Or scream. Both work.`,
        `"${task.title}" = panic. Maybe just start. ANYTHING helps.`
      ],
      pending: [
        `"${task.title}" is waiting. It's very patient. Unlike your future self.`,
        `"${task.title}" is on the list. Still. Has been for a while.`,
        `"${task.title}" exists. That's... something.`
      ],
      'in-progress': [
        `"${task.title}" is in progress. Good. Keep going. Maybe.`,
        `"${task.title}" is being worked on. Don't stop now.`,
        `"${task.title}" - half done? Quarter done? At least it's started.`
      ],
      done: [
        `"${task.title}" is done. Miracles do happen.`,
        `"${task.title}" is complete. Don't let it go to your head.`,
        `"${task.title}" is finished. One down, ${task.length} to go.`
      ]
    },
    brutal: {
      overdue: [
        `"${task.title}" is ${daysOverdue} day(s) overdue. Still procrastinating? Shocking.`,
        `"${task.title}" is ${daysOverdue} days late. Your future self is disappointed.`,
        `"${daysOverdue} days. That's how long "${task.title}" has been ignored. Pathetic.`
      ],
      ignored: [
        `"${task.title}" is ignored. Just like your responsibilities.`,
        `"${task.title}" is being avoided. Shocking. Absolutely shocking.`,
        `"${task.title}" is collecting dust. Just like your ambition.`
      ],
      panic: [
        `"${task.title}" has sent you into panic mode. Impressive. Also pathetic.`,
        `"${task.title}" is making you panic. Good. Maybe now you'll do something.`,
        `Panic over "${task.title}"? Too late to panic now. Just do it.`
      ],
      pending: [
        `"${task.title}" is waiting. Your future self hates you already.`,
        `"${task.title}" hasn't been touched. Typical.`,
        `"${task.title}" is still there. Are you surprised? I'm not.`
      ],
      'in-progress': [
        `"${task.title}" is in progress. Don't stop now. You might actually finish.`,
        `"${task.title}" is being worked on. Finally.`,
        `"${task.title}" - started. Will it finish? History says no.`
      ],
      done: [
        `"${task.title}" is done. Took you long enough.`,
        `"${task.title}" is complete. Don't expect a parade.`,
        `Finally. "${task.title}" is done. Only ${task.length - 1} left.`
      ]
    },
    damage: {
      overdue: [
        `"${task.title}" is ${daysOverdue} day(s) overdue. Your ancestors are ashamed.`,
        `"${daysOverdue} days overdue for "${task.title}". Just drop it. It's dead.`,
        `"${task.title}" is ${daysOverdue} days late. You had one job.`
      ],
      ignored: [
        `"${task.title}" is ignored. Just like your future.`,
        `"${task.title}" is being avoided. Your ancestors are rolling in their graves.`,
        `Ignoring "${task.title}" won't make it disappear. Neither will your problems.`
      ],
      panic: [
        `"${task.title}" pushed you into panic. You're a disappointment to everyone.`,
        `Panic over "${task.title}"? Your ancestors didn't survive for this.`,
        `"${task.title}" = panic. Just accept your fate.`
      ],
      pending: [
        `"${task.title}" is waiting. Your ancestors are rolling in their graves.`,
        `"${task.title}" is still there. Pathetic.`,
        `"${task.title}" hasn't been touched. Predictable.`
      ],
      'in-progress': [
        `"${task.title}" is in progress. Don't mess this up. You will.`,
        `"${task.title}" is being worked on. For now.`,
        `Started "${task.title}". Will you finish? Doubtful.`
      ],
      done: [
        `"${task.title}" is done. Fluke. Pure fluke.`,
        `"${task.title}" is complete. Don't get used to it.`,
        `Miraculously, "${task.title}" is done. One miracle won't save you.`
      ]
    }
  };
  
  const variations = roastVariations[sarcasmLevel] || roastVariations.brutal;
  const roastList = variations[task.status] || variations.pending;
  
  // Randomly pick one variation
  return roastList[Math.floor(Math.random() * roastList.length)];
};

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
      ignored: <Badge className="bg-gray-600/20 text-gray-400 border-gray-600/30">Ignored</Badge>,
      pending: <Badge className="bg-yellow-600/20 text-yellow-400 border-yellow-600/30">Pending</Badge>,
      'in-progress': <Badge className="bg-blue-600/20 text-blue-400 border-blue-600/30">In Progress</Badge>,
      panic: <Badge className="bg-[#ff3366]/20 text-[#ff3366] border-[#ff3366]/30">Panic Imminent</Badge>,
      done: <Badge className="bg-[#39ff14]/20 text-[#39ff14] border-[#39ff14]/30">Done</Badge>,
      overdue: <Badge className="bg-[#ff6b35]/20 text-[#ff6b35] border-[#ff6b35]/30">Overdue</Badge>,
    };
    return badges[status] || null;
  };

  const filterOptions = [
    { value: 'all', label: 'All Tasks' },
    { value: 'overdue', label: 'Overdue' },
    { value: 'ignored', label: 'Ignored' },
    { value: 'panic', label: 'Panic Mode' },
    { value: 'done', label: 'Completed' },
  ];

  const filteredTasks = filter === 'all' ? tasks : tasks.filter(t => t.status === filter);

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
                    <div className="flex items-center gap-2">
                      {getStatusBadge(task.status)}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteTask(task._id);
                        }}
                        className="text-red-500 hover:text-red-400 transition-colors"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </div>
                  
                  {/* Simple Roast Comment - No NPC, no label */}
                  <div className="bg-gradient-to-br from-[#ff6b35]/10 via-[#1a1a28] to-[#ff3366]/10 border border-[#ff6b35]/30 rounded-xl p-4 backdrop-blur-sm">
                    <p className="text-sm italic text-[#e8e8f0]">"{getTaskRoast(task)}"</p>
                  </div>
                </div>
              ))}
            </div>
            
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
                  <div className="text-sm text-[#8a8a9f] mb-3">Commentary</div>
                  <div className="bg-[#1a1a28] border border-white/5 rounded-lg p-4">
                    <p className="italic text-white">"{getTaskRoast(selectedTask)}"</p>
                  </div>
                </div>
                
                <Button 
                  onClick={() => {
                    handleDeleteTask(selectedTask._id);
                    setSelectedTask(null);
                  }}
                  className="w-full bg-red-600 hover:bg-red-700"
                >
                  Delete Task
                </Button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
      
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