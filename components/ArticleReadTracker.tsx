'use client';

import { useEffect, useState } from 'react';

const VISITOR_STORAGE_KEY = 'campus-radar-reader-id';

type ArticleReadTrackerProps = {
  storyId: string;
  initialCount: number;
};

export function ArticleReadTracker({ storyId, initialCount }: ArticleReadTrackerProps) {
  const [readCount, setReadCount] = useState(initialCount);

  useEffect(() => {
    let visitorId = window.localStorage.getItem(VISITOR_STORAGE_KEY);
    if (!visitorId) {
      visitorId = window.crypto.randomUUID();
      window.localStorage.setItem(VISITOR_STORAGE_KEY, visitorId);
    }

    let cancelled = false;
    fetch(`/api/stories/${storyId}/read`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ visitorId }),
      cache: 'no-store',
    })
      .then(async (response) => {
        if (!response.ok) return;
        const result = (await response.json()) as { readCount?: number };
        if (!cancelled && typeof result.readCount === 'number') {
          setReadCount(result.readCount);
        }
      })
      .catch((error) => console.error('Article read tracking failed:', error));

    return () => { cancelled = true; };
  }, [storyId]);

  return <span aria-label={`${readCount.toLocaleString()} article reads`}>{readCount.toLocaleString()} reads</span>;
}
