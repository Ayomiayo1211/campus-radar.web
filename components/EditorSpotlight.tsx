
'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

const editorial = {
  title: 'Campus Radar Editorial',
  description:
    'A considered review of the stories, decisions and conversations that shaped campus life last month.',
  href: '/opinion',
  isPublished: false,
};

export function EditorialSpotlight() {
  const [visible, setVisible] = useState(false);
  const [dismissalKey, setDismissalKey] = useState('');

  useEffect(() => {
    const now = new Date();

    // The spotlight is eligible only on the first day of each month.
    if (now.getDate() !== 1) return;

    const monthId = `${now.getFullYear()}-${String(
      now.getMonth() + 1
    ).padStart(2, '0')}`;

    const key = `campus-radar-editorial-dismissed-${monthId}`;
    setDismissalKey(key);

    // Do not announce an edition that is not published.
    if (!editorial.isPublished) return;

    if (window.localStorage.getItem(key) === 'true') return;

    setVisible(true);
  }, []);

  function dismiss() {
    if (dismissalKey) {
      window.localStorage.setItem(dismissalKey, 'true');
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
  }, [visible, dismissalKey]);

  if (!visible) return null;

  const now = new Date();
  const previousMonth = new Date(
    now.getFullYear(),
    now.getMonth() - 1,
    1
  );

  const editionMonth = previousMonth.toLocaleDateString('en-NG', {
    month: 'long',
    year: 'numeric',
  });

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4"
      onClick={dismiss}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="editorial-spotlight-title"
        aria-describedby="editorial-spotlight-description"
        className="relative w-full max-w-lg overflow-hidden rounded-xl bg-white shadow-2xl"
        onClick={(event) => event.stopPropagation()}
      >
        <button
          type="button"
          onClick={dismiss}
          aria-label="Close editorial announcement"
          className="absolute right-3 top-3 z-10 flex h-9 w-9 items-center justify-center rounded-full bg-white text-xl text-[#101828] shadow hover:bg-gray-100"
        >
          ×
        </button>

        <div className="bg-[#101828] px-6 py-9 text-center text-white sm:px-10">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-red-300">
            Campus Radar presents
          </p>

          <h2
            id="editorial-spotlight-title"
            className="mt-4 text-3xl font-black leading-tight sm:text-4xl"
          >
            {editorial.title}
          </h2>

          <div className="mx-auto my-5 h-1 w-14 rounded bg-[#E63946]" />

          <p className="text-lg font-semibold">
            {editionMonth}, Under Review
          </p>

          <p
            id="editorial-spotlight-description"
            className="mx-auto mt-3 max-w-sm text-sm leading-6 text-gray-300"
          >
            {editorial.description}
          </p>
        </div>

        <div className="space-y-3 p-6">
          <Link
            href={editorial.href}
            onClick={dismiss}
            className="flex w-full items-center justify-center rounded-lg bg-[#173B87] px-5 py-3 text-sm font-bold text-white transition hover:bg-[#2457C5]"
          >
            Read the Editorial
          </Link>

          <button
            type="button"
            onClick={dismiss}
            className="w-full rounded-lg px-5 py-2 text-sm font-medium text-[var(--muted)] hover:bg-gray-50"
          >
            Maybe later
          </button>
        </div>
      </section>
    </div>
  );
}
