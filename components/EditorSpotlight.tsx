'use client';

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';

type Spotlight = {
  id: string;
  title: string;
  excerpt: string;
  body: string;
  imageUrl: string | null;
  authorName: string;
};

type SpotlightResponse = { data?: Spotlight | null; error?: string };

export function EditorialSpotlight() {
  const pathname = usePathname();
  const [item, setItem] = useState<Spotlight | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetch('/api/spotlight', { cache: 'no-store' })
      .then((response) => response.ok ? (response.json() as Promise<SpotlightResponse>) : null)
      .then((result) => {
        if (cancelled || !result?.data) return;
        setItem(result.data);
      })
      .catch((error) => console.error('Spotlight load failed', error));
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    setVisible(false);
    if (!item || pathname.startsWith('/admin')) return;
    const timer = window.setTimeout(() => setVisible(true), 10000);
    return () => window.clearTimeout(timer);
  }, [pathname, item]);

  function dismiss() { setVisible(false); }

  useEffect(() => {
    if (!visible) return;
    const handleKeyDown = (event: KeyboardEvent) => { if (event.key === 'Escape') dismiss(); };
    document.addEventListener('keydown', handleKeyDown);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [visible]);

  if (!visible || !item) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-[#050914]/80 p-3 backdrop-blur-sm sm:p-6" onClick={dismiss}>
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="spotlight-title"
        className="spotlight-modal relative grid max-h-[92vh] w-full max-w-3xl overflow-y-auto rounded-2xl shadow-2xl md:grid-cols-[1.05fr_.95fr]"
        onClick={(event) => event.stopPropagation()}
      >
        <button type="button" onClick={dismiss} aria-label="Close Spotlight" className="absolute right-3 top-3 z-10 flex h-9 w-9 items-center justify-center rounded-full bg-black/55 text-2xl text-white transition-colors hover:bg-black/80">
          ×
        </button>

        <div className="relative min-h-[250px] bg-[#111827] md:min-h-[470px]">
          {item.imageUrl ? (
            <img src={item.imageUrl} alt={item.title} className="absolute inset-0 h-full w-full object-cover" />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center bg-[radial-gradient(circle_at_50%_50%,#294a9a,#111827_70%)]">
              <span className="text-5xl font-black tracking-widest text-white/90">RADAR</span>
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-transparent to-black/10" />
          <p className="absolute bottom-5 left-5 text-xs font-bold uppercase tracking-[.24em] text-white">Campus Radar / Spotlight</p>
        </div>

        <div className="spotlight-copy flex flex-col justify-center p-6 sm:p-8">
          <p className="spotlight-eyebrow text-[10px] font-black uppercase tracking-[.24em]">Campus Radar presents</p>
          <h2 id="spotlight-title" className="spotlight-heading mt-2 text-3xl font-black tracking-tight sm:text-4xl">
            SPOTLIGHT<span className="spotlight-period">.</span>
          </h2>
          <p className="spotlight-muted mt-3 text-xs font-bold uppercase tracking-[.16em]">Something is on our radar</p>
          <h3 className="spotlight-title mt-7 text-2xl font-extrabold leading-snug">{item.title}</h3>
          <p className="spotlight-excerpt mt-3 text-sm leading-6">{item.excerpt}</p>
          <p className="spotlight-muted mt-4 text-xs font-semibold uppercase tracking-wider">Featuring {item.authorName}</p>
          <div className="mt-7 flex flex-wrap gap-3">
            <button type="button" onClick={dismiss} className="spotlight-secondary rounded-lg border px-4 py-3 text-sm font-semibold transition-colors">Close</button>
            <Link href="/spotlight" onClick={dismiss} className="spotlight-primary flex-1 rounded-lg px-5 py-3 text-center text-sm font-bold transition-colors">
              Explore Spotlight →
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
