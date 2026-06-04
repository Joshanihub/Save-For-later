import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabaseClient';
import type { ShareLink } from '../types';

export function useShareLinks(noteId?: string) {
  const queryClient = useQueryClient();
  const queryKey = ['share_links', noteId];

  const { data: shareLinks = [], isLoading } = useQuery({
    queryKey,
    queryFn: async () => {
      if (!noteId) return [];
      
      const { data, error } = await supabase
        .from('share_links')
        .select('*')
        .eq('note_id', noteId);

      if (error) throw error;
      
      return data.map((s) => ({
        id: s.id,
        noteId: s.note_id,
        userId: s.creator_user_id,
        accessToken: s.access_token,
        expiresAt: s.expires_at,
        createdAt: s.created_at,
      })) as ShareLink[];
    },
    enabled: !!noteId
  });

  const { mutate: createShareLink, isPending: isCreating } = useMutation({
    mutationFn: async ({ noteId, expiresInDays }: { noteId: string; expiresInDays?: number }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const expiresAt = expiresInDays 
        ? new Date(Date.now() + expiresInDays * 24 * 60 * 60 * 1000).toISOString()
        : null;

      // Generate a unique access token client-side (DB column is NOT NULL with no default)
      const accessToken = crypto.randomUUID();

      const { data, error } = await supabase
        .from('share_links')
        .insert([{
          note_id: noteId,
          creator_user_id: user.id,
          access_token: accessToken,
          expires_at: expiresAt
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

  const { mutate: deleteShareLink } = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('share_links')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
    }
  });

  return {
    shareLinks,
    isLoading,
    createShareLink,
    isCreating,
    deleteShareLink
  };
}
