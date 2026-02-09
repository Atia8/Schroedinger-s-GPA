import { useState } from "react";
import { Plus, Calendar, TrendingUp } from "lucide-react";
import { mockTasks } from "../data/mockData";

 function TasksPage() {
  // Lock the styles and labels
  const styles = {
    ignored: "bg-gray-500/20 text-gray-400 border-gray-500/30",
    panic: "bg-red-500/20 text-red-400 border-red-500/30",
    done: "bg-green-500/20 text-green-400 border-green-500/30",
    overdue: "bg-orange-500/20 text-orange-400 border-orange-500/30",
  } as const;

  const labels = {
    ignored: "Ignored",
    panic: "Panic Imminent",
    done: "Miraculously Done",
    overdue: "Overdue",
  } as const;

  type Status = keyof typeof styles;

  const [filter, setFilter] = useState<Status | "all">("all");
  const [selectedTask, setSelectedTask] = useState<typeof mockTasks[0] | null>(null);
  const [isAddingTask, setIsAddingTask] = useState(false);

  const getStatusBadge = (status: Status) => {
    return (
      <span className={`px-3 py-1 text-xs border rounded-full ${styles[status]}`}>
        {labels[status]}
      </span>
    );
  };

  const filteredTasks =
    filter === "all" ? mockTasks : mockTasks.filter((task) => task.status === filter);

  const filterOptions = [
    { value: "all", label: "All Tasks" },
    { value: "overdue", label: "Overdue" },
    { value: "ignored", label: "Ignored" },
    { value: "done", label: "Completed" },
    { value: "panic", label: "Panic Mode" },
  ];

  return (
    <div className="min-h-screen bg-background text-white">
      <div className="max-w-7xl mx-auto px-6 py-12">
        {/* Header */}
        <h1 className="text-4xl font-bold mb-2">Avoidance Headquarters</h1>
        <p className="text-gray-400 italic mb-8">
          Your command center for professional procrastination.
        </p>

        <div className="flex gap-6">
          {/* Sidebar */}
          <div className="w-64">
            <div className="border rounded-2xl p-6 sticky top-24">
              <h3 className="font-bold mb-4">Filters</h3>
              {filterOptions.map((option) => (
                <button
                  key={option.value}
                  onClick={() => setFilter(option.value as Status | "all")}
                  className={`block w-full text-left px-4 py-2 rounded-lg mb-2 transition-all ${
                    filter === option.value
                      ? "bg-blue-500/20 text-blue-400 border border-blue-500/30"
                      : "hover:bg-white/5 text-gray-400"
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          {/* Tasks */}
          <div className="flex-1 space-y-4">
            {filteredTasks.map((task) => (
              <div
                key={task.id}
                className="border rounded-2xl p-6 cursor-pointer hover:border-white/20 shadow-lg shadow-black/20"
                onClick={() => setSelectedTask(task)}
              >
                <div className="flex justify-between mb-4">
                  <div>
                    <h3 className="text-xl font-bold">{task.title}</h3>
                    <div className="flex gap-4 text-sm text-gray-400 mt-2">
                      <div className="flex items-center gap-2">
                        <Calendar size={16} />
                        Due: {task.deadline}
                      </div>
                      <div className="flex items-center gap-2">
                        <TrendingUp size={16} />
                        Despair: +{task.despairContribution}
                      </div>
                    </div>
                  </div>
                  {getStatusBadge(task.status as Status)}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Floating Button */}
      <button
        onClick={() => setIsAddingTask(true)}
        className="fixed bottom-8 right-8 bg-blue-500 px-6 py-4 rounded-full flex items-center gap-2 shadow-xl hover:shadow-blue-500/50 transition-all"
      >
        <Plus size={20} />
        Add Task
      </button>

      {/* Simple Add Task Modal */}
      {isAddingTask && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
          <div className="bg-gray-900 p-6 rounded-xl w-96 space-y-4">
            <h2 className="text-xl font-bold">Add Task</h2>
            <input
              placeholder="Task title..."
              className="w-full p-2 rounded bg-gray-800 border border-gray-700 text-white"
            />
            <input
              type="date"
              className="w-full p-2 rounded bg-gray-800 border border-gray-700 text-white"
            />
            <button
              onClick={() => setIsAddingTask(false)}
              className="w-full bg-blue-500 py-2 rounded mt-2"
            >
              Save
            </button>
          </div>
        </div>
      )}

      {/* Simple Task Details Drawer */}
      {selectedTask && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-40">
          <div className="bg-gray-900 p-6 rounded-xl w-2/3 max-w-2xl space-y-6">
            <h2 className="text-2xl font-bold">{selectedTask.title}</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-sm text-gray-400 mb-1">Status</div>
                {getStatusBadge(selectedTask.status as Status)}
              </div>
              <div>
                <div className="text-sm text-gray-400 mb-1">Deadline</div>
                <div>{selectedTask.deadline}</div>
              </div>
              <div>
                <div className="text-sm text-gray-400 mb-1">Despair Contribution</div>
                <div className="text-red-500">+{selectedTask.despairContribution}</div>
              </div>
            </div>
            <div className="space-y-3">
              {selectedTask.npcComments.map((comment, idx) => (
                <div
                  key={idx}
                  className="bg-gray-800 border border-gray-700 rounded-lg p-4 flex items-start gap-3"
                >
                  <div className="text-2xl">
                    {comment.npc === "Hostile Mentor"
                      ? "😤"
                      : comment.npc === "Chaotic Friend"
                      ? "😈"
                      : "😊"}
                  </div>
                  <div>
                    <div className="text-red-500 font-medium mb-1">{comment.npc}</div>
                    <p className="italic text-gray-200">{comment.comment}</p>
                  </div>
                </div>
              ))}
            </div>
            <button className="w-full bg-blue-500 py-2 rounded">Edit Task</button>
            <button
              onClick={() => setSelectedTask(null)}
              className="w-full py-2 border border-gray-700 rounded mt-2 text-gray-400"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default TasksPage;