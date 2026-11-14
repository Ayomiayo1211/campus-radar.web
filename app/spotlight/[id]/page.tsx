import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { getSupabaseAdmin } from '@/lib/server/supabase';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { ArticleShare } from '@/components/ArticleShare';
import { ArticleEngagement } from '@/components/ArticleEngagement';

export const dynamic = 'force-dynamic';

const SITE_URL = 'https://www.campusradarfunaab.com.ng';
const DEFAULT_SOCIAL_IMAGE = '/campus-radar-og.svg';

type Props = { params: Promise<{ id: string }> };

async function getSpotlight(id: string) {
  const { data, error } = await (getSupabaseAdmin() as any)
    .from('spotlights')
    .select('id,title,excerpt,body,image_url,author_name,published_at')
    .eq('id', id)
    .eq('status', 'PUBLISHED')
    .maybeSingle();

  if (error) throw new Error('Could not load Spotlight');
  return data;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const data = await getSpotlight(id);
  if (!data) return { title: 'Spotlight | Campus Radar' };

  const canonical = `${SITE_URL}/spotlight/${data.id}`;
  const description = data.excerpt || `Read ${data.title} on Campus Radar.`;
  const image = data.image_url || DEFAULT_SOCIAL_IMAGE;
  const imageUrl = image.startsWith('http') ? image : `${SITE_URL}${image}`;

  return {
    title: `${data.title} | Campus Radar Spotlight`,
    description,
    alternates: { canonical },
    openGraph: {
      type: 'article',
      title: data.title,
      description,
      url: canonical,
      siteName: 'Campus Radar',
      publishedTime: data.published_at || undefined,
      authors: data.author_name ? [data.author_name] : undefined,
      images: [{ url: imageUrl, width: 1200, height: 630, alt: data.title }],
    },
    twitter: {
      card: 'summary_large_image',
      title: data.title,
      description,
      images: [imageUrl],
    },
  };
}

export default async function SharedSpotlightPage({ params }: Props) {
  const { id } = await params;
  const data = await getSpotlight(id);
  if (!data) notFound();

  const sharePath = `/spotlight/${data.id}`;

  return (
    <>
      <Header />
      <main className="container min-h-screen max-w-4xl py-8">
        <Link href="/spotlight" className="spotlight-back text-sm font-bold hover:underline">
          ← Back to Current Spotlight
        </Link>
        <article className="spotlight-content mt-8">
          <p className="spotlight-page-eyebrow text-xs font-bold uppercase tracking-widest">
            Campus Radar presents
          </p>
          <h1 className="spotlight-page-heading mt-2 text-4xl font-black">SPOTLIGHT.</h1>
          {data.image_url && (
            <img
              src={data.image_url}
              alt={data.title}
              className="mt-8 max-h-[520px] w-full rounded-2xl object-cover"
            />
          )}
          <h2 className="mt-8 text-3xl font-bold text-[var(--ink)]">{data.title}</h2>
          <p className="mt-3 text-lg leading-8 text-[var(--muted)]">{data.excerpt}</p>
          <div className="my-6 flex flex-wrap items-center justify-between gap-3 border-y border-[var(--line)] py-4">
            <p className="text-xs font-semibold uppercase tracking-widest text-[var(--muted)]">
              Featuring {data.author_name}
            </p>
            <ArticleShare title={data.title} excerpt={data.excerpt || ''} shortCode="" sharePath={sharePath} />
          </div>
          <div className="prose prose-lg mt-8 max-w-none whitespace-pre-wrap text-[var(--ink)]">
            {data.body}
          </div>
          <div className="mt-10 border-t border-[var(--line)] pt-6">
            <ArticleShare title={data.title} excerpt={data.excerpt || ''} shortCode="" sharePath={sharePath} />
          </div>
          <ArticleEngagement spotlightId={data.id} />
        </article>
      </main>
      <Footer />
    </>
  );
}
