'use client';

import { useState } from 'react';

type ShareActionsProps = {
  title: string;
  text: string;
  path: string;
};

const SITE_ORIGIN = 'https://www.campusradarfunaab.com.ng';

export function ShareActions({ title, text, path }: ShareActionsProps) {
  const [copied, setCopied] = useState(false);
  const url = new URL(path, SITE_ORIGIN).toString();
  const encodedUrl = encodeURIComponent(url);
  const encodedTitle = encodeURIComponent(title);

  async function share() {
    if (navigator.share) {
      try {
        await navigator.share({ title, text, url });
        return;
      } catch (error) {
        if (error instanceof Error && error.name === 'AbortError') return;
      }
    }

    await copyLink();
  }

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2200);
    } catch {
      window.prompt('Copy this Campus Radar link:', url);
    }
  }

  return (
    <section aria-label="Share this item" className="flex flex-wrap items-center gap-2">
      <span className="mr-1 text-sm font-semibold text-[var(--ink)]">Share:</span>
      <button
        type="button"
        onClick={share}
        className="rounded-full bg-[#173B87] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#102d69]"
      >
        Share
      </button>
      <button
        type="button"
        onClick={copyLink}
        className="rounded-full border border-[var(--line)] px-3 py-2 text-sm font-medium hover:bg-[var(--surface)]"
      >
        {copied ? 'Link copied' : 'Copy link'}
      </button>
      <a
        href={`https://wa.me/?text=${encodeURIComponent(`${title} ${url}`)}`}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Share on WhatsApp"
        className="rounded-full border border-[var(--line)] px-3 py-2 text-sm font-medium hover:bg-[var(--surface)]"
      >
        WhatsApp
      </a>
      <a
        href={`https://twitter.com/intent/tweet?text=${encodedTitle}&url=${encodedUrl}`}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Share on X"
        className="rounded-full border border-[var(--line)] px-3 py-2 text-sm font-medium hover:bg-[var(--surface)]"
      >
        X
      </a>
      <a
        href={`https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Share on Facebook"
        className="rounded-full border border-[var(--line)] px-3 py-2 text-sm font-medium hover:bg-[var(--surface)]"
      >
        Facebook
      </a>
      <a
        href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Share on LinkedIn"
        className="rounded-full border border-[var(--line)] px-3 py-2 text-sm font-medium hover:bg-[var(--surface)]"
      >
        LinkedIn
      </a>
    </section>
  );
}
