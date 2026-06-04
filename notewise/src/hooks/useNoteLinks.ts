import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../components/auth/AuthProvider';

export interface NoteLink {
  id: string;
  sourceNoteId: string;
  targetNoteId: string;
  userId: string;
  createdAt: string;
}

function toFrontendLink(row: Record<string, unknown>): NoteLink {
  return {
    id: row.id as string,
    sourceNoteId: row.source_note_id as string,
    targetNoteId: row.target_note_id as string,
    userId: row.user_id as string,
    createdAt: row.created_at as string,
  };
}

export function useNoteLinks(noteId?: string) {
  const queryClient = useQueryClient();
  const { session } = useAuth();

  const queryKey = ['note-links', noteId];

  const { data: links = [] } = useQuery({
    queryKey,
    queryFn: async () => {
      if (!noteId) return [];

      // Get links where this note is either source or target (backlinks)
      const { data, error } = await supabase
        .from('note_links')
        .select('*')
        .or(`source_note_id.eq.${noteId},target_note_id.eq.${noteId}`);

      if (error) throw error;
      return (data || []).map(toFrontendLink);
    },
    enabled: !!noteId,
  });

  const { mutate: createLink } = useMutation({
    mutationFn: async ({ sourceNoteId, targetNoteId }: { sourceNoteId: string; targetNoteId: string }) => {
      if (!session) throw new Error('Not authenticated');
      const { error } = await supabase.from('note_links').insert([{
        source_note_id: sourceNoteId,
        target_note_id: targetNoteId,
        user_id: session.user.id,
      }]);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['note-links'] });
    },
  });

  const { mutate: deleteLink } = useMutation({
    mutationFn: async (linkId: string) => {
      const { error } = await supabase.from('note_links').delete().eq('id', linkId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['note-links'] });
    },
  });

  // Separate into outgoing and incoming (backlinks)
  const outgoingLinks = links.filter(l => l.sourceNoteId === noteId);
  const backlinks = links.filter(l => l.targetNoteId === noteId);

  return {
    links,
    outgoingLinks,
    backlinks,
    createLink,
    deleteLink,
  };
}

/**
 * Parse [[Note Title]] syntax from content and return matching titles.
 */
export function parseWikiLinks(content: string): string[] {
  const regex = /\[\[([^\]]+)\]\]/g;
  const titles: string[] = [];
  let match: RegExpExecArray | null;
  while ((match = regex.exec(content)) !== null) {
    titles.push(match[1].trim());
  }
  return [...new Set(titles)];
}

/**
 * Hook that provides all note links across all notes for the graph view.
 */
export function useAllNoteLinks() {
  const { data: allLinks = [] } = useQuery({
    queryKey: ['note-links', 'all'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('note_links')
        .select('*');
      if (error) throw error;
      return (data || []).map(toFrontendLink);
    },
  });

  return { allLinks };
}
