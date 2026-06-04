import { useState, useMemo, useEffect } from 'react';
import { Sidebar, SidebarToggle } from './components/shared/Sidebar';
import { NoteList } from './components/notes/NoteList';
import { NoteEditor } from './components/notes/NoteEditor';
import { useTheme } from './hooks/useTheme';
import useNotesStore from './store/notesStore';
import useUIStore from './store/uiStore';
import { createEmptyNote, toSnakeCaseNote } from './utils/noteHelpers';
import { useAuth } from './components/auth/AuthProvider';
import { Login } from './components/auth/Login';
import { useOfflineSync } from './hooks/useOfflineSync';
import { useNotes } from './hooks/useNotes';
import { useStreaks } from './hooks/useStreaks';
import { initReminderWorker } from './workers/reminderWorker';
import { Dashboard } from './components/layout/Dashboard';
import { SettingsModal } from './components/shared/SettingsModal';

export default function App() {
  // Initialize theme
  useTheme();
  
  // Setup offline sync engine
  useOfflineSync();

  const { session } = useAuth();
  const { viewMode } = useUIStore();
  const { selectedNoteId, setSelectedNoteId, addNote, addToSyncQueue } = useNotesStore();
  const { updateActivity } = useStreaks();
  const [showSettings, setShowSettings] = useState(false);

  // Initialize background workers and gamification logic
  useEffect(() => {
    if (session) {
      updateActivity();
      const cleanupWorker = initReminderWorker();
      return () => {
        if (cleanupWorker) cleanupWorker();
      };
    }
  }, [session, updateActivity]);

  const [activeView, setActiveView] = useState<string>('dashboard');
  const [searchQuery, setSearchQuery] = useState('');

  // Determine filters for React Query
  const filters = useMemo(() => {
    const f: any = {};
    if (activeView === 'archive') {
      f.archived = true;
    } else if (activeView === 'trash') {
      // client-side
    } else if (activeView.startsWith('collection-')) {
      f.collectionId = activeView.replace('collection-', '');
      f.archived = false;
    } else if (activeView.startsWith('tag-')) {
      f.tags = [activeView.replace('tag-', '')];
      f.archived = false;
    } else {
      f.archived = false;
    }
    return f;
  }, [activeView]);

  const { notes, deleteNote } = useNotes(filters);

  // Derived state: Filtered notes based on active view and search
  const filteredNotes = useMemo(() => {
    let filtered = notes;

    if (activeView === 'trash') {
      filtered = notes.filter((n) => n.isSoftDeleted);
    } else {
      filtered = notes.filter((n) => !n.isSoftDeleted);
    }

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (n) => n.title.toLowerCase().includes(q) || n.content.toLowerCase().includes(q)
      );
    }

    return filtered.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
  }, [notes, activeView, searchQuery]);

  const handleNewNote = () => {
    if (!session) return;
    let collectionId: string | undefined;
    if (activeView.startsWith('collection-')) {
      collectionId = activeView.replace('collection-', '');
    }
    
    // Use actual user ID instead of 'local-user'
    const newNote = createEmptyNote(session.user.id, collectionId);
    addNote(newNote);
    addToSyncQueue({
      action: 'create',
      resourceType: 'note',
      payload: toSnakeCaseNote(newNote),
    });
    setSelectedNoteId(newNote.id);
  };

  const getListTitle = () => {
    if (searchQuery) return 'Search Results';
    if (activeView === 'all') return 'All Notes';
    if (activeView === 'archive') return 'Archive';
    if (activeView === 'trash') return 'Trash';
    if (activeView.startsWith('collection-')) return 'Collection Notes';
    if (activeView.startsWith('tag-')) return 'Tagged Notes';
    return 'Notes';
  };

  if (!session) {
    return (
      <>
        <SidebarToggle />
        <Login />
      </>
    );
  }

  return (
    <div className="flex h-screen bg-surface-0 text-txt-primary overflow-hidden font-sans">
      {showSettings && <SettingsModal onClose={() => setShowSettings(false)} />}
      <SidebarToggle />
      
      <Sidebar
        activeView={activeView}
        onViewChange={(view) => {
          if (view === 'settings') {
            setShowSettings(true);
            return;
          }
          setActiveView(view);
          setSearchQuery('');
          setSelectedNoteId(null);
        }}
        onNewNote={handleNewNote}
      />

      {/* Main Content Area */}
      <main className="flex-1 flex overflow-hidden">
        {selectedNoteId ? (
          <NoteEditor
            noteId={selectedNoteId}
            onBack={() => setSelectedNoteId(null)}
          />
        ) : activeView === 'dashboard' && !searchQuery ? (
          <Dashboard 
            onNewNote={handleNewNote} 
            onSelectNote={(id) => {
              setSelectedNoteId(id);
              setActiveView('all');
            }} 
          />
        ) : (
          <div className="flex-1 flex flex-col h-full animate-fade-in min-w-0">
            {/* Top Bar for Search / Actions */}
            <header className="px-6 py-4 flex items-center justify-between border-b border-edge bg-surface-1">
               <input
                  type="text"
                  placeholder="Search notes..."
                  className="input max-w-md w-full"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
            </header>
            
            <NoteList
              notes={filteredNotes}
              selectedNoteId={selectedNoteId}
              onSelectNote={setSelectedNoteId}
              onDeleteNote={(id) => deleteNote({ id, soft: activeView !== 'trash' })}
              isTrashView={activeView === 'trash'}
              viewMode={viewMode}
              title={getListTitle()}
            />
          </div>
        )}
      </main>
    </div>
  );
}
