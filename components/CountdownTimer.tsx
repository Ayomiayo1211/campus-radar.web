'use client';

import { useEffect, useMemo, useState } from 'react';

type CountdownTimerProps = {
  date: string;
  kind: 'deadline' | 'event';
};

function getTarget(date: string, kind: CountdownTimerProps['kind']) {
  if (kind === 'deadline') {
    const match = date.match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (match) return new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]), 23, 59, 59, 999);
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
    if (kind === 'event' && sameDay) return <p className="mt-4 rounded-xl border border-[#e63946]/35 bg-[#e63946]/[0.08] px-4 py-3 text-sm font-bold text-[#c92f3b]">Happening today</p>;
    return <p className="mt-4 rounded-xl border border-[var(--line)] border-l-4 border-l-[#e63946] bg-[var(--surface)] px-4 py-3 text-sm font-semibold text-[var(--muted)]">{kind === 'deadline' ? 'Application deadline has passed' : 'Event date has passed'}</p>;
  }

  const totalSeconds = Math.floor(remaining / 1000);
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  return (
    <section aria-label={kind === 'deadline' ? 'Application countdown' : 'Event countdown'} className="mt-4 overflow-hidden rounded-xl border border-[#e63946]/30 border-l-4 border-l-[#e63946] bg-[linear-gradient(110deg,rgba(230,57,70,0.09),rgba(36,87,197,0.055)_58%,rgba(230,57,70,0.035))] p-4 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-xs font-black uppercase tracking-wider text-[#173b87]">{kind === 'deadline' ? (sameDay ? 'Application closes today' : 'Time left to apply') : (sameDay ? 'Starts in' : 'Countdown to event')}</p>
        <span className="h-1.5 w-10 rounded-full bg-[#e63946]" aria-hidden="true" />
      </div>
      <div className="mt-3 grid grid-cols-4 gap-2 sm:gap-3">
        {([['Days', days], ['Hours', hours], ['Minutes', minutes], ['Seconds', seconds]] as const).map(([label, value]) => (
          <div key={label} className={label === 'Seconds' ? 'min-w-0 rounded-lg border border-[#e63946]/45 bg-[#e63946]/[0.09] px-2 py-2 text-center shadow-sm' : 'min-w-0 rounded-lg border border-white/70 bg-white/90 px-2 py-2 text-center shadow-sm'}>
            <p className={label === 'Seconds' ? 'text-xl font-black tabular-nums text-[#e63946] sm:text-2xl' : 'text-xl font-black tabular-nums text-[#173b87] sm:text-2xl'}>{String(value).padStart(2, '0')}</p>
            <p className={label === 'Seconds' ? 'mt-0.5 text-[9px] font-bold uppercase tracking-wide text-[#c92f3b] sm:text-[10px]' : 'mt-0.5 text-[9px] font-bold uppercase tracking-wide text-gray-500 sm:text-[10px]'}>{label}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
