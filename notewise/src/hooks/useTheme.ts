import { useEffect } from 'react';
import useUIStore from '../store/uiStore';
import type { ThemeMode } from '../types';

/** Applies the correct theme class to <html> and listens for OS preference changes. */
export function useTheme(): {
  theme: ThemeMode;
  resolvedTheme: 'light' | 'dark';
  setTheme: (theme: ThemeMode) => void;
} {
  const { theme, setTheme } = useUIStore();

  const resolvedTheme = getResolvedTheme(theme);

  useEffect(() => {
    const root = document.documentElement;

    if (resolvedTheme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [resolvedTheme]);

  // Listen for OS-level theme changes when in "auto" mode
  useEffect(() => {
    if (theme !== 'auto') return;

    const mql = window.matchMedia('(prefers-color-scheme: dark)');

    const handler = () => {
      const root = document.documentElement;
      if (mql.matches) {
        root.classList.add('dark');
      } else {
        root.classList.remove('dark');
      }
    };

    mql.addEventListener('change', handler);
    return () => mql.removeEventListener('change', handler);
  }, [theme]);

  return { theme, resolvedTheme, setTheme };
}

function getResolvedTheme(theme: ThemeMode): 'light' | 'dark' {
  if (theme === 'auto') {
    return window.matchMedia('(prefers-color-scheme: dark)').matches
      ? 'dark'
      : 'light';
  }
  return theme;
}
