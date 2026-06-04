import React, { useState } from 'react';
import { useTasks } from '../../hooks/useTasks';
import { CheckCircle2, Circle, Plus, Trash2 } from 'lucide-react';

interface TaskPaneProps {
  noteId: string;
}

export function TaskPane({ noteId }: TaskPaneProps) {
  const { tasks, createTask, updateTask, deleteTask } = useTasks(noteId);
  const [newTaskTitle, setNewTaskTitle] = useState('');

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;
    createTask({ noteId, title: newTaskTitle.trim() });
    setNewTaskTitle('');
  };

  return (
    <div className="flex flex-col h-full bg-surface-1 border-l border-edge w-64 shrink-0 overflow-hidden">
      <div className="p-3 border-b border-edge bg-surface-0 flex items-center justify-between">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-txt-tertiary">
          Tasks
        </h3>
        <span className="text-2xs bg-surface-2 px-1.5 rounded-full text-txt-tertiary">
          {tasks.filter(t => t.isCompleted).length}/{tasks.length}
        </span>
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {tasks.map((task) => (
          <div key={task.id} className="flex items-start gap-2 group">
            <button
              onClick={() => updateTask({ id: task.id, updates: { isCompleted: !task.isCompleted } })}
              className={`mt-0.5 shrink-0 transition-colors ${task.isCompleted ? 'text-brand-500' : 'text-txt-tertiary hover:text-brand-400'}`}
            >
              {task.isCompleted ? <CheckCircle2 size={16} /> : <Circle size={16} />}
            </button>
            <div className="flex-1 flex flex-col min-w-0">
              <span className={`text-sm line-clamp-2 break-words ${task.isCompleted ? 'line-through text-txt-tertiary' : 'text-txt-primary'}`}>
                {task.title}
              </span>
              {task.recurrence && (
                <span className="text-2xs text-brand-500 font-medium">
                  ↻ {task.recurrence}
                </span>
              )}
            </div>
            <button
              onClick={() => deleteTask(task.id)}
              className="opacity-0 group-hover:opacity-100 text-txt-tertiary hover:text-status-error transition-opacity mt-0.5 shrink-0"
            >
              <Trash2 size={14} />
            </button>
          </div>
        ))}
        {tasks.length === 0 && (
          <p className="text-xs text-txt-tertiary italic text-center mt-4">
            No tasks yet.
          </p>
        )}
      </div>

      <div className="p-3 border-t border-edge bg-surface-0 flex flex-col gap-2">
        <form onSubmit={handleCreate} className="flex flex-col gap-2">
          <input
            type="text"
            value={newTaskTitle}
            onChange={(e) => setNewTaskTitle(e.target.value)}
            placeholder="Add a task..."
            className="input flex-1 text-sm py-1.5 px-2 w-full"
          />
          <div className="flex items-center gap-2">
            <select
              className="text-xs bg-surface-1 border border-edge rounded px-2 py-1 flex-1 text-txt-secondary outline-none"
              defaultValue=""
              id="new-task-recurrence"
            >
              <option value="">No recurrence</option>
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
              <option value="monthly">Monthly</option>
            </select>
            <button
              type="submit"
              disabled={!newTaskTitle.trim()}
              className="btn-icon bg-brand-500 text-white hover:bg-brand-600 disabled:opacity-50 disabled:bg-surface-2 disabled:text-txt-tertiary"
              onClick={(e) => {
                e.preventDefault();
                const rec = (document.getElementById('new-task-recurrence') as HTMLSelectElement).value;
                if (!newTaskTitle.trim()) return;
                createTask({ noteId, title: newTaskTitle.trim(), recurrence: rec || null });
                setNewTaskTitle('');
              }}
            >
              <Plus size={16} />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
