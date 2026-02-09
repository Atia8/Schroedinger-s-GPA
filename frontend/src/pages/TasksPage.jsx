import { useState,useEffect } from 'react';
import { Plus,X } from 'lucide-react';
import { mockTasks } from '../data/mockData';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../components/ui/dialog';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Button } from '../components/ui/button';


export default function TasksPage() {

  // ✅ Store tasks in state (IMPORTANT)
  const [tasks, setTasks] = useState([]);

  const [isAddingTask, setIsAddingTask] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDeadline, setNewDeadline] = useState('');

  // ✅ Function that actually adds the task
  // const handleAddTask = () => {
  //   if (!newTitle || !newDeadline) return;

  //   const newTask = {
  //     id: Date.now(),
  //     title: newTitle,
  //     deadline: newDeadline,
  //     despairContribution: 5,
  //     status: 'panic',
  //     npcComments: []
  //   };

  //   setTasks([newTask, ...tasks]);

  //   // reset fields
  //   setNewTitle('');
  //   setNewDeadline('');
  //   setIsAddingTask(false);
  // };

const handleAddTask = async () => {

  if (!newTitle || !newDeadline) return;

  try {
    const res = await fetch('http://localhost:5000/api/tasks', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        title: newTitle,
        deadline: newDeadline
      })
    });

    const data = await res.json();

    setTasks([data, ...tasks]);

    setNewTitle('');
    setNewDeadline('');
    setIsAddingTask(false);

  } catch (err) {
    console.log(err);
  }
}; 

useEffect(() => {
  fetch('http://localhost:5000/api/tasks')
    .then(res => res.json())
    .then(data => setTasks(data));
}, []);





  return (
    <>
      {/* Floating Add Button */}
      <button
        onClick={() => setIsAddingTask(true)}
        className="fixed bottom-8 right-8 bg-gradient-to-r from-[#00d4ff] to-[#9d4edd] text-white px-6 py-4 rounded-full flex items-center gap-3 font-bold"
      >
        <Plus size={24} />
        Add Task
      </button>

      {/* Modal */}
      <Dialog open={isAddingTask} onOpenChange={setIsAddingTask}>
        <DialogContent>
          <button
    onClick={() => setIsAddingTask(false)}
    className="absolute top-4 right-4 text-gray-500 hover:text-black"
  >
    <X size={20} />
  </button>
          <DialogHeader>
            <DialogTitle>Add New Task</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div>
              <Label>Task Title</Label>
              <Input
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
              />
            </div>

            <div>
              <Label>Deadline</Label>
              <Input
                type="date"
                value={newDeadline}
                onChange={(e) => setNewDeadline(e.target.value)}
              />
            </div>

            <Button onClick={handleAddTask}>
              Add Task
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
