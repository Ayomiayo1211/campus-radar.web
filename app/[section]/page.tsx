import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import {
  formatPublicDate,
  getPublicOpportunities,
  getPublicRadar,
  getPublicStories,
  type PublicStory,
} from '@/lib/public-content';

export const dynamic = 'force-dynamic';

type SectionProps = { params: Promise<{ section: string }> };

export default async function SectionPage({ params }: SectionProps) {
  const { section } = await params;

  if (section === 'radar') {
    const items = await getPublicRadar();
    return (
      <Page title="The Radar" kicker="What's happening">
        <p className="mb-8 max-w-2xl text-lg leading-8 text-[var(--muted)]">
          The campus pulse: verified updates, announcements and useful information for the FUNAAB community.
        </p>
        {items.length ? (
          <div className="grid gap-4">
            {items.map((item) => (
              <article className="card p-6" key={item.id}>
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <span className="kicker text-[var(--accent)]">{item.kind.replaceAll('_', ' ')}</span>
                  <time className="text-xs text-[var(--muted)]">{formatPublicDate(item.publishedAt)}</time>
                </div>
                <h2 className="mt-2 text-2xl font-black">{item.title}</h2>
                <p className="mt-2 max-w-3xl text-sm leading-6 text-[var(--muted)]">{item.summary}</p>
                {(item.location || item.eventDate || item.link) && (
                  <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-[var(--line)] pt-4 text-xs text-[var(--muted)]">
                    {item.eventDate && <span>{formatPublicDate(item.eventDate, 'long')}</span>}
                    {item.location && <span>{item.location}</span>}
                    {item.link && <a href={item.link} target="_blank" rel="noreferrer" className="font-bold text-[var(--ink)] underline">More information</a>}
                  </div>
                )}
              </article>
            ))}
          </div>
        ) : <EmptyState message="There are no published Radar updates at the moment." />}
      </Page>
    );
  }

  if (section === 'opportunities') {
    const items = await getPublicOpportunities();
    return (
      <Page title="Opportunities" kicker="Useful information">
        <p className="mb-8 max-w-2xl text-lg leading-8 text-[var(--muted)]">
          Scholarships, internships, fellowships, competitions and programmes worth knowing about.
        </p>
        {items.length ? (
          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {items.map((item) => {
              const expired = item.deadline ? new Date(item.deadline).getTime() < Date.now() : false;
              return (
                <article className="card flex flex-col p-6" key={item.id}>
                  <div className="flex items-center justify-between gap-3">
                    <span className="kicker text-[var(--accent)]">{item.type.replaceAll('_', ' ')}</span>
                    {expired && <span className="kicker text-[var(--muted)]">Deadline passed</span>}
                  </div>
                  <h2 className="mt-3 text-2xl font-black">{item.title}</h2>
                  <p className="mt-2 text-sm font-bold">{item.organisation}</p>
                  <p className="mt-4 flex-1 text-sm leading-6 text-[var(--muted)]">{item.description}</p>
                  {item.deadline && (
                    <p className="mt-6 border-t border-[var(--line)] pt-4 text-xs font-bold">
                      DEADLINE · {formatPublicDate(item.deadline, 'long')}
                    </p>
                  )}
                  {item.applicationUrl && (
                    <a href={item.applicationUrl} target="_blank" rel="noreferrer" className="mt-4 inline-flex text-sm font-bold underline">
                      {expired ? 'View opportunity details' : 'View application'}
                    </a>
                  )}
                </article>
              );
            })}
          </div>
        ) : <EmptyState message="No opportunities have been published yet." />}
      </Page>
    );
  }

  const config = section === 'features'
    ? { title: 'Features', type: 'FEATURE' as const, intro: 'Profiles, interviews, explainers and stories from across the campus community.' }
    : section === 'opinion'
      ? { title: 'Opinion', type: 'OPINION' as const, intro: 'Commentary and perspectives from the Campus Radar community.' }
      : null;

  if (!config) notFound();
  const stories = await getPublicStories(config.type);

  return (
    <Page title={config.title} kicker="Campus Radar">
      <p className="mb-8 max-w-2xl text-lg leading-8 text-[var(--muted)]">{config.intro}</p>
      {stories.length ? (
        <div className="grid gap-6 md:grid-cols-2">
          {stories.map((story) => <StoryCard key={story.id} story={story} />)}
        </div>
      ) : <EmptyState message={`No ${config.title.toLowerCase()} have been published yet.`} />}
    </Page>
  );
}

function StoryCard({ story }: { story: PublicStory }) {
  return (
    <article className="card overflow-hidden">
      {story.coverImage && (
        <Link href={`/news/${story.slug}`} className="block aspect-[16/9] overflow-hidden bg-[var(--line)]">
          <img src={story.coverImage} alt="" loading="lazy" className="h-full w-full object-cover transition duration-300 hover:scale-[1.02]" />
        </Link>
      )}
      <div className="p-6">
        <p className="kicker text-[var(--accent)]">{story.contentType.replaceAll('_', ' ')}</p>
        <h2 className="mt-2 text-2xl font-black leading-tight">
          <Link href={`/news/${story.slug}`} className="hover:underline">{story.title}</Link>
        </h2>
        {story.excerpt && <p className="mt-3 text-sm leading-6 text-[var(--muted)]">{story.excerpt}</p>}
        <div className="mt-5 flex flex-wrap gap-3 text-xs text-[var(--muted)]">
          <span>{story.authorName || 'Campus Radar'}</span>
          {story.publishedAt && <time>{formatPublicDate(story.publishedAt)}</time>}
        </div>
      </div>
    </article>
  );
}

function EmptyState({ message }: { message: string }) {
  return <p className="border-y border-[var(--line)] py-10 text-sm text-[var(--muted)]">{message}</p>;
}

function Page({ title, kicker, children }: { title: string; kicker: string; children: React.ReactNode }) {
  return (
    <>
      <Header />
      <main className="container min-h-[65vh] py-12">
        <div className="border-b border-black pb-6">
          <div className="kicker text-[var(--accent)]">{kicker}</div>
          <h1 className="mt-1 text-5xl font-black tracking-tight md:text-6xl">{title}</h1>
        </div>
        <div className="mt-8">{children}</div>
      </main>
      <Footer />
    </>
  );
}
