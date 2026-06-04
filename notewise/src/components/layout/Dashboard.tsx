import { Plus, Clock, CheckCircle2, Calendar } from 'lucide-react';
import { useAuth } from '../auth/AuthProvider';
import { useNotes } from '../../hooks/useNotes';
import { useStreaks } from '../../hooks/useStreaks';
import { useTasks } from '../../hooks/useTasks';
import { formatRelativeDate } from '../../utils/noteHelpers';

interface DashboardProps {
  onNewNote: () => void;
  onSelectNote: (id: string) => void;
}

export function Dashboard({ onNewNote, onSelectNote }: DashboardProps) {
  const { session } = useAuth();
  const { notes } = useNotes();
  const { streak } = useStreaks();
  // Fetch global tasks (no noteId filter) if our hook supported it. 
  // Currently useTasks(undefined) fetches all tasks.
  const { tasks } = useTasks(); 

  const recentNotes = notes
    .filter(n => !n.isArchived && !n.isSoftDeleted)
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
    .slice(0, 5);

  const upcomingTasks = tasks
    .filter(t => !t.isCompleted)
    .sort((a, b) => {
      if (!a.dueDate) return 1;
      if (!b.dueDate) return -1;
      return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
    })
    .slice(0, 5);

  const greeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  const displayName = session?.user?.email?.split('@')[0] || 'User';

  return (
    <div className="flex-1 overflow-y-auto bg-surface-0 animate-fade-in pb-12">
      <div className="max-w-5xl mx-auto px-8 py-12">
        {/* Header Section */}
        <header className="mb-12 flex items-end justify-between">
          <div>
            <h1 className="text-4xl font-display font-bold text-txt-primary tracking-tight mb-2">
              {greeting()}, {displayName}
            </h1>
            <p className="text-txt-tertiary">
              Here's an overview of your productivity today.
            </p>
          </div>
          {streak && streak.currentStreak > 0 && (
            <div className="flex flex-col items-end bg-surface-1 px-5 py-3 rounded-2xl border border-edge shadow-sm">
              <span className="text-2xs font-semibold uppercase tracking-wider text-txt-tertiary mb-1">
                Current Streak
              </span>
              <div className="flex items-center gap-2 text-orange-500 font-display">
                <span className="text-2xl">🔥</span>
                <span className="text-3xl font-bold">{streak.currentStreak}</span>
                <span className="text-sm font-medium self-end mb-1">days</span>
              </div>
            </div>
          )}
        </header>

        {/* Action Row */}
        <div className="flex items-center gap-4 mb-12">
          <button onClick={onNewNote} className="btn-primary py-3 px-6 text-base shadow-glow-sm hover:shadow-glow-md transition-all">
            <Plus size={20} />
            Create New Note
          </button>
        </div>

        {/* Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Recent Notes */}
          <section className="bg-surface-1 rounded-3xl border border-edge p-6 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-txt-primary flex items-center gap-2">
                <Clock size={18} className="text-brand-500" />
                Recent Notes
              </h2>
            </div>
            
            <div className="flex flex-col gap-2">
              {recentNotes.length > 0 ? (
                recentNotes.map(note => (
                  <div 
                    key={note.id}
                    onClick={() => onSelectNote(note.id)}
                    className="group flex flex-col p-4 rounded-2xl bg-surface-0 border border-edge hover:border-brand-300 cursor-pointer transition-all"
                  >
                    <h3 className="font-medium text-txt-primary group-hover:text-brand-600 truncate mb-1">
                      {note.title}
                    </h3>
                    <p className="text-xs text-txt-tertiary">
                      Edited {formatRelativeDate(note.updatedAt)}
                    </p>
                  </div>
                ))
              ) : (
                <div className="p-8 text-center text-txt-tertiary bg-surface-0 rounded-2xl border border-edge border-dashed">
                  No recent notes found.
                </div>
              )}
            </div>
          </section>

          {/* Upcoming Tasks */}
          <section className="bg-surface-1 rounded-3xl border border-edge p-6 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-txt-primary flex items-center gap-2">
                <CheckCircle2 size={18} className="text-green-500" />
                Upcoming Tasks
              </h2>
            </div>

            <div className="flex flex-col gap-2">
              {upcomingTasks.length > 0 ? (
                upcomingTasks.map(task => (
                  <div 
                    key={task.id}
                    onClick={() => onSelectNote(task.noteId)}
                    className="group flex items-center justify-between p-4 rounded-2xl bg-surface-0 border border-edge hover:border-green-300 cursor-pointer transition-all"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-5 h-5 rounded-full border-2 border-edge group-hover:border-green-400" />
                      <span className="font-medium text-txt-primary">{task.title}</span>
                    </div>
                    {task.dueDate && (
                      <div className="flex items-center gap-1.5 text-xs text-txt-tertiary bg-surface-2 px-2 py-1 rounded-md">
                        <Calendar size={12} />
                        {new Date(task.dueDate).toLocaleDateString()}
                      </div>
                    )}
                  </div>
                ))
              ) : (
                <div className="p-8 text-center text-txt-tertiary bg-surface-0 rounded-2xl border border-edge border-dashed">
                  You're all caught up!
                </div>
              )}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
