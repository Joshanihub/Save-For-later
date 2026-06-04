import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabaseClient';
import type { Comment } from '../types';

export function useComments(noteId?: string) {
  const queryClient = useQueryClient();
  const queryKey = ['comments', noteId];

  const { data: comments = [], isLoading } = useQuery({
    queryKey,
    queryFn: async () => {
      if (!noteId) return [];
      
      const { data, error } = await supabase
        .from('comments')
        .select(`
          id,
          note_id,
          author_user_id,
          content,
          created_at,
          updated_at
        `)
        .eq('note_id', noteId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      
      return data.map((c) => ({
        id: c.id,
        noteId: c.note_id,
        userId: c.author_user_id,
        content: c.content,
        createdAt: c.created_at,
        updatedAt: c.updated_at,
      })) as Comment[];
    },
    enabled: !!noteId
  });

  const { mutate: addComment, isPending: isAdding } = useMutation({
    mutationFn: async ({ noteId, content }: { noteId: string; content: string }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('comments')
        .insert([{
          note_id: noteId,
          author_user_id: user.id,
          content
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

  const { mutate: deleteComment } = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('comments')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
    }
  });

  return {
    comments,
    isLoading,
    addComment,
    isAdding,
    deleteComment
  };
}
