import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabaseClient';
import type { Tag } from '../types';

export function useTags() {
  const queryClient = useQueryClient();
  const queryKey = ['tags'];

  const { data: tags = [], isLoading, error } = useQuery({
    queryKey,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('tags')
        .select('*')
        .order('name', { ascending: true });

      if (error) throw error;
      
      return data.map((t) => ({
        id: t.id,
        userId: t.user_id,
        name: t.name,
        color: t.color,
        isCustom: t.is_custom,
        createdAt: t.created_at,
      })) as Tag[];
    }
  });

  const { mutate: createTag, isPending: isCreating } = useMutation({
    mutationFn: async (tagData: Partial<Tag>) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('tags')
        .insert([{
          name: tagData.name,
          color: tagData.color || '#3B82F6',
          user_id: user.id
        }])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
    }
  });

  const { mutate: updateTag, isPending: isUpdating } = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<Tag> }) => {
      const { data, error } = await supabase
        .from('tags')
        .update({
          name: updates.name,
          color: updates.color,
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
    }
  });

  const { mutate: deleteTag } = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('tags')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
    }
  });

  const { mutate: addTagToNote } = useMutation({
    mutationFn: async ({ noteId, tagId }: { noteId: string; tagId: string }) => {
      const { error } = await supabase
        .from('note_tags')
        .insert([{ note_id: noteId, tag_id: tagId }]);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notes'] });
    }
  });

  const { mutate: removeTagFromNote } = useMutation({
    mutationFn: async ({ noteId, tagId }: { noteId: string; tagId: string }) => {
      const { error } = await supabase
        .from('note_tags')
        .delete()
        .eq('note_id', noteId)
        .eq('tag_id', tagId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notes'] });
    }
  });

  return {
    tags,
    isLoading,
    error,
    createTag,
    isCreating,
    updateTag,
    isUpdating,
    deleteTag,
    addTagToNote,
    removeTagFromNote
  };
}
