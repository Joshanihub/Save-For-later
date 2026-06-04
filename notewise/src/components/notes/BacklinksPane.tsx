import { useNoteLinks, parseWikiLinks } from '../../hooks/useNoteLinks';
import { useNotes } from '../../hooks/useNotes';
import { Link, ArrowRight, X } from 'lucide-react';
import { useEffect, useMemo } from 'react';

interface BacklinksPaneProps {
  noteId: string;
  content: string;
  onNavigateToNote: (id: string) => void;
}

export function BacklinksPane({ noteId, content, onNavigateToNote }: BacklinksPaneProps) {
  const { backlinks, outgoingLinks, createLink } = useNoteLinks(noteId);
  const { notes } = useNotes();

  // Parse [[wiki links]] from content and auto-create links
  const wikiLinkTitles = useMemo(() => parseWikiLinks(content), [content]);

  useEffect(() => {
    if (wikiLinkTitles.length === 0) return;

    for (const title of wikiLinkTitles) {
      const targetNote = notes.find(
        (n) => n.title.toLowerCase() === title.toLowerCase() && n.id !== noteId
      );
      if (targetNote) {
        // Check if link already exists
        const exists = outgoingLinks.some((l) => l.targetNoteId === targetNote.id);
        if (!exists) {
          createLink({ sourceNoteId: noteId, targetNoteId: targetNote.id });
        }
      }
    }
  }, [wikiLinkTitles, notes, noteId, outgoingLinks, createLink]);

  // Resolve backlink note titles
  const backlinkNotes = useMemo(() => {
    return backlinks
      .map((bl) => {
        const note = notes.find((n) => n.id === bl.sourceNoteId);
        return note ? { linkId: bl.id, note } : null;
      })
      .filter(Boolean) as { linkId: string; note: typeof notes[0] }[];
  }, [backlinks, notes]);

  const outgoingNotes = useMemo(() => {
    return outgoingLinks
      .map((ol) => {
        const note = notes.find((n) => n.id === ol.targetNoteId);
        return note ? { linkId: ol.id, note } : null;
      })
      .filter(Boolean) as { linkId: string; note: typeof notes[0] }[];
  }, [outgoingLinks, notes]);

  if (backlinkNotes.length === 0 && outgoingNotes.length === 0 && wikiLinkTitles.length === 0) {
    return (
      <div className="px-6 py-4 border-t border-edge">
        <div className="flex items-center gap-2 text-xs text-txt-tertiary">
          <Link size={12} />
          <span>No linked notes. Use <code className="bg-surface-1 px-1 rounded">[[Note Title]]</code> to create links.</span>
        </div>
      </div>
    );
  }

  return (
    <div className="px-6 py-4 border-t border-edge space-y-4 animate-fade-in">
      {/* Backlinks (notes that link TO this note) */}
      {backlinkNotes.length > 0 && (
        <div>
          <h4 className="text-xs font-semibold text-txt-tertiary uppercase tracking-wider mb-2 flex items-center gap-1.5">
            <ArrowRight size={12} className="rotate-180" />
            Backlinks ({backlinkNotes.length})
          </h4>
          <div className="flex flex-col gap-1">
            {backlinkNotes.map(({ note }) => (
              <button
                key={note.id}
                onClick={() => onNavigateToNote(note.id)}
                className="text-left text-sm text-brand-600 hover:text-brand-700 hover:bg-brand-500/5 px-2 py-1.5 rounded-lg transition-colors truncate"
              >
                {note.title || 'Untitled'}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Outgoing links (notes this note links TO) */}
      {outgoingNotes.length > 0 && (
        <div>
          <h4 className="text-xs font-semibold text-txt-tertiary uppercase tracking-wider mb-2 flex items-center gap-1.5">
            <ArrowRight size={12} />
            Outgoing Links ({outgoingNotes.length})
          </h4>
          <div className="flex flex-col gap-1">
            {outgoingNotes.map(({ note }) => (
              <button
                key={note.id}
                onClick={() => onNavigateToNote(note.id)}
                className="text-left text-sm text-brand-600 hover:text-brand-700 hover:bg-brand-500/5 px-2 py-1.5 rounded-lg transition-colors truncate"
              >
                {note.title || 'Untitled'}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Unresolved wiki links */}
      {wikiLinkTitles.filter(t => !notes.some(n => n.title.toLowerCase() === t.toLowerCase())).length > 0 && (
        <div>
          <h4 className="text-xs font-semibold text-txt-tertiary uppercase tracking-wider mb-2">
            Unresolved Links
          </h4>
          <div className="flex flex-wrap gap-1.5">
            {wikiLinkTitles
              .filter(t => !notes.some(n => n.title.toLowerCase() === t.toLowerCase()))
              .map((t) => (
                <span key={t} className="text-xs px-2 py-1 bg-orange-500/10 text-orange-600 rounded border border-orange-500/20">
                  {t}
                </span>
              ))}
          </div>
        </div>
      )}
    </div>
  );
}
