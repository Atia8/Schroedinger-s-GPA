import { useState, useEffect } from 'react';
import { Plus, X, Trash2, AlertTriangle, Calendar } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../components/ui/dialog';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Button } from '../components/ui/button';

export default function TasksPage() {
  const [tasks, setTasks] = useState([]);
  const [isAddingTask, setIsAddingTask] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDeadline, setNewDeadline] = useState('');

  // 1. Add Task
  const handleAddTask = async () => {
    if (!newTitle || !newDeadline) return;

    try {
      const token = localStorage.getItem('token');
      const res = await fetch('http://localhost:5000/api/tasks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          title: newTitle,
          deadline: newDeadline
        })
      });

      if (!res.ok) throw new Error('Failed to create task');
      const data = await res.json();
      setTasks([data, ...tasks]);

      setNewTitle('');
      setNewDeadline('');
      setIsAddingTask(false);
    } catch (err) {
      console.error("Error adding task:", err);
    }
  }; 

  // 2. Fetch Tasks
  useEffect(() => {
    const token = localStorage.getItem('token');
    fetch('http://localhost:5000/api/tasks', {
      headers: { 'Authorization': `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) setTasks(data);
      })
      .catch(err => console.error(err));
  }, []);

  // 3. Delete Task (Bonus Feature)
  const handleDeleteTask = async (taskId) => {
    try {
      const token = localStorage.getItem('token');
      await fetch(`http://localhost:5000/api/tasks/${taskId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      setTasks(tasks.filter(t => t._id !== taskId));
    } catch (err) {
      console.error("Failed to delete task:", err);
    }
  };

  return (
    // ✅ FIX: Hardcoded Dark Background to match Dashboard
    <div className="min-h-screen w-full bg-[#1A1A1B] text-white p-6 pt-24">
      
      <div className="max-w-5xl mx-auto">
        <div className="flex justify-between items-end mb-8">
          <div>
            <h1 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-[#FF5733] to-[#FFD700]">
              Your Doom List
            </h1>
            <p className="text-gray-400 mt-2">Manage your regrets before they manage you.</p>
          </div>
          <div className="text-right hidden md:block">
            <p className="text-sm text-gray-500 uppercase tracking-widest">Total Tasks</p>
            <p className="text-3xl font-bold text-white">{tasks.length}</p>
          </div>
        </div>
        
        {/* Task List */}
        <div className="grid gap-4">
          {tasks.length === 0 ? (
             <div className="text-center py-20 bg-[#2C2C2E] rounded-2xl border border-gray-700 border-dashed">
                <p className="text-gray-400 text-xl">No tasks? Suspiciously quiet...</p>
                <p className="text-gray-600 text-sm mt-2">Use the button to ruin your day.</p>
             </div>
          ) : (
            tasks.map((task) => {
              const isPanic = task.escalationLevel === 'panic' || task.escalationLevel === 'hysterical';
              
              return (
                <div 
                  key={task._id} 
                  className={`group relative p-5 rounded-xl border transition-all duration-300 hover:-translate-y-1 ${
                    isPanic 
                      ? 'bg-red-900/10 border-red-500/50 hover:shadow-[0_0_20px_rgba(239,68,68,0.2)]' 
                      : 'bg-[#2C2C2E] border-gray-700 hover:border-[#FF5733]/50'
                  }`}
                >
                  <div className="flex justify-between items-center">
                    <div className="flex items-start gap-4">
                      <div className={`p-3 rounded-lg ${isPanic ? 'bg-red-500/20 text-red-500' : 'bg-gray-700 text-gray-400'}`}>
                        {isPanic ? <AlertTriangle size={24} /> : <Calendar size={24} />}
                      </div>
                      <div>
                        <h3 className={`font-bold text-lg ${isPanic ? 'text-red-400' : 'text-gray-200'}`}>
                          {task.title}
                        </h3>
                        <p className="text-sm text-gray-400 flex items-center gap-2 mt-1">
                          Due: {new Date(task.deadline).toLocaleDateString()}
                          {isPanic && <span className="text-red-500 font-bold text-xs uppercase ml-2 animate-pulse">Late!</span>}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      <span className={`px-3 py-1 rounded-full text-xs uppercase font-bold tracking-wider ${
                        isPanic 
                          ? 'bg-red-500/20 text-red-500 border border-red-500/30' 
                          : 'bg-green-500/20 text-green-500 border border-green-500/30'
                      }`}>
                        {task.escalationLevel || 'Normal'}
                      </span>
                      
                      <button 
                        onClick={() => handleDeleteTask(task._id)}
                        className="p-2 text-gray-500 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                        title="Delete Task"
                      >
                        <Trash2 size={20} />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Floating Add Button */}
      <button
        onClick={() => setIsAddingTask(true)}
        className="fixed bottom-8 right-8 bg-gradient-to-r from-[#FF5733] to-[#C70039] text-white px-6 py-4 rounded-full flex items-center gap-3 font-bold shadow-[0_0_20px_rgba(255,87,51,0.4)] hover:scale-110 hover:shadow-[0_0_30px_rgba(255,87,51,0.6)] transition-all z-50"
      >
        <Plus size={24} />
        Log Regret
      </button>

      {/* Modal */}
      <Dialog open={isAddingTask} onOpenChange={setIsAddingTask}>
        <DialogContent className="bg-[#1A1A1B] border-gray-700 text-white sm:max-w-md">
          <button
            onClick={() => setIsAddingTask(false)}
            className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors"
          >
            <X size={20} />
          </button>
          
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-[#FF5733]">Add New Nightmare</DialogTitle>
          </DialogHeader>

          <div className="space-y-6 py-4">
            <div className="space-y-2">
              <Label className="text-gray-300">Task Title</Label>
              <Input
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                className="bg-[#2C2C2E] border-gray-700 text-white focus:border-[#FF5733] focus:ring-[#FF5733]"
                placeholder="e.g. Thesis Defense"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-gray-300">Deadline</Label>
              <Input
                type="date"
                value={newDeadline}
                onChange={(e) => setNewDeadline(e.target.value)}
                className="bg-[#2C2C2E] border-gray-700 text-white focus:border-[#FF5733] focus:ring-[#FF5733] [color-scheme:dark]"
              />
            </div>

            <Button 
              onClick={handleAddTask} 
              className="w-full bg-[#FF5733] hover:bg-[#C70039] text-white font-bold py-3 text-lg transition-colors"
            >
              Confirm Fate
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}