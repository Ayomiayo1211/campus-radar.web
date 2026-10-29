
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const links = [
  {
    label: 'Overview',
    href: '/admin',
  },
  {
    label: 'Stories',
    href: '/admin/stories',
  },
  {
    label: 'The Radar',
    href: '/admin/radar',
  },
  {
    label: 'Media',
    href: '/admin/media',
  },
  {
    label: 'Opportunities',
    href: '/admin/opportunities',
  },
  {
    label: 'Submissions',
    href: '/admin/submissions',
  },
  {
    label: 'Users',
    href: '/admin/users',
  },
];

export default function AdminNav() {
  const pathname = usePathname();

  return (
    <nav className="border-b border-gray-200 bg-white">
      <div className="mx-auto flex max-w-6xl gap-6 overflow-x-auto px-6">
        {links.map((link) => {
          const active =
            pathname === link.href ||
            (link.href !== '/admin' &&
              pathname.startsWith(link.href));

          return (
            <Link
              key={link.href}
              href={link.href}
              className={`whitespace-nowrap border-b-2 py-4 text-sm font-medium ${
                active
                  ? 'border-black text-black'
                  : 'border-transparent text-gray-500 hover:text-black'
              }`}
            >
              {link.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
