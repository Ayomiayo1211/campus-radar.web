'use client';

import { useEffect, useState } from 'react';
import { TodayRadar, type TodayRadarItem } from '@/components/TodayRadarWidget';

export function TodayRadarFeed() {
  const [items, setItems] = useState<TodayRadarItem[]>([]);

  useEffect(() => {
    let cancelled = false;
    fetch('/api/today-radar', { cache: 'no-store' })
      .then(async (response) => {
        if (!response.ok) throw new Error("Could not load today's activities.");
        return await response.json() as { items?: TodayRadarItem[] };
      })
      .then((result) => {
        if (!cancelled) setItems(result.items ?? []);
      })
      .catch((error) => {
        console.error("Today's Radar feed failed:", error);
      });

    return () => { cancelled = true; };
  }, []);

  return <TodayRadar items={items} />;
}
