// @ts-ignore -- Next.js handles global CSS imports at build time.
import './globals.css';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { EditorialSpotlight } from '@/components/EditorSpotlight';
import { ThemeProvider } from '@/components/ThemeProvider';

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
});

export const metadata: Metadata = {
  title: 'Campus Radar — FUNAAB',
  description:
    'Student-focused media and information platform for the Federal University of Agriculture, Abeokuta.',
  metadataBase: new URL('https://campus-radar-v1.campusradarfunaab.workers.dev'),
  openGraph: {
    type: 'website',
    siteName: 'Campus Radar',
    title: 'Campus Radar — FUNAAB',
    description:
      'Student-focused media and information platform for the Federal University of Agriculture, Abeokuta.',
  },
};

const themeInitScript = `
(function () {
  try {
    var saved = localStorage.getItem('campus-radar-theme') || 'system';
    var dark = saved === 'dark' || (saved === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
    document.documentElement.classList.toggle('dark', dark);
    document.documentElement.style.colorScheme = dark ? 'dark' : 'light';
  } catch (_) {}
})();
`;

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={inter.variable} suppressHydrationWarning>
      <body>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
        <ThemeProvider>
          {children}
          <EditorialSpotlight />
        </ThemeProvider>
      </body>
    </html>
  );
}
