'use client';

import { Monitor, Moon, Sun } from 'lucide-react';
import { useThemePreference, type ThemePreference } from './ThemeProvider';

export function ThemeControl() {
  const { preference, setPreference } = useThemePreference();

  const options: { value: ThemePreference; label: string; icon: typeof Sun }[] = [
    { value: 'light', label: 'Light', icon: Sun },
    { value: 'dark', label: 'Dark', icon: Moon },
    { value: 'system', label: 'System', icon: Monitor },
  ];
  const selected = options.find((option) => option.value === preference) ?? options[2];
  const Icon = selected.icon;

  return (
    <label className="inline-flex items-center gap-2 rounded-full border border-[var(--line)] bg-[var(--paper)] px-3 py-2 text-xs font-semibold text-[var(--ink)]">
      <Icon size={15} aria-hidden="true" />
      <span className="sr-only">Display theme</span>
      <select
        aria-label="Display theme"
        value={preference}
        onChange={(event) => setPreference(event.target.value as ThemePreference)}
        className="max-w-[82px] cursor-pointer bg-transparent text-xs font-semibold outline-none"
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>{option.label}</option>
        ))}
      </select>
    </label>
  );
}
