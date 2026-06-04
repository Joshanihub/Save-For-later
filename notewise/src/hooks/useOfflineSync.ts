import { useEffect, useCallback, useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useQueryClient } from '@tanstack/react-query';
import useNotesStore from '../store/notesStore';
import useToastStore from '../store/toastStore';

/** Errors that will never succeed on retry — discard the item immediately */
function isNonRetryableError(message: string): boolean {
  return (
    message.includes('Could not find') ||
    message.includes('schema cache') ||
    message.includes('column') ||
    message.includes('violates not-null constraint')
  );
}

export function useOfflineSync() {
  const { syncQueue, removeSyncItems, updateSyncItemStatus } = useNotesStore();
  const [isPending, setIsPending] = useState(false);
  const queryClient = useQueryClient();

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
      // Discard items that have failed too many times
      if ((item.retryCount || 0) > 3) {
        syncedIds.push(item.id);
        continue;
      }

      try {
        const payload = item.payload as Record<string, unknown>;
        
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
      } catch (err: unknown) {
        const errorMsg =
          (err as { message?: string })?.message ||
          (err instanceof Error ? err.message : JSON.stringify(err));
        console.error(`Sync failed for ${item.id}:`, err);

        if (isNonRetryableError(errorMsg)) {
          // Permanently broken payload (e.g. camelCase keys) — discard silently
          console.warn(`Discarding non-retryable sync item ${item.id}: ${errorMsg}`);
          syncedIds.push(item.id);
          continue; // keep processing the rest of the queue
        }

        // Transient error — retry later
        updateSyncItemStatus(item.id, 'failed', errorMsg);
        useToastStore.getState().showToast(
          `Sync Error (${item.resourceType}): ${errorMsg}`,
          'error',
        );
        break; // stop processing to maintain order
      }
    }

    if (syncedIds.length > 0) {
      removeSyncItems(syncedIds);
      queryClient.invalidateQueries({ queryKey: ['notes'] });
      queryClient.invalidateQueries({ queryKey: ['collections'] });
      queryClient.invalidateQueries({ queryKey: ['tags'] });
    }
    
    setIsPending(false);
  }, [syncQueue, removeSyncItems, updateSyncItemStatus, queryClient]);

  // Listen for online/offline events
  useEffect(() => {
    const handleOnline = () => syncPending();
    const handleOffline = () => console.log('App is now offline');

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [syncPending]);

  // Auto-sync when queue changes
  useEffect(() => {
    if (navigator.onLine && syncQueue.length > 0 && !isPending) {
      syncPending();
    }
  }, [syncQueue, isPending, syncPending]);

  return { syncPending, isPending };
}
