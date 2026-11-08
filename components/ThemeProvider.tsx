'use client';

import { createContext, useCallback, useContext, useMemo, useState, useEffect } from 'react';

export type ThemePreference = 'light' | 'dark';

type ThemeContextValue = {
  preference: ThemePreference;
  setPreference: (value: ThemePreference) => void;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);
const STORAGE_KEY = 'campus-radar-theme';

function applyTheme(preference: ThemePreference) {
  const dark = preference === 'dark';
  document.documentElement.classList.toggle('dark', dark);
  document.documentElement.style.colorScheme = dark ? 'dark' : 'light';
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [preference, setPreferenceState] = useState<ThemePreference>('light');

  // The root layout applies the saved class before paint. Sync React state after
  // hydration so the toggle reflects that same saved preference.
  useEffect(() => {
    const syncPreference = () => {
      const saved = window.localStorage.getItem(STORAGE_KEY);
      const next: ThemePreference = saved === 'dark' ? 'dark' : 'light';
      setPreferenceState(next);
      applyTheme(next);
    };

    syncPreference();
    window.addEventListener('storage', syncPreference);
    return () => window.removeEventListener('storage', syncPreference);
  }, []);

  const setPreference = useCallback((value: ThemePreference) => {
    window.localStorage.setItem(STORAGE_KEY, value);
    setPreferenceState(value);
    applyTheme(value);
  }, []);

  const value = useMemo(() => ({ preference, setPreference }), [preference, setPreference]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useThemePreference() {
  const context = useContext(ThemeContext);
  if (!context) throw new Error('useThemePreference must be used inside ThemeProvider');
  return context;
}
