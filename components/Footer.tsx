
import Image from 'next/image';
import Link from 'next/link';

export function Footer() {
  return (
    <footer className="mt-20 border-t border-[var(--line)] bg-white text-[var(--ink)]">
      <div className="container grid gap-10 py-12 md:grid-cols-[1.4fr_.7fr_.9fr]">
        <div>
          <Link
            href="/"
            aria-label="Campus Radar home"
            className="inline-block"
          >
            <Image
              src="/campusradar.svg"
              alt="Campus Radar"
              width={220}
              height={65}
              className="h-auto w-[180px] object-contain object-left"
            />
          </Link>

          <p className="mt-3 max-w-sm text-sm leading-6 text-[var(--muted)]">
            Student-focused media and information for the Federal University
            of Agriculture, Abeokuta.
          </p>

          <p className="mt-4 max-w-sm text-xs leading-5 text-[var(--muted)]">
            Independent student media. Not an official FUNAAB platform.
          </p>
        </div>

        <div>
          <div className="kicker text-[#173B87]">Explore</div>

          <div className="mt-4 grid gap-3 text-sm text-[var(--muted)]">
            <Link className="hover:text-[#173B87]" href="/news">News</Link>
            <Link className="hover:text-[#173B87]" href="/radar">The Radar</Link>
            <Link className="hover:text-[#173B87]" href="/features">Features</Link>
            <Link className="hover:text-[#173B87]" href="/opinion">Opinion</Link>
            <Link className="hover:text-[#173B87]" href="/opportunities">Opportunities</Link>
            <Link className="hover:text-[#173B87]" href="/podcast">Podcast</Link>
          </div>
        </div>

        <div>
          <div className="kicker text-[#173B87]">Community</div>

          <p className="mt-4 text-sm leading-6 text-[var(--muted)]">
            Have a tip, event, opportunity or story? Send information to
            the newsroom.
          </p>

          <Link
            className="mt-4 inline-block text-sm font-bold text-[#173B87] underline underline-offset-4 hover:text-[var(--accent)]"
            href="/submit"
          >
            Submit information
          </Link>

          <Link
            className="mt-3 block text-sm font-bold text-[#173B87] underline underline-offset-4 hover:text-[var(--accent)]"
            href="/confidential"
          >
            Use Campus Confidential
          </Link>
        </div>
      </div>

      <div className="border-t border-[var(--line)] bg-[#F8FAFC]">
        <div className="container flex flex-col gap-2 py-5 text-xs text-[var(--muted)] sm:flex-row sm:items-center sm:justify-between">
          <span>© {new Date().getFullYear()} Campus Radar.</span>
          <span>Stories that move campus.</span>
        </div>
      </div>
    </footer>
  );
}
