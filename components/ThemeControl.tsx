'use client';

import { Moon, Sun } from 'lucide-react';
import { useThemePreference } from './ThemeProvider';

export function ThemeControl() {
  const { preference, setPreference } = useThemePreference();
  const isDark = preference === 'dark';

  return (
    <button
      type="button"
      onClick={() => setPreference(isDark ? 'light' : 'dark')}
      aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      aria-pressed={isDark}
      title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-[var(--line)] bg-[var(--paper)] text-[var(--ink)] transition-colors hover:border-[#D62828] hover:text-[#D62828] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#D62828]"
    >
      {isDark ? <Sun size={17} aria-hidden="true" /> : <Moon size={17} aria-hidden="true" />}
      <span className="sr-only">{isDark ? 'Light mode' : 'Dark mode'}</span>
    </button>
  );
}
