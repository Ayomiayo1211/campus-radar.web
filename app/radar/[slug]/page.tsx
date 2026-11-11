import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { ShareActions } from '@/components/ShareActions';
import { RadarContactActions } from '@/components/RadarContactActions';
import { getSupabaseAdmin } from '@/lib/server/supabase';

export const dynamic = 'force-dynamic';

type PageProps = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const { data: item } = await getSupabaseAdmin()
    .from('radar_items')
    .select('slug,title,summary,cover_image,kind')
    .eq('slug', slug)
    .eq('status', 'PUBLISHED')
    .maybeSingle();

  if (!item) return { title: { absolute: 'Update not found | Campus Radar' } };

  const title = item.title;
  const description = (item.summary || `Read this update from Campus Radar: ${title}.`).slice(0, 300);
  const canonical = `/radar/${slug}`;
  const images = item.cover_image ? [{ url: item.cover_image, alt: title }] : [];

  return {
    title: { absolute: `${title} | Campus Radar` },
    description,
    alternates: { canonical },
    openGraph: {
      type: 'article',
      title,
      description,
      url: canonical,
      siteName: 'Campus Radar',
      images,
    },
    twitter: {
      card: images.length ? 'summary_large_image' : 'summary',
      title,
      description,
      images: images.map((image) => image.url),
    },
  };
}

export default async function RadarItemPage({ params }: PageProps) {
  const { slug } = await params;
  const { data: item, error } = await getSupabaseAdmin()
    .from('radar_items')
    .select('id,slug,title,summary,cover_image,kind,origin,commercial_status,event_date,location,link,published_at')
    .eq('slug', slug)
    .eq('status', 'PUBLISHED')
    .maybeSingle();

  if (error) console.error('Could not load Radar detail:', error.message);
  if (!item) notFound();

  const date = item.event_date || item.published_at;
  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: item.title,
    description: item.summary,
    mainEntityOfPage: `https://www.campusradarfunaab.com.ng/radar/${encodeURIComponent(slug)}`,
    datePublished: item.published_at || undefined,
    image: item.cover_image ? [item.cover_image] : undefined,
    publisher: {
      '@type': 'Organization',
      name: 'Campus Radar',
      logo: {
        '@type': 'ImageObject',
        url: 'https://www.campusradarfunaab.com.ng/campusradar.svg',
      },
    },
    inLanguage: 'en',
  };
  return (
    <>
      <Header />
      <main className="container min-h-[65vh] max-w-4xl py-10 md:py-14">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(structuredData).replace(/</g, '\\u003c'),
          }}
        />
        <Link href="/radar" className="text-sm font-bold text-[#173B87] underline underline-offset-4">← Back to The Radar</Link>
        <article className="mt-7">
          <div className="flex flex-wrap items-center gap-3">
            <span className="kicker text-[var(--accent)]">{item.kind.replaceAll('_', ' ')}</span>
            <span className="kicker text-[var(--muted)]">{item.commercial_status === 'EDITORIAL' ? 'Editorial' : item.commercial_status.charAt(0) + item.commercial_status.slice(1).toLowerCase()}</span>
            {date && <span className="text-xs text-[var(--muted)]">{new Date(date).toLocaleDateString('en-NG', { day: 'numeric', month: 'long', year: 'numeric' })}</span>}
          </div>
          <h1 className="mt-4 text-4xl font-black leading-tight tracking-tight md:text-6xl">{item.title}</h1>
          {item.cover_image && <img src={item.cover_image} alt="" className="mt-8 max-h-[520px] w-full rounded-xl object-contain" />}
          <div className="mt-8 max-w-3xl">
            <p className="whitespace-pre-line text-lg leading-8 text-[var(--ink)]">{item.summary}</p>
            <RadarContactActions summary={item.summary} />
            {item.location && <p className="mt-5 text-sm font-semibold text-[var(--muted)]">Location · {item.location}</p>}
            {item.link && <a href={item.link} target="_blank" rel="noopener noreferrer" className="mt-6 inline-flex rounded-md bg-[#173B87] px-5 py-3 text-sm font-bold text-white hover:opacity-90">More information</a>}
          </div>
          <div className="mt-8 border-t border-[var(--line)] pt-6">
            <ShareActions title={item.title} text={item.summary} path={`/radar/${slug}`} />
          </div>
        </article>
      </main>
      <Footer />
    </>
  );
}
