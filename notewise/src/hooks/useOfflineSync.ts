import { useEffect, useCallback, useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import useNotesStore from '../store/notesStore';

export function useOfflineSync() {
  const { syncQueue, removeSyncItems } = useNotesStore();
  const [isPending, setIsPending] = useState(syncQueue.length > 0);

  const syncPending = useCallback(async () => {
    if (!navigator.onLine) {
      console.log('Offline: Not syncing');
      return;
    }

    if (syncQueue.length === 0) {
      setIsPending(false);
      return;
    }

    setIsPending(true);
    
    // We process the queue sequentially to maintain order
    const syncedIds: string[] = [];
    
    for (const item of syncQueue) {
      try {
        const payload = item.payload as any; // Cast for now
        
        if (item.action === 'create') {
          const { error } = await supabase.from(item.resourceType + 's').insert([payload]);
          if (error) throw error;
        } else if (item.action === 'update') {
          const { error } = await supabase
            .from(item.resourceType + 's')
            .update(payload)
            .eq('id', item.resourceId);
          if (error) throw error;
        } else if (item.action === 'delete') {
          const { error } = await supabase
            .from(item.resourceType + 's')
            .delete()
            .eq('id', item.resourceId);
          if (error) throw error;
        }

        syncedIds.push(item.id);
      } catch (error) {
        console.error(`Sync failed for ${item.id}:`, error);
        // Break early on failure to maintain order, or continue? 
        // For simplicity, we break to avoid conflicting out-of-order updates.
        break; 
      }
    }

    if (syncedIds.length > 0) {
      removeSyncItems(syncedIds);
    }
    
    setIsPending(syncQueue.length > syncedIds.length);
  }, [syncQueue, removeSyncItems]);

  // Listen for online/offline events
  useEffect(() => {
    window.addEventListener('online', syncPending);
    window.addEventListener('offline', () => {
      console.log('App is now offline');
    });

    // Attempt to sync immediately on mount if online
    if (navigator.onLine) {
      syncPending();
    }

    return () => {
      window.removeEventListener('online', syncPending);
      window.removeEventListener('offline', () => {});
    };
  }, [syncPending]);

  return { syncPending, isPending };
}
