'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

type SpotlightStory = {
  slug: string;
  title: string;
  excerpt: string;
  cover_image: string | null;
};

function RadarMark() {
  return (
    <svg viewBox="0 0 320 320" role="img" aria-label="Campus Radar scanning graphic" className="h-full w-full">
      <defs>
        <linearGradient id="radar-bg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#243B78" />
          <stop offset="100%" stopColor="#111827" />
        </linearGradient>
        <radialGradient id="radar-core">
          <stop offset="0%" stopColor="#FFFFFF" />
          <stop offset="100%" stopColor="#E8ECF7" />
        </radialGradient>
      </defs>
      <circle cx="160" cy="160" r="158" fill="url(#radar-bg)" stroke="#FFFFFF" strokeWidth="1.5" strokeDasharray="8 7" />
      <circle cx="160" cy="160" r="108" fill="none" stroke="#FFFFFF" strokeWidth="1.2" opacity=".9" />
      <circle cx="160" cy="160" r="72" fill="none" stroke="#FFFFFF" strokeWidth="1.2" opacity=".9" />
      <path d="M160 160 L160 4 A156 156 0 0 1 270 50 Z" fill="#8EA8FF" opacity=".13" className="origin-center animate-[spin_9s_linear_infinite]" />
      <circle cx="160" cy="52" r="4" fill="#FFFFFF" />
      <circle cx="267" cy="185" r="4" fill="#FFFFFF" />
      <circle cx="204" cy="264" r="4" fill="#FFFFFF" />
      <circle cx="160" cy="160" r="30" fill="url(#radar-core)" />
      <circle cx="160" cy="160" r="20" fill="none" stroke="#172FA8" strokeWidth="3" />
      <circle cx="170" cy="160" r="5" fill="#B52E35" />
    </svg>
  );
}

export function EditorialSpotlight({ story }: { story: SpotlightStory | null }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!story) return;
    const key = `campus-radar-spotlight-dismissed-${story.slug}`;
    if (window.sessionStorage.getItem(key) === 'true') return;

    const timer = window.setTimeout(() => setVisible(true), 20_000);
    return () => window.clearTimeout(timer);
  }, [story]);

  function dismiss() {
    if (story) {
      window.sessionStorage.setItem(`campus-radar-spotlight-dismissed-${story.slug}`, 'true');
    }
    setVisible(false);
  }

  useEffect(() => {
    if (!visible) return;
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') dismiss();
    }
    document.addEventListener('keydown', handleKeyDown);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [visible, story]);

  if (!visible || !story) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-[#050914]/75 p-3 backdrop-blur-sm sm:p-6"
      onClick={dismiss}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="campus-radar-spotlight-title"
        aria-describedby="campus-radar-spotlight-description"
        className="relative grid w-full max-w-3xl overflow-hidden rounded-2xl bg-white shadow-2xl md:grid-cols-[0.9fr_1.1fr]"
        onClick={(event) => event.stopPropagation()}
      >
        <button
          type="button"
          onClick={dismiss}
          aria-label="Close Spotlight"
          className="absolute right-3 top-3 z-20 flex h-9 w-9 items-center justify-center rounded-full border border-white/30 bg-black/40 text-2xl leading-none text-white backdrop-blur hover:bg-black/60"
        >
          ×
        </button>

        <div className="relative flex min-h-[220px] items-center justify-center overflow-hidden bg-[#111827] p-5 sm:min-h-[300px] md:min-h-[430px]">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(43,76,164,.55),transparent_55%)]" />
          <div className="relative w-full max-w-[300px]">
            <RadarMark />
          </div>
          <p className="absolute bottom-4 left-5 text-[10px] font-semibold uppercase tracking-[0.24em] text-white/65">
            Campus Radar · Detection 001
          </p>
        </div>

        <div className="flex flex-col justify-center p-6 sm:p-8">
          <p className="text-[10px] font-black uppercase tracking-[0.24em] text-[#B52E35]">
            Campus Radar presents
          </p>
          <h2 id="campus-radar-spotlight-title" className="mt-2 text-3xl font-black leading-none tracking-tight text-[#173B87] sm:text-4xl">
            SPOTLIGHT<span className="text-[#B52E35]">.</span>
          </h2>
          <p className="mt-3 text-xs font-bold uppercase tracking-[0.16em] text-gray-500">
            Something is on our radar
          </p>

          {story.cover_image && (
            <div className="mt-5 aspect-[16/9] overflow-hidden rounded-xl bg-gray-100">
              <img src={story.cover_image} alt="" className="h-full w-full object-cover" />
            </div>
          )}

          <h3 className="mt-5 text-xl font-extrabold leading-snug text-gray-950 sm:text-2xl">
            {story.title}
          </h3>
          <p id="campus-radar-spotlight-description" className="mt-3 line-clamp-4 text-sm leading-6 text-gray-600">
            {story.excerpt}
          </p>

          <Link
            href={`/news/${story.slug}`}
            onClick={dismiss}
            className="mt-6 inline-flex items-center justify-center gap-2 rounded-lg bg-[#173B87] px-5 py-3 text-sm font-bold text-white transition hover:bg-[#244FAE]"
          >
            Explore the Spotlight <span aria-hidden="true">→</span>
          </Link>
          <button type="button" onClick={dismiss} className="mt-3 text-sm font-medium text-gray-500 hover:text-gray-900">
            Maybe later
          </button>
        </div>
      </section>
    </div>
  );
}
