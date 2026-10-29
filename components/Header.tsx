
import Image from 'next/image';
import Link from 'next/link';

const nav = [
  ['/news', 'News'],
  ['/radar', 'The Radar'],
  ['/features', 'Features'],
  ['/opinion', 'Opinion'],
  ['/opportunities', 'Opportunities'],
  ['/podcast', 'Podcast'],
] as const;

export function Header() {
  return (
    <header className="sticky top-0 z-40 border-b border-[var(--line)] bg-white/95 backdrop-blur">
      <div className="container flex min-h-20 items-center justify-between gap-6">
        <Link
          href="/"
          className="shrink-0"
          aria-label="Campus Radar home"
        >
          <Image
            src="/campusradar.svg"
            alt="Campus Radar"
            width={220}
            height={65}
            priority
            className="h-auto w-[155px] object-contain object-left sm:w-[180px]"
          />
        </Link>

        <nav
          className="hidden items-center gap-5 text-[13px] font-bold xl:flex"
          aria-label="Primary navigation"
        >
          {nav.map(([href, label]) => (
            <Link key={href} href={href} className="nav-link">
              {label}
            </Link>
          ))}

          <Link
            href="/confidential"
            className="rounded-full bg-[#173B87] px-4 py-2.5 text-white transition-colors hover:bg-[#2457C5]"
          >
            Confidential
          </Link>
        </nav>

        <div className="flex shrink-0 items-center gap-4">
          <Link
            href="/submit"
            className="hidden text-[13px] font-bold text-[#173B87] underline underline-offset-4 transition-colors hover:text-[var(--accent)] sm:inline"
          >
            Submit a tip
          </Link>

          <details className="relative xl:hidden">
            <summary className="list-none rounded-full border border-[var(--line)] px-4 py-2 text-sm font-bold text-[#173B87] transition-colors hover:border-[#173B87]">
              Menu
            </summary>

            <div className="absolute right-0 mt-3 w-64 rounded-xl border border-[var(--line)] bg-white p-4 shadow-xl">
              <nav
                className="grid gap-1 text-sm font-bold"
                aria-label="Mobile navigation"
              >
                {nav.map(([href, label]) => (
                  <Link
                    key={href}
                    href={href}
                    className="border-b border-[var(--line)] px-2 py-3 transition-colors hover:text-[#2457C5]"
                  >
                    {label}
                  </Link>
                ))}

                <Link
                  href="/confidential"
                  className="mt-2 rounded-lg bg-[#173B87] px-3 py-3 text-white transition-colors hover:bg-[#2457C5]"
                >
                  Campus Confidential
                </Link>

                <Link
                  href="/submit"
                  className="px-3 py-3 text-[#173B87] underline underline-offset-4"
                >
                  Submit information
                </Link>
              </nav>
            </div>
          </details>
        </div>
      </div>
    </header>
  );
}
