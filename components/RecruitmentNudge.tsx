'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';

const DISMISSAL_KEY = 'campus-radar-recruitment-nudge-dismissed';
const DISMISSAL_PERIOD = 7 * 24 * 60 * 60 * 1000;

export function RecruitmentNudge() {
  const pathname = usePathname();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (pathname === '/join' || pathname.startsWith('/admin')) return;

    try {
      const dismissedUntil = Number(localStorage.getItem(DISMISSAL_KEY) || 0);
      if (dismissedUntil > Date.now()) return;
    } catch {
      // If browser storage is unavailable, keep the prompt usable for this visit.
    }

    const timeout = window.setTimeout(() => setVisible(true), 3200);
    return () => window.clearTimeout(timeout);
  }, [pathname]);

  function dismiss() {
    try {
      localStorage.setItem(DISMISSAL_KEY, String(Date.now() + DISMISSAL_PERIOD));
    } catch {
      // Dismiss for the current render even when storage is unavailable.
    }
    setVisible(false);
  }

  if (!visible || pathname === '/join' || pathname.startsWith('/admin')) return null;

  return (
    <aside
      aria-label="Campus Radar recruitment"
      className="fixed bottom-5 right-5 z-[70] w-[min( calc(100vw-2rem), 390px)] sm:bottom-6 sm:right-6"
    >
      <div className="relative overflow-hidden rounded-2xl border border-[#173B87]/20 bg-[var(--paper)] p-5 shadow-[0_18px_60px_rgba(10,25,60,0.22)]">
        <div className="absolute inset-x-0 top-0 h-1 bg-[#173B87]" />
        <button
          type="button"
          onClick={dismiss}
          aria-label="Dismiss recruitment prompt"
          className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full text-lg text-[var(--muted)] transition hover:bg-[var(--surface)] hover:text-[var(--foreground)]"
        >
          ×
        </button>
        <p className="kicker pr-8 text-[#173B87]">Campus Radar · 2026/2027</p>
        <h2 className="mt-2 pr-5 text-xl font-black leading-tight text-[var(--foreground)]">
          We need more hands on deck.
        </h2>
        <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
          There's room for more voices, ideas and talent in the newsroom. Join a team and help us tell the stories that matter on campus.
        </p>
        <div className="mt-4 flex items-center gap-3">
          <Link
            href="/join"
            onClick={dismiss}
            className="inline-flex items-center justify-center rounded-full bg-[#173B87] px-5 py-2.5 text-sm font-bold text-white transition hover:bg-[#102d69]"
          >
            Join Campus Radar
          </Link>
          <button
            type="button"
            onClick={dismiss}
            className="text-sm font-semibold text-[var(--muted)] underline underline-offset-4 hover:text-[var(--foreground)]"
          >
            Maybe later
          </button>
        </div>
      </div>
    </aside>
  );
}
