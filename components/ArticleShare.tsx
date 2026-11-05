'use client';

import { useEffect, useState } from 'react';

type ArticleShareProps = {
  title: string;
  excerpt: string;
  shortCode: string;
};

export function ArticleShare({ title, excerpt, shortCode }: ArticleShareProps) {
  const [copied, setCopied] = useState(false);
  const [url, setUrl] = useState('');

  useEffect(() => {
    setUrl(shortCode ? new URL(`/s/${shortCode}`, window.location.origin).toString() : window.location.href);
  }, [shortCode]);

  async function shareArticle() {
    const currentUrl = shortCode ? new URL(`/s/${shortCode}`, window.location.origin).toString() : window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({ title, text: excerpt, url: currentUrl });
        return;
      } catch (error) {
        if (error instanceof Error && error.name === 'AbortError') return;
      }
    }

    try {
      await navigator.clipboard.writeText(currentUrl);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2200);
    } catch {
      window.prompt('Copy this article link:', currentUrl);
    }
  }

  const encodedUrl = encodeURIComponent(url);
  const encodedTitle = encodeURIComponent(title);

  return (
    <section aria-label="Share this article" className="flex flex-wrap items-center gap-2">
      <span className="mr-1 text-sm font-semibold text-[var(--ink)]">Share:</span>
      <button
        type="button"
        onClick={shareArticle}
        className="rounded-full bg-[#173B87] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#102d69]"
      >
        {copied ? 'Link copied' : 'Share article'}
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
