'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';

type TodayItem = {
  title: string;
  href: string;
  type: 'Event' | 'Deadline';
};

export function TodayTicker({ items }: { items: TodayItem[] }) {
  const [active, setActive] = useState(0);

  useEffect(() => {
    if (items.length < 2) return;
    const timer = window.setInterval(() => {
      setActive((current) => (current + 1) % items.length);
    }, 6000);
    return () => window.clearInterval(timer);
  }, [items.length]);

  if (!items.length) return null;
  const item = items[active % items.length];

  return (
    <aside aria-label="Today's campus activities" className="fixed inset-x-3 bottom-3 z-50 mx-auto max-w-2xl">
      <Link
        href={item.href}
        className="flex items-center gap-3 rounded-xl border border-[#173B87]/20 bg-white/95 px-4 py-3 shadow-xl backdrop-blur transition hover:border-[#173B87]"
      >
        <span className="shrink-0 rounded-md bg-[#173B87] px-2.5 py-1.5 text-[10px] font-black uppercase tracking-wider text-white">Today</span>
        <span className="min-w-0 flex-1">
          <span className="block text-[10px] font-bold uppercase tracking-wide text-[#173B87]">{item.type}{items.length > 1 ? ` · ${active + 1}/${items.length}` : ''}</span>
          <span className="mt-0.5 block truncate text-sm font-bold text-gray-900">{item.title}</span>
        </span>
        <span aria-hidden="true" className="shrink-0 text-lg font-bold text-[#173B87]">→</span>
      </Link>
    </aside>
  );
}
