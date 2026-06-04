import { useState, useEffect, lazy, Suspense } from 'react';
import { useDebounce } from 'use-debounce';
const MDEditor = lazy(() => import('@uiw/react-md-editor'));
import { ArrowLeft, Archive, Trash2, MoreHorizontal, Clock, Tag, CheckSquare } from 'lucide-react';
import { computeNoteStats, formatRelativeDate } from '../../utils/noteHelpers';
import { useNotes } from '../../hooks/useNotes';
import { useCollections } from '../../hooks/useCollections';
import { useTags } from '../../hooks/useTags';
import { TaskPane } from './TaskPane';

interface NoteEditorProps {
  noteId: string;
  onBack: () => void;
}

export function NoteEditor({ noteId, onBack }: NoteEditorProps) {
  const { notes, updateNote, isUpdating } = useNotes();
  const { collections } = useCollections();
  const { tags, addTagToNote, removeTagFromNote } = useTags();
  const note = notes.find((n) => n.id === noteId);

  const [title, setTitle] = useState(note?.title ?? '');
  const [content, setContent] = useState(note?.content ?? '');
  const [showTasks, setShowTasks] = useState(false);
  
  // Update local state if the note changes externally
  useEffect(() => {
    if (note) {
      setTitle(note.title);
      setContent(note.content);
    }
  }, [noteId]);

  const [debouncedContent] = useDebounce(content, 1000);
  const [debouncedTitle] = useDebounce(title, 1000);

  useEffect(() => {
    if (!note) return;
    
    // Auto-save on debounced change
    if (debouncedContent !== note.content || debouncedTitle !== note.title) {
      const stats = computeNoteStats(debouncedContent);
      updateNote({
        id: noteId,
        updates: {
          content: debouncedContent,
          title: debouncedTitle || 'Untitled',
          wordCount: stats.wordCount,
          charCount: stats.charCount,
          readingTimeMinutes: stats.readingTimeMinutes
        }
      });
    }
  }, [debouncedContent, debouncedTitle, noteId, updateNote, note]);

  const handleArchive = () => {
    if (!note) return;
    updateNote({ id: note.id, updates: { isArchived: !note.isArchived } });
    onBack();
  };

  const handleTrash = () => {
    if (!note) return;
    updateNote({ 
      id: note.id, 
      updates: { isSoftDeleted: true, deletedAt: new Date().toISOString() } 
    });
    onBack();
  };

  if (!note) {
    return (
      <div className="flex-1 flex items-center justify-center text-txt-tertiary animate-fade-in">
        <p>Note not found</p>
      </div>
    );
  }

  const stats = computeNoteStats(content);

  return (
    <div className="flex-1 flex h-full overflow-hidden" data-color-mode="light">
      <div className="flex-1 flex flex-col min-w-0">
        {/* Toolbar */}
        <header className="flex items-center justify-between px-6 py-3 border-b border-edge">
          <div className="flex items-center gap-2">
            <button onClick={onBack} className="btn-icon" id="editor-back-btn">
              <ArrowLeft size={18} />
            </button>
            <div className="flex items-center gap-1.5 text-2xs text-txt-tertiary">
              <Clock size={12} />
              <span>{formatRelativeDate(note.updatedAt)}</span>
            </div>
            {isUpdating && (
              <span className="text-2xs text-brand-500 font-medium animate-fade-in">
                Saving…
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <select
              className="text-xs bg-surface-1 border border-edge rounded px-2 py-1 text-txt-secondary outline-none cursor-pointer"
              value={note.collectionId || ''}
              onChange={(e) => updateNote({ id: note.id, updates: { collectionId: e.target.value || null } })}
            >
              <option value="">No Collection</option>
              {collections.map(c => (
                <option key={c.id} value={c.id}>{c.iconEmoji} {c.name}</option>
              ))}
            </select>
            <div className="w-px h-4 bg-edge mx-1" />
            <button
              onClick={() => setShowTasks(!showTasks)}
              className={`btn-icon ${showTasks ? 'text-brand-500 bg-brand-500/10' : ''}`}
              title="Toggle Tasks"
            >
              <CheckSquare size={16} />
            </button>
            <div className="w-px h-4 bg-edge mx-1" />
            <button
              onClick={handleArchive}
              className="btn-icon"
              title={note.isArchived ? 'Unarchive' : 'Archive'}
              id="editor-archive-btn"
            >
              <Archive size={16} />
            </button>
            <button
              onClick={handleTrash}
              className="btn-icon text-status-error hover:bg-red-50 dark:hover:bg-red-950"
              title="Move to trash"
              id="editor-trash-btn"
            >
              <Trash2 size={16} />
            </button>
            <button className="btn-icon" id="editor-more-btn">
              <MoreHorizontal size={16} />
            </button>
          </div>
        </header>

        {/* Editor body */}
        <div className="flex-1 overflow-y-auto px-6 sm:px-12 md:px-20 py-8 max-w-4xl mx-auto w-full">
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Untitled"
            className="w-full text-3xl font-display font-bold text-txt-primary
                      bg-transparent outline-none border-none placeholder:text-txt-tertiary
                      mb-4"
            id="editor-title-input"
          />

          <div className="prose prose-sm dark:prose-invert max-w-none w-full">
            <Suspense fallback={
              <div className="w-full h-[500px] rounded-lg skeleton flex items-center justify-center">
                <span className="text-txt-tertiary text-sm">Loading editor…</span>
              </div>
            }>
              <MDEditor
                value={content}
                onChange={(val) => setContent(val || '')}
                preview="live"
                hideToolbar={false}
                height={500}
                visibleDragbar={false}
                className="w-full bg-transparent border-none !shadow-none"
              />
            </Suspense>
          </div>
        </div>

        {/* Footer stats */}
        <footer className="flex items-center justify-between px-6 py-2 border-t border-edge text-2xs text-txt-tertiary bg-surface-0">
          <div className="flex items-center gap-3">
            <span>{stats.wordCount} words</span>
            <span className="w-1 h-1 rounded-full bg-txt-tertiary/40" />
            <span>{stats.charCount} characters</span>
            <span className="w-1 h-1 rounded-full bg-txt-tertiary/40" />
            <span>{stats.readingTimeMinutes} min read</span>
          </div>
          <div className="flex items-center gap-2">
            <Tag size={12} />
            <div className="flex items-center gap-1">
              {note.note_tags?.map((nt) => {
                const tag = tags.find((t) => t.id === nt.tag_id);
                if (!tag) return null;
                return (
                  <span
                    key={tag.id}
                    className="bg-brand-500/10 text-brand-600 px-1.5 rounded flex items-center gap-1"
                  >
                    {tag.name}
                    <button
                      onClick={() => removeTagFromNote({ noteId: note.id, tagId: tag.id })}
                      className="hover:text-status-error text-txt-tertiary ml-0.5"
                    >
                      &times;
                    </button>
                  </span>
                );
              })}
              <select
                className="bg-transparent border-none outline-none cursor-pointer text-txt-secondary hover:text-txt-primary ml-1"
                onChange={(e) => {
                  if (e.target.value) {
                    addTagToNote({ noteId: note.id, tagId: e.target.value });
                    e.target.value = ''; // reset after selection
                  }
                }}
              >
                <option value="">+ Add Tag</option>
                {tags
                  .filter((t) => !note.note_tags?.some((nt) => nt.tag_id === t.id))
                  .map((t) => (
                    <option key={t.id} value={t.id}>{t.name}</option>
                  ))}
              </select>
            </div>
          </div>
        </footer>
      </div>

      {/* Side Pane */}
      {showTasks && (
        <TaskPane noteId={noteId} />
      )}
    </div>
  );
}

