import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { StoryCard } from '@/components/StoryCard';
import { stories, opportunities, radarItems } from '@/lib/data';
import { notFound } from 'next/navigation';
import Link from 'next/link';

const storySections = {
  news: ['News', stories.filter(s => s.category === 'News')],
  features: ['Features', stories.filter(s => s.category === 'Features')],
  opinion: ['Opinion', stories.filter(s => s.category === 'Opinion')],
} as const;

export default async function Section({ params }: { params: Promise<{ section: string }> }) {
  const { section } = await params;
  if (section === 'radar') return <RadarPage />;
  if (section === 'opportunities') return <OpportunitiesPage />;
  if (section === 'events') notFound();
  const config = storySections[section as keyof typeof storySections];
  if (!config) notFound();
  return <Page title={config[0]} kicker="Campus Radar"><div className="grid gap-5 md:grid-cols-2">{config[1].map(s => <StoryCard key={s.id} story={s} />)}</div></Page>;
}

function RadarPage() {
  return <Page title="The Radar" kicker="What's happening"><div className="mb-8 max-w-2xl"><p className="text-lg leading-8 text-[var(--muted)]">The campus pulse: events, updates, announcements and useful things students should know. The Radar is information, not automatically editorial reporting.</p></div><div className="grid gap-4">{radarItems.map(item => <Link href="/radar" key={item.id} className="card p-6 transition hover:border-black"><div className="flex flex-wrap items-center justify-between gap-3"><div className="flex gap-3"><span className="kicker text-[var(--accent)]">{item.kind}</span><span className="kicker text-[var(--muted)]">{item.status}</span></div><span className="text-xs text-[var(--muted)]">{item.date}</span></div><h2 className="mt-2 text-2xl font-black">{item.title}</h2><p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--muted)]">{item.summary}</p></Link>)}</div></Page>;
}

function OpportunitiesPage() {
  return <Page title="Opportunities" kicker="Useful information"><div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">{opportunities.map(o => <div className="card p-6" key={o.id}><div className="flex items-center justify-between gap-3"><span className="kicker text-[var(--accent)]">{o.type}</span>{o.status !== 'Editorial' && <span className="kicker text-[var(--muted)]">{o.status}</span>}</div><h2 className="mt-3 text-2xl font-black">{o.title}</h2><p className="mt-2 text-sm font-bold">{o.organisation}</p><p className="mt-4 text-sm leading-6 text-[var(--muted)]">{o.description}</p><div className="mt-6 border-t border-[var(--line)] pt-4 text-xs font-bold">DEADLINE · {o.deadline}</div></div>)}</div></Page>;
}

function Page({ title, kicker, children }: { title: string; kicker: string; children: React.ReactNode }) {
  return <><Header /><main className="container min-h-[65vh] py-12"><div className="border-b border-black pb-6"><div className="kicker text-[var(--accent)]">{kicker}</div><h1 className="mt-1 text-5xl font-black tracking-tight md:text-6xl">{title}</h1></div><div className="mt-8">{children}</div></main><Footer /></>;
}
