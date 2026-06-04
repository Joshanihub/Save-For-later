import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabaseClient';
import useNotesStore from '../store/notesStore';
import type { Note } from '../types';

export function useNotes(filters?: {
  collectionId?: string;
  tags?: string[];
  archived?: boolean;
}) {
  const { notes: localNotes } = useNotesStore();
  const queryClient = useQueryClient();

  const queryKey = ['notes', filters];

  // Fetch notes from Supabase
  const { data: serverNotes = [], isLoading, error } = useQuery({
    queryKey,
    queryFn: async () => {
      // Always fetch note_tags so we can display them in the UI
      let query = supabase
        .from('notes')
        .select('*, note_tags(tag_id)')
        .eq('is_soft_deleted', false);

      if (filters?.collectionId) {
        query = query.eq('collection_id', filters.collectionId);
      }
      if (filters?.archived !== undefined) {
        query = query.eq('is_archived', filters.archived);
      }
      if (filters?.tags && filters.tags.length > 0) {
        query = query.in('note_tags.tag_id', filters.tags);
      }

      const { data, error } = await query.order('updated_at', { ascending: false });
      
      if (error) throw error;
      return data as unknown as Note[];
    }
  });

  // Create note mutation
  const { mutate: createNote, isPending: isCreating } = useMutation({
    mutationFn: async (noteData: Partial<Note>) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('notes')
        .insert([{
          ...noteData,
          user_id: user.id
        }])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onMutate: async (newNote) => {
      // Optimistic update in Zustand
      useNotesStore.getState().addNote(newNote as Note);

      // Queue for offline sync
      useNotesStore.getState().addToSyncQueue({
        action: 'create',
        resourceType: 'note',
        payload: newNote as Record<string, unknown>
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notes'] });
    }
  });

  // Update note mutation
  const { mutate: updateNote, isPending: isUpdating } = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<Note> }) => {
      const { data, error } = await supabase
        .from('notes')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onMutate: ({ id, updates }) => {
      useNotesStore.getState().updateNote(id, updates);
      useNotesStore.getState().addToSyncQueue({
        action: 'update',
        resourceType: 'note',
        resourceId: id,
        payload: updates as Record<string, unknown>
      });
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
      useNotesStore.getState().addToSyncQueue({
        action: 'delete',
        resourceType: 'note',
        resourceId: id,
        payload: { is_soft_deleted: true, deleted_at: new Date().toISOString() }
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notes'] });
    }
  });

  // When offline or waiting for sync, localNotes in Zustand is the source of truth for optimistic updates.
  // In a full implementation we would merge `serverNotes` and `localNotes` based on `updatedAt`.
  // For the MVP, we can rely on Zustand as the source of truth if `serverNotes` is empty, or merge them.
  const displayNotes = localNotes.length > 0 ? localNotes : serverNotes;

  return {
    notes: displayNotes,
    serverNotes,
    isLoading,
    error,
    createNote,
    isCreating,
    updateNote,
    isUpdating,
    deleteNote
  };
}
