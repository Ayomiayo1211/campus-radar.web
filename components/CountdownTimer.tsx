'use client';

import { useEffect, useMemo, useState } from 'react';

type CountdownTimerProps = {
  date: string;
  kind: 'deadline' | 'event';
};

function getTarget(date: string, kind: CountdownTimerProps['kind']) {
  if (kind === 'deadline') {
    // Opportunity deadlines are stored as date-only values represented at UTC day-end.
    // Rebuild the deadline at the end of that calendar day in the visitor's local timezone.
    const match = date.match(/^(\\d{4})-(\\d{2})-(\\d{2})/);
    if (match) {
      return new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]), 23, 59, 59, 999);
    }
  }
  return new Date(date);
}

export function CountdownTimer({ date, kind }: CountdownTimerProps) {
  const target = useMemo(() => getTarget(date, kind), [date, kind]);
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  if (Number.isNaN(target.getTime())) return null;

  const remaining = target.getTime() - now;
  const sameDay = new Date(now).toDateString() === target.toDateString();

  if (remaining <= 0) {
    if (kind === 'event' && sameDay) {
      return <p className="mt-5 rounded-lg border border-[#173B87]/20 bg-[#173B87]/5 px-4 py-3 text-sm font-bold text-[#173B87]">Happening today</p>;
    }
    return <p className="mt-5 rounded-lg border border-[var(--line)] bg-[var(--surface)] px-4 py-3 text-sm font-semibold text-[var(--muted)]">{kind === 'deadline' ? 'Application deadline has passed' : 'Event date has passed'}</p>;
  }

  const totalSeconds = Math.floor(remaining / 1000);
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  return (
    <section aria-label={kind === 'deadline' ? 'Application countdown' : 'Event countdown'} className="mt-5 rounded-xl border border-[#173B87]/20 bg-[#173B87]/5 p-4">
      <p className="text-xs font-bold uppercase tracking-wider text-[#173B87]">{kind === 'deadline' ? (sameDay ? 'Application closes today' : 'Time left to apply') : (sameDay ? 'Starts in' : 'Countdown to event')}</p>
      <div className="mt-3 flex flex-wrap gap-3">
        {([['Days', days], ['Hours', hours], ['Minutes', minutes], ['Seconds', seconds]] as const).map(([label, value]) => (
          <div key={label} className="min-w-[58px] rounded-lg bg-white px-3 py-2 text-center shadow-sm">
            <p className="text-2xl font-black tabular-nums text-[#173B87]">{String(value).padStart(2, '0')}</p>
            <p className="mt-0.5 text-[10px] font-semibold uppercase tracking-wide text-gray-500">{label}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
