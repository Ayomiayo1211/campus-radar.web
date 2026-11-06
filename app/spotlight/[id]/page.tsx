import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { getSupabaseAdmin } from '@/lib/server/supabase';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { ArticleShare } from '@/components/ArticleShare';
import { ArticleEngagement } from '@/components/ArticleEngagement';

export const dynamic = 'force-dynamic';

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

  const canonical = `https://campus-radar-v1.campusradarfunaab.workers.dev/spotlight/${data.id}`;
  return {
    title: `${data.title} | Campus Radar Spotlight`,
    description: data.excerpt,
    alternates: { canonical },
    openGraph: {
      type: 'article',
      title: data.title,
      description: data.excerpt,
      url: canonical,
      siteName: 'Campus Radar',
      images: data.image_url ? [{ url: data.image_url }] : undefined,
    },
    twitter: {
      card: data.image_url ? 'summary_large_image' : 'summary',
      title: data.title,
      description: data.excerpt,
      images: data.image_url ? [data.image_url] : undefined,
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
        <Link href="/spotlight" className="text-sm font-bold text-[#173B87] hover:underline">
          ← Back to Current Spotlight
        </Link>
        <article className="mt-8">
          <p className="text-xs font-bold uppercase tracking-widest text-[#B52E35]">
            Campus Radar presents
          </p>
          <h1 className="mt-2 text-4xl font-black text-[#173B87]">SPOTLIGHT.</h1>
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
