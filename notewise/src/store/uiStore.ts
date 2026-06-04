import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { ThemeMode, SortOrder, ViewMode, UserPreferences } from '../types';

// ─── Store State Interface ──────────────────────────────────────

interface UIState extends UserPreferences {
  sidebarOpen: boolean;
  commandPaletteOpen: boolean;

  // Actions
  setTheme: (theme: ThemeMode) => void;
  setSortOrder: (sort: SortOrder) => void;
  setViewMode: (view: ViewMode) => void;
  setSidebarWidth: (width: number) => void;
  toggleSidebar: () => void;
  toggleCommandPalette: () => void;
  setPreferences: (prefs: Partial<UserPreferences>) => void;
}

// ─── Store Implementation ───────────────────────────────────────

const useUIStore = create<UIState>()(
  persist(
    (set) => ({
      // Defaults
      theme: 'auto',
      fontPair: 'inter',
      sidebarWidth: 280,
      defaultSort: 'newest',
      viewMode: 'grid',
      notificationsEnabled: true,
      weeklyDigestEnabled: true,
      dailyPromptEnabled: false,
      sidebarOpen: true,
      commandPaletteOpen: false,

      // Actions
      setTheme: (theme) => set({ theme }),
      setSortOrder: (defaultSort) => set({ defaultSort }),
      setViewMode: (viewMode) => set({ viewMode }),
      setSidebarWidth: (sidebarWidth) => set({ sidebarWidth }),
      toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
      toggleCommandPalette: () => set((s) => ({ commandPaletteOpen: !s.commandPaletteOpen })),
      setPreferences: (prefs) => set(prefs),
    }),
    {
      name: 'notewise-ui-store',
      partialize: (state) => ({
        theme: state.theme,
        fontPair: state.fontPair,
        sidebarWidth: state.sidebarWidth,
        defaultSort: state.defaultSort,
        viewMode: state.viewMode,
        notificationsEnabled: state.notificationsEnabled,
        sidebarOpen: state.sidebarOpen,
      }),
    },
  ),
);

export default useUIStore;
