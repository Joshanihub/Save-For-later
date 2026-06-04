import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabaseClient';
import type { ReadingListItem } from '../types';

export function useReadingList() {
  const queryClient = useQueryClient();
  const queryKey = ['reading_list'];

  const { data: readingList = [], isLoading, error } = useQuery({
    queryKey,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('reading_list')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      return data.map((item) => ({
        id: item.id,
        userId: item.user_id,
        url: item.url,
        title: item.title,
        contentPreview: item.content_preview,
        readingTimeMinutes: item.reading_time_minutes,
        isRead: item.is_read,
        readAt: item.read_at,
        createdAt: item.created_at,
        updatedAt: item.updated_at,
      })) as ReadingListItem[];
    }
  });

  const { mutate: addUrl, isPending: isAdding } = useMutation({
    mutationFn: async (url: string) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('reading_list')
        .insert([{
          user_id: user.id,
          url,
          title: new URL(url).hostname // simplified fallback title
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

  const { mutate: toggleReadStatus } = useMutation({
    mutationFn: async ({ id, isRead }: { id: string; isRead: boolean }) => {
      const { data, error } = await supabase
        .from('reading_list')
        .update({
          is_read: isRead,
          read_at: isRead ? new Date().toISOString() : null,
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

  const { mutate: deleteItem } = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('reading_list')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
    }
  });

  return {
    readingList,
    isLoading,
    error,
    addUrl,
    isAdding,
    toggleReadStatus,
    deleteItem
  };
}
