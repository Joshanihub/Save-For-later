import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Collection } from '../types';

// ─── Store State Interface ──────────────────────────────────────

interface CollectionsState {
  collections: Collection[];
  selectedCollectionId: string | null;

  // Actions
  setCollections: (collections: Collection[]) => void;
  addCollection: (collection: Collection) => void;
  updateCollection: (id: string, updates: Partial<Collection>) => void;
  removeCollection: (id: string) => void;
  setSelectedCollectionId: (id: string | null) => void;
}

// ─── Store Implementation ───────────────────────────────────────

const useCollectionsStore = create<CollectionsState>()(
  persist(
    (set) => ({
      collections: [],
      selectedCollectionId: null,

      setCollections: (collections) => set({ collections }),

      addCollection: (collection) =>
        set((state) => ({
          collections: [...state.collections, collection],
        })),

      updateCollection: (id, updates) =>
        set((state) => ({
          collections: state.collections.map((c) =>
            c.id === id ? { ...c, ...updates, updatedAt: new Date().toISOString() } : c,
          ),
        })),

      removeCollection: (id) =>
        set((state) => ({
          collections: state.collections.filter((c) => c.id !== id),
          selectedCollectionId:
            state.selectedCollectionId === id ? null : state.selectedCollectionId,
        })),

      setSelectedCollectionId: (id) => set({ selectedCollectionId: id }),
    }),
    {
      name: 'notewise-collections-store',
      partialize: (state) => ({
        collections: state.collections,
      }),
    },
  ),
);

export default useCollectionsStore;
