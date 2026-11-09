'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

type RadarBannerItem = {
  id: string;
  slug: string;
  title: string;
  summary: string;
  kind: string;
  event_date: string | null;
  location: string | null;
  cover_image: string | null;
  published_at: string | null;
};

type RadarBannerProps = {
  items: RadarBannerItem[];
};

function formatDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleDateString('en-NG', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

function isUpcomingEvent(item: RadarBannerItem) {
  if (item.kind !== 'EVENT' || !item.event_date) return false;
  const eventDate = new Date(item.event_date);
  if (Number.isNaN(eventDate.getTime())) return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  eventDate.setHours(0, 0, 0, 0);
  return eventDate >= today;
}

export function RadarBanner({ items }: RadarBannerProps) {
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    if (items.length < 2) return;
    const interval = window.setInterval(() => {
      setActiveIndex((current) => (current + 1) % items.length);
    }, 5500);
    return () => window.clearInterval(interval);
  }, [items.length]);

  if (!items.length) return null;

  const activeItem = items[activeIndex] ?? items[0];
  const upcoming = isUpcomingEvent(activeItem);

  const move = (direction: -1 | 1) => {
    setActiveIndex((current) => (current + direction + items.length) % items.length);
  };

  return (
    <div className="overflow-hidden rounded-2xl border border-[var(--line)] bg-[#0B1D43] shadow-sm">
      <div
        className="relative min-h-[300px] sm:min-h-[340px]"
        style={{
          backgroundImage: `linear-gradient(90deg, rgba(5, 17, 43, .96) 0%, rgba(5, 17, 43, .82) 55%, rgba(5, 17, 43, .38) 100%)${activeItem.cover_image ? `, url("${activeItem.cover_image}")` : ''}`,
          backgroundPosition: 'center',
          backgroundSize: 'cover',
        }}
      >
        <Link
          href={`/radar/${activeItem.slug}`}
          aria-label={`Read Radar update: ${activeItem.title}`}
          className="absolute inset-0 z-0 focus-visible:outline focus-visible:outline-2 focus-visible:outline-inset focus-visible:outline-white"
        />
        <div className="relative z-10 flex min-h-[300px] flex-col justify-between p-6 text-white pointer-events-none sm:min-h-[340px] sm:p-9">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full border border-white/30 bg-white/10 px-3 py-1 text-[10px] font-black uppercase tracking-[0.16em] text-white">
              The Radar
            </span>
            {upcoming && (
              <span className="rounded-full bg-[#F5C451] px-3 py-1 text-[10px] font-black uppercase tracking-[0.12em] text-[#241A00]">
                Coming soon
              </span>
            )}
            <span className="text-xs font-semibold uppercase tracking-wider text-white/75">
              {activeItem.kind.replaceAll('_', ' ')}
            </span>
          </div>

          <div className="max-w-2xl py-8">
            {upcoming && activeItem.event_date && (
              <p className="mb-2 text-sm font-bold text-[#F5D783]">
                {formatDate(activeItem.event_date)}
                {activeItem.location ? ` · ${activeItem.location}` : ''}
              </p>
            )}
            <h3 className="text-2xl font-black leading-tight sm:text-4xl">
              {activeItem.title}
            </h3>
            <p className="mt-3 line-clamp-3 max-w-xl text-sm leading-6 text-white/80 sm:text-base">
              {activeItem.summary}
            </p>
            {!upcoming && activeItem.event_date && (
              <p className="mt-3 text-xs font-semibold text-white/65">
                {formatDate(activeItem.event_date)}
                {activeItem.location ? ` · ${activeItem.location}` : ''}
              </p>
            )}
            <span className="mt-5 inline-flex items-center gap-2 text-sm font-black text-white underline underline-offset-4">
              Read update <span aria-hidden="true">→</span>
            </span>
          </div>

          <div className="flex items-center justify-between gap-4">
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-white/55">
              {String(activeIndex + 1).padStart(2, '0')} / {String(items.length).padStart(2, '0')}
            </p>
            <div className="pointer-events-auto flex items-center gap-2">
              <button
                type="button"
                onClick={() => move(-1)}
                aria-label="Previous Radar update"
                className="flex h-9 w-9 items-center justify-center rounded-full border border-white/35 text-lg text-white transition hover:bg-white/15"
              >
                ‹
              </button>
              <button
                type="button"
                onClick={() => move(1)}
                aria-label="Next Radar update"
                className="flex h-9 w-9 items-center justify-center rounded-full border border-white/35 text-lg text-white transition hover:bg-white/15"
              >
                ›
              </button>
            </div>
          </div>
        </div>
      </div>
      {items.length > 1 && (
        <div className="flex items-center justify-center gap-1.5 bg-[#0B1D43] px-4 pb-4">
          {items.map((item, index) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setActiveIndex(index)}
              aria-label={`Show Radar update ${index + 1}`}
              aria-current={index === activeIndex ? 'true' : undefined}
              className={`h-1.5 rounded-full transition-all ${index === activeIndex ? 'w-7 bg-white' : 'w-1.5 bg-white/40 hover:bg-white/70'}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
