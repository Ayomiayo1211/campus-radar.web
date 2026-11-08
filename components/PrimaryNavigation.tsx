'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';

const nav = [
  ['/news', 'News'],
  ['/radar', 'The Radar'],
  ['/features', 'Features'],
  ['/opinion', 'Opinion'],
  ['/opportunities', 'Opportunities'],
  ['/podcast', 'Podcast'],
  ['/confidential', 'Confidential'],
] as const;

export function PrimaryNavigation() {
  const pathname = usePathname() ?? '';
  const activePath = pathname === '/spotlight' ? '/news' : pathname;
  const activeIndex = Math.max(
    0,
    nav.findIndex(([href]) => activePath === href || activePath.startsWith(`${href}/`)),
  );
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [indicator, setIndicator] = useState({ left: 0, width: 0, visible: false });
  const links = useRef<(HTMLAnchorElement | null)[]>([]);
  const targetIndex = hoveredIndex ?? activeIndex;

  useEffect(() => {
    const updateIndicator = () => {
      const link = links.current[targetIndex];
      if (!link) return;
      setIndicator({
        left: link.offsetLeft,
        width: link.offsetWidth,
        visible: true,
      });
    };

    updateIndicator();
    window.addEventListener('resize', updateIndicator);
    return () => window.removeEventListener('resize', updateIndicator);
  }, [targetIndex]);

  return (
    <nav
      className="relative hidden items-center gap-1 text-[13px] font-bold xl:flex"
      aria-label="Primary navigation"
      onMouseLeave={() => setHoveredIndex(null)}
    >
      {nav.map(([href, label], index) => {
        const isActive = index === activeIndex;
        return (
          <Link
            key={href}
            ref={(node) => {
              links.current[index] = node;
            }}
            href={href}
            aria-current={isActive ? 'page' : undefined}
            onMouseEnter={() => setHoveredIndex(index)}
            onFocus={() => setHoveredIndex(index)}
            onBlur={() => setHoveredIndex(null)}
            className={`relative z-10 rounded-none px-3 py-5 transition-colors duration-200 hover:text-[#D62828] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#D62828] ${
              isActive ? 'text-[#173B87] dark:text-[#F2F5FF]' : 'text-[var(--ink)]'
            }`}
          >
            {label}
          </Link>
        );
      })}
      <span
        aria-hidden="true"
        className="pointer-events-none absolute bottom-0 left-0 h-[3px] rounded-full bg-[#D62828]"
        style={{
          width: indicator.width,
          opacity: indicator.visible ? 1 : 0,
          transform: `translateX(${indicator.left}px)`,
          transition: 'transform 280ms cubic-bezier(0.22, 1, 0.36, 1), width 280ms cubic-bezier(0.22, 1, 0.36, 1), opacity 120ms ease',
        }}
      />
    </nav>
  );
}
