import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { computeNoteStats, formatRelativeDate } from '../../utils/noteHelpers';
import MDEditor from '@uiw/react-md-editor';
import { Clock } from 'lucide-react';

export function PublicNoteView() {
  const [note, setNote] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchNote = async () => {
      const pathParts = window.location.pathname.split('/');
      const slug = pathParts[pathParts.length - 1];

      if (!slug) {
        setError("Invalid link.");
        setLoading(false);
        return;
      }

      try {
        const { data: noteData, error: noteError } = await supabase
          .from('notes')
          .select('title, content, updated_at, is_public, public_slug')
          .eq('public_slug', slug)
          .single();

        if (noteError || !noteData) {
          throw new Error("Note not found.");
        }

        if (!noteData.is_public) {
          throw new Error("This note is no longer public.");
        }

        setNote(noteData);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchNote();
  }, []);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-surface-0">
        <p className="text-txt-tertiary">Loading note...</p>
      </div>
    );
  }

  if (error || !note) {
    return (
      <div className="flex h-screen items-center justify-center bg-surface-0">
        <div className="text-center">
          <h2 className="text-xl font-bold text-status-error mb-2">Note Not Found</h2>
          <p className="text-txt-tertiary">{error}</p>
        </div>
      </div>
    );
  }

  const stats = computeNoteStats(note.content);

  return (
    <div className="flex flex-col h-screen bg-surface-0 text-txt-primary overflow-hidden font-sans" data-color-mode="light">
      <header className="flex items-center justify-between px-8 py-4 border-b border-edge bg-surface-1">
        <div className="flex items-center gap-2">
          <h1 className="text-lg font-display font-bold gradient-text select-none">
            Notewise
          </h1>
          <span className="text-xs bg-brand-500/10 text-brand-600 px-2 py-0.5 rounded font-medium border border-brand-500/20">Published</span>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-txt-tertiary">
          <Clock size={14} />
          <span>Last updated {formatRelativeDate(note.updated_at)}</span>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto px-6 sm:px-12 md:px-20 py-8 max-w-4xl mx-auto w-full">
        <h1 className="w-full text-4xl font-display font-bold text-txt-primary mb-8">
          {note.title || 'Untitled Note'}
        </h1>

        <div className="prose prose-sm dark:prose-invert max-w-none w-full pointer-events-none">
          <MDEditor.Markdown source={note.content} className="bg-transparent" />
        </div>
      </div>

      <footer className="flex items-center justify-center px-6 py-4 border-t border-edge text-xs text-txt-tertiary bg-surface-0 gap-3">
        <span>{stats.wordCount} words</span>
        <span className="w-1 h-1 rounded-full bg-txt-tertiary/40" />
        <span>{stats.charCount} characters</span>
        <span className="w-1 h-1 rounded-full bg-txt-tertiary/40" />
        <span>{stats.readingTimeMinutes} min read</span>
      </footer>
    </div>
  );
}
