'use client';

import { useEffect, useState } from 'react';

type Opportunity = {
  id: string;
  title: string;
  organisation: string;
  deadline: string | null;
  applicationUrl?: string | null;
};

const STORAGE_KEY = 'campus-radar-opportunity-nudges-shown';
const MAX_NUDGES = 5;
const INTERVAL_MS = 2 * 60 * 1000;

function deadlineLabel(value: string) {
  const remaining = new Date(value).getTime() - Date.now();
  const days = Math.max(0, Math.ceil(remaining / 86_400_000));
  if (days === 0) return 'Deadline today';
  if (days === 1) return 'Deadline tomorrow';
  return `Closes in ${days} days`;
}

export function OpportunityDeadlineNudge() {
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [active, setActive] = useState<Opportunity | null>(null);
  const [shown, setShown] = useState(0);

  useEffect(() => {
    let cancelled = false;
    fetch('/api/opportunities?closingSoon=true&limit=5', { cache: 'no-store' })
      .then((response) => response.ok ? response.json() : Promise.reject(new Error('Unable to load deadlines')))
      .then((result: { data?: Opportunity[] }) => {
        if (!cancelled) setOpportunities(result.data ?? []);
      })
      .catch(() => undefined);
    try {
      const count = Number(window.sessionStorage.getItem(STORAGE_KEY) ?? '0');
      if (Number.isFinite(count)) setShown(Math.min(MAX_NUDGES, Math.max(0, count)));
    } catch { /* Storage may be unavailable; reminders still work for this visit. */ }
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    if (!opportunities.length || shown >= MAX_NUDGES || active) return;
    const timer = window.setTimeout(() => {
      const next = opportunities[shown % opportunities.length];
      setActive(next);
      const nextCount = shown + 1;
      setShown(nextCount);
      try { window.sessionStorage.setItem(STORAGE_KEY, String(nextCount)); } catch { /* Ignore unavailable storage. */ }
    }, INTERVAL_MS);
    return () => window.clearTimeout(timer);
  }, [opportunities, shown, active]);

  if (!active) return null;

  return (
    <aside role="status" aria-live="polite" className="fixed bottom-5 right-5 z-[90] w-[min(360px,calc(100vw-2.5rem))] rounded-xl border border-[var(--line)] bg-[var(--surface)] p-4 shadow-2xl">
      <div className="flex items-start gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-[10px] font-black uppercase tracking-[0.16em] text-[#D62828]">Closing soon · {shown} of {MAX_NUDGES}</p>
          <h3 className="mt-1 text-sm font-black leading-snug text-[var(--ink)]">{active.title}</h3>
          <p className="mt-1 text-xs text-[var(--muted)]">{active.organisation}</p>
          {active.deadline && <p className="mt-2 text-xs font-bold text-[var(--ink)]">{deadlineLabel(active.deadline)}</p>}
          {active.applicationUrl && <a href={active.applicationUrl} target="_blank" rel="noopener noreferrer" className="mt-3 inline-block text-xs font-bold text-[#173B87] underline underline-offset-4">View opportunity</a>}
        </div>
        <button type="button" aria-label="Dismiss deadline reminder" onClick={() => setActive(null)} className="rounded-full px-2 py-1 text-lg leading-none text-[var(--muted)] hover:bg-[var(--line)]">×</button>
      </div>
    </aside>
  );
}
