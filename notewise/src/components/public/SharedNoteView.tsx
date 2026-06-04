import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { computeNoteStats, formatRelativeDate } from '../../utils/noteHelpers';
import MDEditor from '@uiw/react-md-editor';
import { Clock } from 'lucide-react';

export function SharedNoteView() {
  const [note, setNote] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchNote = async () => {
      // Very simplistic router parsing: e.g. /share/some-token
      const pathParts = window.location.pathname.split('/');
      const token = pathParts[pathParts.length - 1];

      if (!token) {
        setError("Invalid link.");
        setLoading(false);
        return;
      }

      try {
        // Step 1: Find the share link
        const { data: linkData, error: linkError } = await supabase
          .from('share_links')
          .select('*')
          .eq('access_token', token)
          .single();

        if (linkError || !linkData) {
          throw new Error("This link is invalid or has expired.");
        }

        if (linkData.expires_at && new Date(linkData.expires_at) < new Date()) {
          throw new Error("This link has expired.");
        }

        // Step 2: Fetch the note
        const { data: noteData, error: noteError } = await supabase
          .from('notes')
          .select('title, content, updated_at')
          .eq('id', linkData.note_id)
          .single();

        if (noteError || !noteData) {
          throw new Error("Note not found or inaccessible.");
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
          <h2 className="text-xl font-bold text-status-error mb-2">Error</h2>
          <p className="text-txt-tertiary">{error}</p>
        </div>
      </div>
    );
  }

  const stats = computeNoteStats(note.content);

  return (
    <div className="flex flex-col h-screen bg-surface-0 text-txt-primary overflow-hidden font-sans" data-color-mode="light">
      {/* Header */}
      <header className="flex items-center justify-between px-8 py-4 border-b border-edge bg-surface-1">
        <div className="flex items-center gap-2">
          <h1 className="text-lg font-display font-bold gradient-text select-none">
            Notewise
          </h1>
          <span className="text-xs bg-surface-2 px-2 py-0.5 rounded text-txt-tertiary">Public View</span>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-txt-tertiary">
          <Clock size={14} />
          <span>Last updated {formatRelativeDate(note.updated_at)}</span>
        </div>
      </header>

      {/* Editor body (Read only) */}
      <div className="flex-1 overflow-y-auto px-6 sm:px-12 md:px-20 py-8 max-w-4xl mx-auto w-full">
        <h1 className="w-full text-4xl font-display font-bold text-txt-primary mb-8">
          {note.title || 'Untitled'}
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
