import type { Note } from '../../types';
import { formatRelativeDate, truncate } from '../../utils/noteHelpers';
import { FileText, Trash2, RotateCcw } from 'lucide-react';

interface NoteCardProps {
  note: Note;
  isSelected: boolean;
  onClick: (id: string) => void;
  onDelete?: (id: string) => void;
  onRestore?: (id: string) => void;
  isTrashView?: boolean;
}

export function NoteCard({ note, isSelected, onClick, onDelete, onRestore, isTrashView }: NoteCardProps) {
  const preview = truncate(note.content.replace(/[#*_~`>]/g, ''), 120);

  return (
    <div className={`relative group w-full animate-fade-in ${isSelected ? 'selected' : ''}`}>
      <button
        className="note-card w-full text-left"
        onClick={() => onClick(note.id)}
        id={`note-card-${note.id}`}
      >
      <div className="flex items-start justify-between gap-2 mb-2">
        <h3 className="text-sm font-semibold text-txt-primary line-clamp-1 flex-1">
          {note.title || 'Untitled'}
        </h3>
      </div>

      {preview && (
        <p className="text-xs text-txt-secondary line-clamp-3 mb-3 leading-relaxed">
          {preview}
        </p>
      )}

      <div className="flex items-center gap-2 text-2xs text-txt-tertiary">
        <span>{formatRelativeDate(note.updatedAt)}</span>
        <span className="w-1 h-1 rounded-full bg-txt-tertiary/40" />
        <span>{note.wordCount} words</span>
      </div>
      </button>

      {isTrashView && (
        <div className="absolute top-2 right-2 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
          {onRestore && (
            <button
              onClick={(e) => { e.stopPropagation(); onRestore(note.id); }}
              className="p-1.5 bg-green-100 text-green-600 rounded-md hover:bg-green-200 transition-colors"
              title="Restore Note"
            >
              <RotateCcw size={14} />
            </button>
          )}
          {onDelete && (
            <button
              onClick={(e) => { e.stopPropagation(); onDelete(note.id); }}
              className="p-1.5 bg-red-100 text-red-600 rounded-md hover:bg-red-200 transition-colors"
              title="Permanently Delete"
            >
              <Trash2 size={14} />
            </button>
          )}
        </div>
      )}
    </div>
  );
}

// ─── NoteList ───────────────────────────────────────────────────

interface NoteListProps {
  notes: Note[];
  selectedNoteId: string | null;
  onSelectNote: (id: string) => void;
  onDeleteNote?: (id: string) => void;
  onRestoreNote?: (id: string) => void;
  isTrashView?: boolean;
  viewMode: 'grid' | 'list';
  title: string;
}

export function NoteList({
  notes,
  selectedNoteId,
  onSelectNote,
  onDeleteNote,
  onRestoreNote,
  isTrashView,
  viewMode,
  title,
}: NoteListProps) {
  if (notes.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center gap-4 py-20 animate-fade-in">
        <div className="w-16 h-16 rounded-2xl bg-surface-2 flex items-center justify-center">
          <FileText size={28} className="text-txt-tertiary" />
        </div>
        <div className="text-center">
          <p className="text-sm font-medium text-txt-secondary">No notes yet</p>
          <p className="text-xs text-txt-tertiary mt-1">
            Create your first note to get started
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto p-4">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-display font-semibold text-txt-primary">{title}</h2>
        <span className="badge">{notes.length}</span>
      </div>

      <div
        className={
          viewMode === 'grid'
            ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3'
            : 'flex flex-col gap-2'
        }
      >
        {notes.map((note) => (
          <NoteCard
            key={note.id}
            note={note}
            isSelected={selectedNoteId === note.id}
            onClick={onSelectNote}
            onDelete={onDeleteNote}
            onRestore={onRestoreNote}
            isTrashView={isTrashView}
          />
        ))}
      </div>
    </div>
  );
}
