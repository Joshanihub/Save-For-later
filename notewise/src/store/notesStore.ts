import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type {
  Note,
  SyncQueueItem,
  SyncAction,
  SyncResourceType,
  SyncStatus,
} from '../types';

// ─── Store State Interface ──────────────────────────────────────

interface NotesState {
  // Data
  notes: Note[];
  selectedNoteId: string | null;
  syncQueue: SyncQueueItem[];

  // Actions — Notes
  setNotes: (notes: Note[]) => void;
  addNote: (note: Note) => void;
  updateNote: (id: string, updates: Partial<Note>) => void;
  removeNote: (id: string) => void;
  setSelectedNoteId: (id: string | null) => void;

  // Actions — Sync Queue
  addToSyncQueue: (item: {
    action: SyncAction;
    resourceType: SyncResourceType;
    resourceId?: string;
    payload: Record<string, unknown>;
  }) => void;
  updateSyncItemStatus: (id: string, status: SyncStatus, error?: string) => void;
  removeSyncItems: (ids: string[]) => void;
  clearSyncedItems: () => void;
  getSyncQueueCount: () => number;
}

// ─── Store Implementation ───────────────────────────────────────

const useNotesStore = create<NotesState>()(
  persist(
    (set, get) => ({
      // Initial state
      notes: [],
      selectedNoteId: null,
      syncQueue: [],

      // Notes actions
      setNotes: (notes) => set({ notes }),

      addNote: (note) =>
        set((state) => ({
          notes: [note, ...state.notes],
        })),

      updateNote: (id, updates) =>
        set((state) => ({
          notes: state.notes.map((n) =>
            n.id === id ? { ...n, ...updates, updatedAt: new Date().toISOString() } : n,
          ),
        })),

      removeNote: (id) =>
        set((state) => ({
          notes: state.notes.filter((n) => n.id !== id),
          selectedNoteId: state.selectedNoteId === id ? null : state.selectedNoteId,
        })),

      setSelectedNoteId: (id) => set({ selectedNoteId: id }),

      // Sync queue actions
      addToSyncQueue: (item) =>
        set((state) => ({
          syncQueue: [
            ...state.syncQueue,
            {
              id: crypto.randomUUID(),
              ...item,
              createdAt: new Date().toISOString(),
              status: 'pending' as SyncStatus,
              retryCount: 0,
            },
          ],
        })),

      updateSyncItemStatus: (id, status, error) =>
        set((state) => ({
          syncQueue: state.syncQueue.map((item) =>
            item.id === id
              ? {
                  ...item,
                  status,
                  lastError: error,
                  retryCount: status === 'failed' ? item.retryCount + 1 : item.retryCount,
                }
              : item,
          ),
        })),

      removeSyncItems: (ids) =>
        set((state) => ({
          syncQueue: state.syncQueue.filter((item) => !ids.includes(item.id)),
        })),

      clearSyncedItems: () =>
        set((state) => ({
          syncQueue: state.syncQueue.filter((item) => item.status !== 'synced'),
        })),

      getSyncQueueCount: () => get().syncQueue.filter((i) => i.status === 'pending').length,
    }),
    {
      name: 'notewise-notes-store',
      partialize: (state) => ({
        notes: state.notes,
        syncQueue: state.syncQueue,
      }),
    },
  ),
);

export default useNotesStore;
