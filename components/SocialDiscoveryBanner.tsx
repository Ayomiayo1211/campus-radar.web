'use client';

import { usePathname } from 'next/navigation';

const platforms = [
  { name: 'Instagram', mark: '◎', href: 'https://www.instagram.com/campusradar.funaab/', tone: 'instagram' },
  { name: 'Facebook', mark: 'f', href: 'https://web.facebook.com/profile.php?id=100064085701446', tone: 'facebook' },
  { name: 'X', mark: '𝕏', href: 'https://x.com/campusradar_f', tone: 'x' },
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
    <aside className="radar-social" aria-label="Find Campus Radar across the web">
      <div className="radar-social-orb" aria-hidden="true">
        <span className="radar-social-orb-ring radar-social-orb-ring-a" />
        <span className="radar-social-orb-ring radar-social-orb-ring-b" />
        <span className="radar-social-orb-sweep" />
        <span className="radar-social-orb-core" />
        <i className="radar-social-orb-dot radar-social-orb-dot-a" />
        <i className="radar-social-orb-dot radar-social-orb-dot-b" />
      </div>
      <div className="radar-social-copy">
        <span className="radar-social-kicker"><i /> CAMPUS RADAR NETWORK</span>
        <span className="radar-social-heading">Stay on our frequency<span>.</span></span>
        <span className="radar-social-subtitle">Find us across the web</span>
      </div>
      <span className="radar-social-divider" aria-hidden="true" />
      <nav className="radar-social-links" aria-label="Campus Radar platforms">
        {platforms.map((platform) => (
          <a
            key={platform.name}
            className="radar-social-link"
            href={platform.href}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`Campus Radar on ${platform.name} (opens in a new tab)`}
            title={platform.name}
          >
            <span className={`radar-social-icon radar-social-icon-${platform.tone}`} aria-hidden="true">
              {platform.mark}
            </span>
            <span className="radar-social-link-name">{platform.name}</span>
          </a>
        ))}
      </nav>
      <span className="radar-social-signal" aria-hidden="true">● SIGNAL ACTIVE</span>
    </aside>
  );
}
