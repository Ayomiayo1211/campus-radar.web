'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';

export type TodayRadarItem = {
  title: string;
  href: string;
  type: 'Event' | 'Deadline';
  timeLabel?: string;
};

function RadarMark({ active = false }: { active?: boolean }) {
  return (
    <span className={`today-radar-mark ${active ? 'today-radar-mark-active' : ''}`} aria-hidden="true">
      <span className="today-radar-ring today-radar-ring-one" />
      <span className="today-radar-ring today-radar-ring-two" />
      <span className="today-radar-ring today-radar-ring-three" />
      <span className="today-radar-sweep" />
      <span className="today-radar-blip today-radar-blip-one" />
      <span className="today-radar-blip today-radar-blip-two" />
      <span className="today-radar-blip today-radar-blip-three" />
      <span className="today-radar-core" />
    </span>
  );
}

export function TodayRadar({ items }: { items: TodayRadarItem[] }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [featured, setFeatured] = useState(0);

  useEffect(() => {
    if (items.length < 2) return;
    const timer = window.setInterval(() => {
      setFeatured((current) => (current + 1) % items.length);
    }, 5000);
    return () => window.clearInterval(timer);
  }, [items.length]);

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  if (!items.length || pathname.startsWith('/admin')) return null;

  const current = items[featured % items.length];

  return (
    <aside className="today-radar-root" aria-label="Today's Radar">
      {open && (
        <section className="today-radar-panel" aria-label="Activities happening today">
          <div className="today-radar-panel-head">
            <div className="flex items-center gap-3">
              <RadarMark active />
              <div>
                <p className="today-radar-eyebrow">CAMPUS RADAR · LIVE</p>
                <h2 className="text-lg font-black leading-tight">Today’s Radar</h2>
                <p className="text-xs text-[var(--muted)]">{items.length} {items.length === 1 ? 'activity' : 'activities'} on the radar today</p>
              </div>
            </div>
            <button type="button" onClick={() => setOpen(false)} className="today-radar-close" aria-label="Close Today's Radar">×</button>
          </div>

          <div className="today-radar-feature">
            <div className="flex items-center justify-between gap-2">
              <span className={`today-radar-type ${current.type === 'Deadline' ? 'today-radar-type-deadline' : ''}`}>{current.type === 'Event' ? 'HAPPENING TODAY' : 'DEADLINE TODAY'}</span>
              <span className="text-[10px] font-bold tabular-nums text-[var(--muted)]">{featured + 1} / {items.length}</span>
            </div>
            <Link href={current.href} className="mt-2 block text-base font-extrabold leading-snug hover:text-[#2457c5]">{current.title}</Link>
            {current.timeLabel && <p className="mt-1 text-xs text-[var(--muted)]">{current.timeLabel}</p>}
            <div className="mt-3 flex gap-1.5" aria-label="Featured activity">
              {items.map((item, index) => (
                <button key={item.href} type="button" onClick={() => setFeatured(index)} aria-label={`Show activity ${index + 1}: ${item.title}`} aria-current={index === featured ? 'true' : undefined} className={`today-radar-dot-nav ${index === featured ? 'is-active' : ''}`} />
              ))}
            </div>
          </div>

          <div className="today-radar-list">
            <p className="today-radar-list-label">ALL TODAY’S ACTIVITIES</p>
            {items.map((item, index) => (
              <Link key={item.href} href={item.href} onClick={() => setOpen(false)} className={`today-radar-list-item ${index === featured ? 'is-featured' : ''}`}>
                <span className={`today-radar-list-icon ${item.type === 'Deadline' ? 'is-deadline' : ''}`}>{item.type === 'Event' ? 'E' : 'D'}</span>
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-bold leading-snug">{item.title}</span>
                  <span className="mt-0.5 block text-[10px] font-semibold uppercase tracking-wider text-[var(--muted)]">{item.type}{item.timeLabel ? ` · ${item.timeLabel}` : ''}</span>
                </span>
                <span className="text-sm font-bold text-[#2457c5]">↗</span>
              </Link>
            ))}
          </div>
          <Link href="/radar" className="today-radar-footer">Explore The Radar <span aria-hidden="true">→</span></Link>
        </section>
      )}

      <button type="button" className={`today-radar-launcher ${open ? 'is-open' : ''}`} onClick={() => setOpen((value) => !value)} aria-expanded={open} aria-label={open ? 'Close Today’s Radar' : `Open Today’s Radar, ${items.length} activities today`}>
        <RadarMark active />
        <span className="today-radar-launcher-copy">
          <span className="block text-[9px] font-black uppercase tracking-[0.16em] text-[#e63946]">Campus Radar</span>
          <span className="block text-sm font-extrabold leading-tight">Today’s Radar</span>
        </span>
        <span className="today-radar-count">{items.length}</span>
      </button>
    </aside>
  );
}
