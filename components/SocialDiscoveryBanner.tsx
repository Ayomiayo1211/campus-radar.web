'use client';

import { usePathname } from 'next/navigation';

const platforms = [
  { name: 'Instagram', mark: 'IG', href: 'https://www.instagram.com/campusradar.funaab/', tone: 'instagram' },
  { name: 'Facebook', mark: 'f', href: 'https://web.facebook.com/profile.php?id=100064085701446', tone: 'facebook' },
  { name: 'X', mark: 'X', href: 'https://x.com/campusradar_f', tone: 'x' },
  { name: 'TikTok', mark: '♪', href: 'https://www.tiktok.com/@campusradar.funaab', tone: 'tiktok' },
  { name: 'YouTube', mark: '▶', href: 'https://www.youtube.com/@campusradarfunaabtv', tone: 'youtube' },
  { name: 'Spotify', mark: '≋', href: 'https://open.spotify.com/show/3Swzh3CTZBFkkhvF3s5RqE', tone: 'spotify' },
  { name: 'Apple Podcasts', mark: '◉', href: 'https://podcasts.apple.com/podcast/campus-radar/id1541717342', tone: 'apple' },
  { name: 'Substack', mark: 'S', href: 'https://campusradarfunaab.substack.com/', tone: 'substack' },
];

export function SocialDiscoveryBanner() {
  const pathname = usePathname();

  if (pathname.startsWith('/admin')) return null;

  return (
    <aside className="social-discovery" aria-label="Find Campus Radar on social media and podcast platforms">
      <div className="social-discovery-label">
        <span className="social-discovery-pulse" aria-hidden="true" />
        <span>Find us everywhere</span>
      </div>
      <nav className="social-discovery-links" aria-label="Campus Radar platforms">
        {platforms.map((platform) => (
          <a
            key={platform.name}
            className="social-discovery-link"
            href={platform.href}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`Campus Radar on ${platform.name} (opens in a new tab)`}
            title={platform.name}
          >
            <span className={`social-discovery-mark social-discovery-mark-${platform.tone}`} aria-hidden="true">
              {platform.mark}
            </span>
            <span className="social-discovery-name">{platform.name}</span>
          </a>
        ))}
      </nav>
    </aside>
  );
}
