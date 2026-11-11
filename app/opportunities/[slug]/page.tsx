import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { ShareActions } from '@/components/ShareActions';
import { CountdownTimer } from '@/components/CountdownTimer';
import { getSupabaseAdmin } from '@/lib/server/supabase';

export const dynamic = 'force-dynamic';

type PageProps = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const now = new Date().toISOString();
  const { data: opportunity } = await getSupabaseAdmin()
    .from('opportunities')
    .select('slug,title,organisation,type,description,deadline,application_url')
    .eq('slug', slug)
    .eq('status', 'PUBLISHED')
    .or(`deadline.is.null,deadline.gt.${now}`)
    .maybeSingle();

  if (!opportunity) return { title: { absolute: 'Opportunity not found | Campus Radar' } };

  const title = opportunity.title;
  const description = (opportunity.description || `Explore this opportunity from ${opportunity.organisation || 'Campus Radar'}.`).slice(0, 300);
  const canonical = `/opportunities/${slug}`;

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
    },
    twitter: {
      card: 'summary',
      title,
      description,
    },
  };
}

export default async function OpportunityPage({ params }: PageProps) {
  const { slug } = await params;
  const now = new Date().toISOString();
  const { data: opportunity, error } = await getSupabaseAdmin()
    .from('opportunities')
    .select('id,slug,title,organisation,type,description,deadline,application_url,commercial_status')
    .eq('slug', slug)
    .eq('status', 'PUBLISHED')
    .or(`deadline.is.null,deadline.gt.${now}`)
    .maybeSingle();

  if (error) console.error('Could not load opportunity detail:', error.message);
  if (!opportunity) notFound();

  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    name: opportunity.title,
    description: opportunity.description,
    url: `https://www.campusradarfunaab.com.ng/opportunities/${encodeURIComponent(slug)}`,
    publisher: {
      '@type': 'Organization',
      name: 'Campus Radar',
      url: 'https://www.campusradarfunaab.com.ng/',
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
        <Link href="/opportunities" className="text-sm font-bold text-[#173B87] underline underline-offset-4">← Back to Opportunities</Link>
        {opportunity.deadline && <CountdownTimer date={opportunity.deadline} kind="deadline" />}
        <article className="mt-5">
          <div className="flex flex-wrap items-center gap-3">
            <span className="kicker text-[var(--accent)]">{opportunity.type.replaceAll('_', ' ')}</span>
            {opportunity.commercial_status !== 'EDITORIAL' && <span className="kicker text-[var(--muted)]">{opportunity.commercial_status.charAt(0) + opportunity.commercial_status.slice(1).toLowerCase()}</span>}
          </div>
          <h1 className="mt-4 text-4xl font-black leading-tight tracking-tight md:text-6xl">{opportunity.title}</h1>
          <p className="mt-4 text-lg font-bold text-[var(--muted)]">{opportunity.organisation}</p>
          <div className="mt-8 max-w-3xl">
            <p className="whitespace-pre-line text-lg leading-8 text-[var(--ink)]">{opportunity.description}</p>
            {opportunity.deadline && <><p className="mt-7 border-t border-[var(--line)] pt-5 text-sm font-bold text-[var(--muted)]">APPLICATION DEADLINE · {new Date(opportunity.deadline).toLocaleDateString('en-NG', { day: 'numeric', month: 'long', year: 'numeric' })}</p></>}
            {opportunity.application_url && <a href={opportunity.application_url} target="_blank" rel="noopener noreferrer" className="mt-6 inline-flex rounded-md bg-[#173B87] px-5 py-3 text-sm font-bold text-white hover:opacity-90">Apply / Learn more</a>}
          </div>
          <div className="mt-8 border-t border-[var(--line)] pt-6">
            <ShareActions title={opportunity.title} text={opportunity.description} path={`/opportunities/${slug}`} />
          </div>
        </article>
      </main>
      <Footer />
    </>
  );
}
