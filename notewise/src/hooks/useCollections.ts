import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabaseClient';
import type { Collection } from '../types';

export function useCollections() {
  const queryClient = useQueryClient();
  const queryKey = ['collections'];

  const { data: collections = [], isLoading, error } = useQuery({
    queryKey,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('collections')
        .select('*')
        .order('position', { ascending: true })
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      // Transform snake_case from DB to camelCase for the frontend if needed
      return data.map((c) => ({
        id: c.id,
        userId: c.user_id,
        name: c.name,
        description: c.description,
        color: c.color,
        iconEmoji: c.icon_emoji,
        parentCollectionId: c.parent_collection_id,
        isArchived: c.is_archived,
        position: c.position,
        createdAt: c.created_at,
        updatedAt: c.updated_at,
      })) as Collection[];
    }
  });

  const { mutate: createCollection, isPending: isCreating } = useMutation({
    mutationFn: async (collectionData: Partial<Collection>) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('collections')
        .insert([{
          name: collectionData.name,
          description: collectionData.description,
          color: collectionData.color || '#000000',
          icon_emoji: collectionData.iconEmoji || '📁',
          parent_collection_id: collectionData.parentCollectionId,
          position: collectionData.position || 0,
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

  const { mutate: updateCollection, isPending: isUpdating } = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<Collection> }) => {
      const { data, error } = await supabase
        .from('collections')
        .update({
          name: updates.name,
          description: updates.description,
          color: updates.color,
          icon_emoji: updates.iconEmoji,
          parent_collection_id: updates.parentCollectionId,
          is_archived: updates.isArchived,
          position: updates.position,
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

  const { mutate: deleteCollection } = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('collections')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
    }
  });

  return {
    collections,
    isLoading,
    error,
    createCollection,
    isCreating,
    updateCollection,
    isUpdating,
    deleteCollection
  };
}
