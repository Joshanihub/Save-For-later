import React, { useState } from 'react';
import { useReminders } from '../../hooks/useReminders';
import { Bell, Trash2, Plus, Clock } from 'lucide-react';
import { formatRelativeDate } from '../../utils/noteHelpers';

interface ReminderPaneProps {
  noteId: string;
}

export function ReminderPane({ noteId }: ReminderPaneProps) {
  const { reminders, createReminder, deleteReminder } = useReminders(noteId);
  const [message, setMessage] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [dueTime, setDueTime] = useState('');

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim() || !dueDate || !dueTime) return;
    
    // Combine date and time
    const nextDueAt = new Date(`${dueDate}T${dueTime}`).toISOString();
    
    createReminder({ noteId, message: message.trim(), nextDueAt });
    setMessage('');
    setDueDate('');
    setDueTime('');
  };

  return (
    <div className="flex flex-col h-full bg-surface-1 border-l border-edge w-72 shrink-0 overflow-hidden">
      <div className="p-3 border-b border-edge bg-surface-0 flex items-center justify-between">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-txt-tertiary flex items-center gap-2">
          <Bell size={14} /> Reminders
        </h3>
        <span className="text-2xs bg-surface-2 px-1.5 rounded-full text-txt-tertiary">
          {reminders.length}
        </span>
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {reminders.map((reminder) => (
          <div key={reminder.id} className="p-2 bg-surface-0 border border-edge rounded-md group relative">
            <p className="text-sm text-txt-primary pr-6">{reminder.message}</p>
            <div className="flex items-center gap-1 mt-2 text-xs text-txt-tertiary">
              <Clock size={12} />
              <span>{formatRelativeDate(reminder.nextDueAt)}</span>
            </div>
            <button
              onClick={() => deleteReminder(reminder.id)}
              className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 text-txt-tertiary hover:text-status-error transition-opacity"
            >
              <Trash2 size={14} />
            </button>
          </div>
        ))}
        {reminders.length === 0 && (
          <p className="text-xs text-txt-tertiary italic text-center mt-4">
            No reminders set.
          </p>
        )}
      </div>

      <div className="p-3 border-t border-edge bg-surface-0">
        <form onSubmit={handleCreate} className="flex flex-col gap-2">
          <input
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Reminder message..."
            className="input text-sm py-1.5 px-2 w-full"
            required
          />
          <div className="flex gap-2">
            <input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="input text-xs py-1 px-2 flex-1"
              required
            />
            <input
              type="time"
              value={dueTime}
              onChange={(e) => setDueTime(e.target.value)}
              className="input text-xs py-1 px-2 flex-1"
              required
            />
          </div>
          <button type="submit" disabled={!message.trim() || !dueDate || !dueTime} className="btn-primary w-full mt-1">
            <Plus size={16} /> Add Reminder
          </button>
        </form>
      </div>
    </div>
  );
}
