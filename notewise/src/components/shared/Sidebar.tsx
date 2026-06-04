import {
  FileText,
  Archive,
  Trash2,
  Plus,
  Settings,
  Search,
  ChevronLeft,
  ChevronRight,
  Hash,
  LayoutDashboard,
  LogOut,
  BookOpen
} from 'lucide-react';
import useUIStore from '../../store/uiStore';
import { useNotes } from '../../hooks/useNotes';
import { useCollections } from '../../hooks/useCollections';
import { useTags } from '../../hooks/useTags';

import { useStreaks } from '../../hooks/useStreaks';
import { PomodoroTimer } from './PomodoroTimer';
import { NotificationPrompt } from './NotificationPrompt';

interface SidebarProps {
  onNewNote: () => void;
  activeView: string;
  onViewChange: (view: string) => void;
}

export function Sidebar({ onNewNote, activeView, onViewChange }: SidebarProps) {
  const { sidebarOpen, sidebarWidth, toggleSidebar } = useUIStore();
  const { notes } = useNotes();
  const { collections, createCollection, deleteCollection } = useCollections();
  const { tags, createTag, deleteTag } = useTags();
  const { streak } = useStreaks();

  const activeNoteCount = notes.filter((n) => !n.isArchived && !n.isSoftDeleted).length;
  const archivedCount = notes.filter((n) => n.isArchived && !n.isSoftDeleted).length;
  const trashCount = notes.filter((n) => n.isSoftDeleted).length;

  const handleCreateCollection = () => {
    const name = prompt('Collection Name:');
    if (name) {
      createCollection({ name });
    }
  };

  const handleCreateTag = () => {
    const name = prompt('Tag Name:');
    if (name) {
      createTag({ name });
    }
  };

  return (
    <aside
      className="relative flex flex-col h-full border-r border-edge bg-surface-1 transition-all duration-300 ease-out"
      style={{
        width: sidebarOpen ? `${sidebarWidth}px` : '0px',
        minWidth: sidebarOpen ? `${sidebarWidth}px` : '0px',
        opacity: sidebarOpen ? 1 : 0,
        overflow: 'hidden',
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 pt-4 pb-2 border-b border-edge">
        <div className="flex items-center gap-2">
          <h1 className="text-lg font-display font-bold gradient-text select-none">
            Notewise
          </h1>
          {streak && streak.currentStreak > 0 && (
            <div className="flex items-center gap-1 text-xs font-medium text-orange-500 bg-orange-500/10 px-1.5 py-0.5 rounded-md" title={`Longest Streak: ${streak.longestStreak}`}>
              <span>🔥</span>
              <span>{streak.currentStreak}</span>
            </div>
          )}
        </div>
        <button
          onClick={toggleSidebar}
          className="btn-icon"
          aria-label="Collapse sidebar"
          id="sidebar-toggle"
        >
          <ChevronLeft size={18} />
        </button>
      </div>

      {/* Search */}
      <div className="p-3">
        <button
          onClick={() => onViewChange('search')}
          className="input flex items-center gap-2 text-txt-tertiary cursor-pointer hover:border-brand-400 w-full text-left bg-surface-0 shadow-sm"
          id="sidebar-search-btn"
        >
          <Search size={15} />
          <span className="text-sm">Search notes…</span>
          <kbd className="ml-auto text-2xs bg-surface-2 px-1.5 py-0.5 rounded-md font-mono">
            ⌘K
          </kbd>
        </button>
      </div>

      {/* New Note */}
      <div className="px-3 pb-3">
        <button
          onClick={onNewNote}
          className="btn-primary w-full"
          id="new-note-btn"
        >
          <Plus size={16} />
          New Note
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-2 space-y-0.5 pb-4">
        <p className="text-2xs font-semibold text-txt-tertiary uppercase tracking-wider px-3 pt-3 pb-1">
          Menu
        </p>

        <button
          className={`sidebar-item w-full ${activeView === 'dashboard' ? 'active' : ''}`}
          onClick={() => onViewChange('dashboard')}
          id="nav-dashboard"
        >
          <LayoutDashboard size={18} />
          <span className="flex-1 text-left">Dashboard</span>
        </button>

        <button
          className={`sidebar-item w-full ${activeView === 'reading-list' ? 'active' : ''}`}
          onClick={() => onViewChange('reading-list')}
          id="nav-reading-list"
        >
          <BookOpen size={18} />
          <span className="flex-1 text-left">Reading List</span>
        </button>

        <p className="text-2xs font-semibold text-txt-tertiary uppercase tracking-wider px-3 pt-4 pb-1">
          Notes
        </p>

        <button
          className={`sidebar-item w-full ${activeView === 'all' ? 'active' : ''}`}
          onClick={() => onViewChange('all')}
          id="nav-all-notes"
        >
          <FileText size={18} />
          <span className="flex-1 text-left">All Notes</span>
          <span className="badge">{activeNoteCount}</span>
        </button>

        <button
          className={`sidebar-item w-full ${activeView === 'archive' ? 'active' : ''}`}
          onClick={() => onViewChange('archive')}
          id="nav-archive"
        >
          <Archive size={18} />
          <span className="flex-1 text-left">Archive</span>
          {archivedCount > 0 && <span className="badge">{archivedCount}</span>}
        </button>

        <button
          className={`sidebar-item w-full ${activeView === 'trash' ? 'active' : ''}`}
          onClick={() => onViewChange('trash')}
          id="nav-trash"
        >
          <Trash2 size={18} />
          <span className="flex-1 text-left">Trash</span>
          {trashCount > 0 && <span className="badge">{trashCount}</span>}
        </button>

        {/* Collections */}
        <div className="flex items-center justify-between px-3 pt-5 pb-1">
          <p className="text-2xs font-semibold text-txt-tertiary uppercase tracking-wider">
            Collections
          </p>
          <button onClick={handleCreateCollection} className="text-txt-tertiary hover:text-txt-primary">
            <Plus size={14} />
          </button>
        </div>
        {collections.map((col) => (
          <div key={col.id} className="group flex items-center relative">
            <button
              className={`sidebar-item flex-1 ${activeView === `collection-${col.id}` ? 'active' : ''}`}
              onClick={() => onViewChange(`collection-${col.id}`)}
              id={`nav-collection-${col.id}`}
            >
              <span className="text-base">{col.iconEmoji || '📁'}</span>
              <span className="flex-1 text-left truncate">{col.name}</span>
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); deleteCollection(col.id); }}
              className="absolute right-2 opacity-0 group-hover:opacity-100 p-1 text-txt-tertiary hover:text-status-error transition-opacity"
              title="Delete Collection"
            >
              <Trash2 size={12} />
            </button>
          </div>
        ))}
        {collections.length === 0 && (
          <div className="px-3 py-1 text-xs text-txt-tertiary italic">No collections</div>
        )}

        {/* Tags */}
        <div className="flex items-center justify-between px-3 pt-5 pb-1">
          <p className="text-2xs font-semibold text-txt-tertiary uppercase tracking-wider">
            Tags
          </p>
          <button onClick={handleCreateTag} className="text-txt-tertiary hover:text-txt-primary">
            <Plus size={14} />
          </button>
        </div>
        <div className="flex flex-wrap gap-2 px-3 mt-1">
          {tags.map((tag) => (
            <div key={tag.id} className="group relative flex items-center">
              <button
                onClick={() => onViewChange(`tag-${tag.id}`)}
                className={`badge cursor-pointer hover:bg-brand-500/10 hover:text-brand-600 transition-colors pr-6 ${
                  activeView === `tag-${tag.id}` ? 'bg-brand-500/10 text-brand-600' : ''
                }`}
                style={tag.color ? { borderLeft: `2px solid ${tag.color}` } : undefined}
              >
                <Hash size={10} />
                {tag.name}
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); deleteTag(tag.id); }}
                className="absolute right-1 opacity-0 group-hover:opacity-100 p-0.5 text-txt-tertiary hover:text-status-error transition-opacity"
                title="Delete Tag"
              >
                <Trash2 size={10} />
              </button>
            </div>
          ))}
          {tags.length === 0 && (
            <div className="text-xs text-txt-tertiary italic">No tags</div>
          )}
        </div>
      </nav>

      {/* Notification Prompt (shows once if needed) */}
      <NotificationPrompt />

      {/* Pomodoro Timer */}
      <PomodoroTimer />

      {/* Footer */}
      <div className="px-2 py-3 border-t border-edge flex flex-col gap-1">
        <button
          className="sidebar-item w-full"
          onClick={() => onViewChange('settings')}
          id="nav-settings"
        >
          <Settings size={18} />
          <span className="flex-1 text-left">Settings</span>
        </button>
        <button
          className="sidebar-item w-full text-status-error hover:bg-red-50 dark:hover:bg-red-950/30"
          onClick={async () => {
            const { supabase } = await import('../../lib/supabaseClient');
            await supabase.auth.signOut();
          }}
          id="nav-logout"
        >
          <LogOut size={18} />
          <span className="flex-1 text-left">Sign Out</span>
        </button>
      </div>
    </aside>
  );
}

/** Collapsed sidebar toggle button */
export function SidebarToggle() {
  const { sidebarOpen, toggleSidebar } = useUIStore();

  if (sidebarOpen) return null;

  return (
    <button
      onClick={toggleSidebar}
      className="fixed top-4 left-3 z-50 btn-icon glass shadow-card"
      aria-label="Open sidebar"
      id="sidebar-expand-btn"
    >
      <ChevronRight size={18} />
    </button>
  );
}
