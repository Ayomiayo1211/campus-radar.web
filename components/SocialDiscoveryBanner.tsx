'use client';

import { usePathname } from 'next/navigation';
import { useState } from 'react';

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
  const [isOpen, setIsOpen] = useState(false);

  if (pathname.startsWith('/admin')) return null;

  return (
    <aside className={\`cr-social-dock\${isOpen ? ' is-open' : ''}\`} aria-label="Find Campus Radar on other platforms">
      <div className="cr-social-dock-head">
        <span className="cr-social-dock-mark" aria-hidden="true">CR<span>.</span></span>
        <div className="cr-social-dock-copy">
          <span className="cr-social-dock-title">Campus Radar</span>
          <span className="cr-social-dock-subtitle">Find us beyond the website</span>
        </div>
        <button
          className="cr-social-dock-toggle"
          type="button"
          aria-expanded={isOpen}
          aria-controls="cr-social-dock-platforms"
          onClick={() => setIsOpen((open) => !open)}
        >
          {isOpen ? 'Close' : 'Follow'}
          <span aria-hidden="true">{isOpen ? '−' : '+'}</span>
        </button>
      </div>

      {isOpen && (
        <nav className="cr-social-dock-platforms" id="cr-social-dock-platforms" aria-label="Campus Radar social platforms">
          {platforms.map((platform) => (
            <a
              key={platform.name}
              className="cr-social-dock-link"
              href={platform.href}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={\`Campus Radar on \${platform.name} (opens in a new tab)\`}
            >
              <span className={\`cr-social-dock-icon cr-social-dock-icon-\${platform.tone}\`} aria-hidden="true">
                {platform.mark}
              </span>
              <span>{platform.name}</span>
              <span className="cr-social-dock-arrow" aria-hidden="true">↗</span>
            </a>
          ))}
        </nav>
      )}
    </aside>
  );
}
