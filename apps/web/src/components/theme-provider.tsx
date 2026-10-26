'use client';

import * as React from 'react';
import type { AccentName } from '@nexovexo/ui';

type Theme = 'light' | 'dark';

interface ThemeContextValue {
  theme: Theme;
  accent: AccentName;
  setTheme: (t: Theme) => void;
  toggleTheme: () => void;
  setAccent: (a: AccentName) => void;
}

const ThemeContext = React.createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = React.useState<Theme>('dark');
  const [accent, setAccentState] = React.useState<AccentName>('violet');

  // Sync from the pre-paint script's result on mount.
  React.useEffect(() => {
    const isDark = document.documentElement.classList.contains('dark');
    setThemeState(isDark ? 'dark' : 'light');
    const a = document.documentElement.getAttribute('data-accent') as AccentName | null;
    if (a) setAccentState(a);
  }, []);

  const setTheme = React.useCallback((t: Theme) => {
    setThemeState(t);
    document.documentElement.classList.toggle('dark', t === 'dark');
    try {
      localStorage.setItem('nv-theme', t);
    } catch {
      /* ignore */
    }
  }, []);

  const toggleTheme = React.useCallback(() => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  }, [theme, setTheme]);

  const setAccent = React.useCallback((a: AccentName) => {
    setAccentState(a);
    document.documentElement.setAttribute('data-accent', a);
    try {
      localStorage.setItem('nv-accent', a);
    } catch {
      /* ignore */
    }
  }, []);

  const value = React.useMemo(
    () => ({ theme, accent, setTheme, toggleTheme, setAccent }),
    [theme, accent, setTheme, toggleTheme, setAccent],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const ctx = React.useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider');
  return ctx;
}
