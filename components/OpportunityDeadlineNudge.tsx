'use client';

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';

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
const SLIDE_INTERVAL_MS = 5500;

function deadlineLabel(value: string) {
  const remaining = new Date(value).getTime() - Date.now();
  const days = Math.max(0, Math.ceil(remaining / 86_400_000));
  if (days === 0) return 'Deadline today';
  if (days === 1) return 'Deadline tomorrow';
  return `Closes in ${days} days`;
}

export function OpportunityDeadlineNudge() {
  const pathname = usePathname();
  const isAdmin = pathname?.startsWith('/admin') ?? false;
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [visible, setVisible] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const [shown, setShown] = useState(0);

  useEffect(() => {
    if (isAdmin) return;
    let cancelled = false;
    fetch('/api/opportunities?closingSoon=true&limit=5', { cache: 'no-store' })
      .then(async (response) => {
        if (!response.ok) throw new Error('Unable to load deadlines');
        return await response.json() as { data?: Opportunity[] };
      })
      .then((result) => {
        if (!cancelled) setOpportunities(result.data ?? []);
      })
      .catch(() => undefined);

    try {
      const count = Number(window.sessionStorage.getItem(STORAGE_KEY) ?? '0');
      if (Number.isFinite(count)) setShown(Math.min(MAX_NUDGES, Math.max(0, count)));
    } catch { /* Storage may be unavailable; reminders still work for this visit. */ }
    return () => { cancelled = true; };
  }, [isAdmin]);

  useEffect(() => {
    if (isAdmin || !opportunities.length || shown >= MAX_NUDGES || visible) return;
    const timer = window.setTimeout(() => {
      setActiveIndex(0);
      setVisible(true);
      const nextCount = shown + 1;
      setShown(nextCount);
      try { window.sessionStorage.setItem(STORAGE_KEY, String(nextCount)); } catch { /* Ignore unavailable storage. */ }
    }, INTERVAL_MS);
    return () => window.clearTimeout(timer);
  }, [isAdmin, opportunities, shown, visible]);

  useEffect(() => {
    if (!visible || opportunities.length < 2) return;
    const timer = window.setInterval(() => {
      setActiveIndex((current) => (current + 1) % opportunities.length);
    }, SLIDE_INTERVAL_MS);
    return () => window.clearInterval(timer);
  }, [visible, opportunities.length]);

  if (isAdmin || !visible || !opportunities.length) return null;

  const active = opportunities[activeIndex];

  return (
    <aside
      role="status"
      aria-live="polite"
      className="fixed bottom-5 right-5 z-[90] w-[min(390px,calc(100vw-2.5rem))] overflow-hidden rounded-2xl border border-[var(--line)] bg-[var(--surface)] shadow-2xl animate-in slide-in-from-bottom-4 fade-in duration-500"
    >
      <div className="flex items-center justify-between border-b border-[var(--line)] px-4 py-3">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.16em] text-[#D62828]">
            Closing soon
          </p>
          <p className="mt-0.5 text-xs font-medium text-[var(--muted)]">
            {opportunities.length} {opportunities.length === 1 ? 'opportunity' : 'opportunities'} to check
          </p>
        </div>
        <button
          type="button"
          aria-label="Dismiss deadline reminders"
          onClick={() => setVisible(false)}
          className="rounded-full px-2 py-1 text-xl leading-none text-[var(--muted)] transition hover:bg-[var(--line)]"
        >
          ×
        </button>
      </div>

      <div className="overflow-hidden">
        <div
          className="flex transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]"
          style={{ transform: `translateX(-${activeIndex * 100}%)` }}
        >
          {opportunities.map((item) => (
            <div key={item.id} className="w-full shrink-0 px-4 py-4">
              <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--muted)]">
                {item.organisation}
              </p>
              <h3 className="mt-1 text-base font-black leading-snug text-[var(--ink)]">
                {item.title}
              </h3>
              {item.deadline && (
                <p className="mt-2 text-xs font-bold text-[#D62828]">
                  {deadlineLabel(item.deadline)}
                </p>
              )}
              {item.applicationUrl && (
                <a
                  href={item.applicationUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-3 inline-flex items-center text-xs font-bold text-[#173B87] underline underline-offset-4"
                >
                  View opportunity
                </a>
              )}
            </div>
          ))}
        </div>
      </div>

      {opportunities.length > 1 && (
        <div className="flex items-center justify-between border-t border-[var(--line)] px-4 py-3">
          <div className="flex items-center gap-1.5" aria-label={`Slide ${activeIndex + 1} of ${opportunities.length}`}>
            {opportunities.map((item, index) => (
              <button
                key={item.id}
                type="button"
                aria-label={`Show opportunity ${index + 1}`}
                aria-current={index === activeIndex ? 'true' : undefined}
                onClick={() => setActiveIndex(index)}
                className={`h-1.5 rounded-full transition-all duration-300 ${index === activeIndex ? 'w-6 bg-[#D62828]' : 'w-1.5 bg-[var(--muted)]/40 hover:bg-[var(--muted)]'}`}
              />
            ))}
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-semibold tabular-nums text-[var(--muted)]">
              {activeIndex + 1}/{opportunities.length}
            </span>
            <button
              type="button"
              aria-label="Previous opportunity"
              onClick={() => setActiveIndex((current) => (current - 1 + opportunities.length) % opportunities.length)}
              className="rounded-full border border-[var(--line)] px-2 py-1 text-xs text-[var(--ink)] transition hover:bg-[var(--line)]"
            >
              ←
            </button>
            <button
              type="button"
              aria-label="Next opportunity"
              onClick={() => setActiveIndex((current) => (current + 1) % opportunities.length)}
              className="rounded-full border border-[var(--line)] px-2 py-1 text-xs text-[var(--ink)] transition hover:bg-[var(--line)]"
            >
              →
            </button>
          </div>
        </div>
      )}
    </aside>
  );
}
