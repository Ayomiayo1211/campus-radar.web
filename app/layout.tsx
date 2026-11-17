// @ts-ignore -- Next.js handles global CSS imports at build time.
import './globals.css';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { EditorialSpotlight } from '@/components/EditorSpotlight';
import { ThemeProvider } from '@/components/ThemeProvider';
import { OpportunityDeadlineNudge } from '@/components/OpportunityDeadlineNudge';
import { TodayRadarFeed } from '@/components/TodayRadarFeed';
import { RecruitmentNudge } from '@/components/RecruitmentNudge';
import { SocialDiscoveryBanner } from '@/components/SocialDiscoveryBanner';
import { MobilePromoProvider } from '@/components/MobilePromoCycle';

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
});

export const metadata: Metadata = {
  title: 'Campus Radar — FUNAAB',
  description:
    'Student-focused media and information platform for the Federal University of Agriculture, Abeokuta.',
  metadataBase: new URL('https://www.campusradarfunaab.com.ng'),
  icons: {
    icon: [{ url: '/campusradar.svg', type: 'image/svg+xml' }],
    shortcut: ['/campusradar.svg'],
    apple: [{ url: '/campusradar.svg', type: 'image/svg+xml' }],
  },
  openGraph: {
    type: 'website',
    siteName: 'Campus Radar',
    images: ['/campus-radar-og.svg'],
    title: 'Campus Radar — FUNAAB',
    description:
      'Student-focused media and information platform for the Federal University of Agriculture, Abeokuta.',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Campus Radar — FUNAAB',
    description:
      'Student-focused media and information platform for the Federal University of Agriculture, Abeokuta.',
    images: ['/campus-radar-og.svg'],
  },
};

const siteStructuredData = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'Organization',
      '@id': 'https://www.campusradarfunaab.com.ng/#organization',
      name: 'Campus Radar',
      url: 'https://www.campusradarfunaab.com.ng/',
      logo: {
        '@type': 'ImageObject',
        url: 'https://www.campusradarfunaab.com.ng/campusradar.svg',
      },
      description:
        'Student-focused media and information platform for the Federal University of Agriculture, Abeokuta.',
      sameAs: [
        'https://www.instagram.com/campusradar.funaab/',
        'https://web.facebook.com/profile.php?id=100064085701446',
        'https://x.com/campusradar_f',
        'https://www.tiktok.com/@campusradar.funaab',
        'https://www.youtube.com/@campusradarfunaabtv',
        'https://open.spotify.com/show/3Swzh3CTZBFkkhvF3s5RqE',
        'https://podcasts.apple.com/podcast/campus-radar/id1541717342',
        'https://campusradarfunaab.substack.com/',
      ],
    },
    {
      '@type': 'WebSite',
      '@id': 'https://www.campusradarfunaab.com.ng/#website',
      url: 'https://www.campusradarfunaab.com.ng/',
      name: 'Campus Radar',
      publisher: {
        '@id': 'https://www.campusradarfunaab.com.ng/#organization',
      },
      inLanguage: 'en',
    },
  ],
};

const themeInitScript = `
(function () {
  try {
    var saved = localStorage.getItem('campus-radar-theme');
    var dark = saved === 'dark';
    document.documentElement.classList.toggle('dark', dark);
    document.documentElement.style.colorScheme = dark ? 'dark' : 'light';
  } catch (_) {}
})();
`;

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={inter.variable} suppressHydrationWarning>
      <body>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(siteStructuredData).replace(/</g, '\\u003c'),
          }}
        />
        <ThemeProvider>
          {children}
          <EditorialSpotlight />
          <OpportunityDeadlineNudge />
          <RecruitmentNudge />
          <MobilePromoProvider>
            <TodayRadarFeed />
            <SocialDiscoveryBanner />
          </MobilePromoProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
