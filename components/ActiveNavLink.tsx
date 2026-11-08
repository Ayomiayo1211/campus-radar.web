'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

type ActiveNavLinkProps = {
  href: string;
  label: string;
  mobile?: boolean;
};

export function ActiveNavLink({ href, label, mobile = false }: ActiveNavLinkProps) {
  const pathname = usePathname() ?? '';
  const activePath = pathname === '/spotlight' ? '/news' : pathname;
  const isActive = activePath === href || activePath.startsWith(`${href}/`);

  const desktopClass = isActive
    ? 'rounded-full bg-[#173B87] px-3 py-2 text-white transition-colors hover:bg-[#2457C5] dark:hover:bg-[#3B63B8]'
    : 'rounded-full px-3 py-2 text-[var(--ink)] transition-colors hover:bg-[#EEF3FF] hover:text-[#173B87] dark:hover:bg-[#263b5e] dark:hover:text-[#d5e2ff]';

  const mobileClass = isActive
    ? 'rounded-lg bg-[#173B87] px-3 py-3 text-white transition-colors hover:bg-[#2457C5] dark:hover:bg-[#3B63B8]'
    : 'rounded-lg border-b border-[var(--line)] px-3 py-3 text-[var(--ink)] transition-colors hover:bg-[#EEF3FF] hover:text-[#173B87] dark:hover:bg-[#263b5e] dark:hover:text-[#d5e2ff]';

  return (
    <Link href={href} aria-current={isActive ? 'page' : undefined} className={mobile ? mobileClass : desktopClass}>
      {label}
    </Link>
  );
}
