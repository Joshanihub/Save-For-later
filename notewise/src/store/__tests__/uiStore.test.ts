import useUIStore from '../uiStore';

describe('uiStore', () => {
  beforeEach(() => {
    useUIStore.setState({
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
    });
  });

  it('should toggle sidebar', () => {
    expect(useUIStore.getState().sidebarOpen).toBe(true);
    useUIStore.getState().toggleSidebar();
    expect(useUIStore.getState().sidebarOpen).toBe(false);
  });

  it('should toggle command palette', () => {
    expect(useUIStore.getState().commandPaletteOpen).toBe(false);
    useUIStore.getState().toggleCommandPalette();
    expect(useUIStore.getState().commandPaletteOpen).toBe(true);
  });

  it('should set theme', () => {
    useUIStore.getState().setTheme('dark');
    expect(useUIStore.getState().theme).toBe('dark');
  });

  it('should set sort order', () => {
    useUIStore.getState().setSortOrder('oldest');
    expect(useUIStore.getState().defaultSort).toBe('oldest');
  });

  it('should set view mode', () => {
    useUIStore.getState().setViewMode('list');
    expect(useUIStore.getState().viewMode).toBe('list');
  });

  it('should set sidebar width', () => {
    useUIStore.getState().setSidebarWidth(300);
    expect(useUIStore.getState().sidebarWidth).toBe(300);
  });

  it('should set preferences', () => {
    useUIStore.getState().setPreferences({ fontPair: 'roboto', notificationsEnabled: false });
    expect(useUIStore.getState().fontPair).toBe('roboto');
    expect(useUIStore.getState().notificationsEnabled).toBe(false);
  });
});
