import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabaseClient';
import useNotesStore from '../store/notesStore';
import type { Note } from '../types';

/** Maps a Supabase row (snake_case) to a frontend Note (camelCase) */
function toFrontendNote(row: Record<string, unknown>): Note {
  return {
    id: row.id as string,
    userId: row.user_id as string,
    collectionId: (row.collection_id as string) ?? null,
    title: row.title as string,
    content: row.content as string,
    wordCount: (row.word_count as number) ?? 0,
    charCount: (row.char_count as number) ?? 0,
    readingTimeMinutes: (row.reading_time_minutes as number) ?? 0,
    isArchived: (row.is_archived as boolean) ?? false,
    isSoftDeleted: (row.is_soft_deleted as boolean) ?? false,
    deletedAt: (row.deleted_at as string) ?? null,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
    syncedAt: (row.synced_at as string) ?? row.updated_at as string,
    note_tags: row.note_tags as { tag_id: string }[] | undefined,
  };
}

/** Maps camelCase update fields to snake_case for Supabase */
function toSnakeCaseUpdates(updates: Partial<Note>): Record<string, unknown> {
  const mapped: Record<string, unknown> = {};
  if (updates.title !== undefined) mapped.title = updates.title;
  if (updates.content !== undefined) mapped.content = updates.content;
  if (updates.collectionId !== undefined) mapped.collection_id = updates.collectionId;
  if (updates.wordCount !== undefined) mapped.word_count = updates.wordCount;
  if (updates.charCount !== undefined) mapped.char_count = updates.charCount;
  if (updates.readingTimeMinutes !== undefined) mapped.reading_time_minutes = updates.readingTimeMinutes;
  if (updates.isArchived !== undefined) mapped.is_archived = updates.isArchived;
  if (updates.isSoftDeleted !== undefined) mapped.is_soft_deleted = updates.isSoftDeleted;
  if (updates.deletedAt !== undefined) mapped.deleted_at = updates.deletedAt;
  mapped.updated_at = new Date().toISOString();
  return mapped;
}

export function useNotes(filters?: {
  collectionId?: string;
  tags?: string[];
  archived?: boolean;
}) {
  const queryClient = useQueryClient();

  const queryKey = ['notes', filters];

  // Fetch notes from Supabase
  const { data: serverNotes = [], isLoading, error } = useQuery({
    queryKey,
    queryFn: async () => {
      let query = supabase
        .from('notes')
        .select('*, note_tags(tag_id)');

      // For trash view we need soft-deleted notes; for everything else exclude them
      if (filters?.archived === undefined && filters?.collectionId === undefined && !filters?.tags?.length) {
        // Default: could be "all" or "trash" — fetch everything and let client filter
        // Don't filter is_soft_deleted here so trash view works
      } else {
        query = query.eq('is_soft_deleted', false);
      }

      if (filters?.collectionId) {
        query = query.eq('collection_id', filters.collectionId);
      }
      if (filters?.archived !== undefined) {
        query = query.eq('is_archived', filters.archived);
      }

      const { data, error } = await query.order('updated_at', { ascending: false });
      
      if (error) throw error;

      // If filtering by tag, we need to filter on the client side since
      // Supabase .in() on a joined table doesn't filter the parent rows
      let notes = (data || []).map(toFrontendNote);

      if (filters?.tags && filters.tags.length > 0) {
        notes = notes.filter((n) => 
          n.note_tags?.some((nt) => filters.tags!.includes(nt.tag_id))
        );
      }

      return notes;
    }
  });

  // Update note mutation
  const { mutate: updateNote, isPending: isUpdating } = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<Note> }) => {
      const snakeUpdates = toSnakeCaseUpdates(updates);

      const { data, error } = await supabase
        .from('notes')
        .update(snakeUpdates)
        .eq('id', id)
        .select('*, note_tags(tag_id)')
        .single();

      if (error) throw error;
      return toFrontendNote(data);
    },
    onMutate: ({ id, updates }) => {
      // Optimistic update in Zustand local store
      useNotesStore.getState().updateNote(id, updates);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notes'] });
    }
  });

  // Delete note mutation
  const { mutate: deleteNote } = useMutation({
    mutationFn: async ({ id, soft = true }: { id: string; soft?: boolean }) => {
      if (soft) {
        await supabase
          .from('notes')
          .update({ is_soft_deleted: true, deleted_at: new Date().toISOString() })
          .eq('id', id);
      } else {
        await supabase
          .from('notes')
          .delete()
          .eq('id', id);
      }
    },
    onMutate: ({ id }) => {
      useNotesStore.getState().removeNote(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notes'] });
    }
  });

  // Use server notes as primary source of truth. Fall back to local store only
  // when server data hasn't loaded yet (e.g. offline / first render).
  const notes = serverNotes.length > 0 || !isLoading ? serverNotes : useNotesStore.getState().notes;

  return {
    notes,
    serverNotes,
    isLoading,
    error,
    updateNote,
    isUpdating,
    deleteNote
  };
}

