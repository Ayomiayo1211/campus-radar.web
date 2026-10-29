
import Link from 'next/link';
import { EditorialSpotlight } from '@/components/EditorSpotlight';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { StoryCard } from '@/components/StoryCard';
import { LatestFeed } from '@/components/LatestFeed';

export const dynamic = 'force-dynamic';

const API_BASE_URL =
  'https://campus-radar-data-api.campusradarfunaab.workers.dev';

type Story = {
  id: string;
  slug: string;
  title: string;
  excerpt: string | null;
  contentType: string;
  authorName: string | null;
  coverImage: string | null;
  publishedAt: string | null;
};

type RadarItem = {
  id: string;
  slug: string;
  title: string;
  summary: string | null;
  kind: string;
  eventDate: string | null;
  location: string | null;
  link: string | null;
  publishedAt: string | null;
};

type Opportunity = {
  id: string;
  slug: string;
  title: string;
  organisation: string | null;
  type: string;
  description: string | null;
  deadline: string | null;
  applicationUrl: string | null;
};

async function fetchContent<T>(path: string, key: string): Promise<T[]> {
  try {
    const response = await fetch(`${API_BASE_URL}${path}`, {
      cache: 'no-store',
    });

    if (!response.ok) {
      console.error(`Campus Radar API returned ${response.status} for ${path}`);
      return [];
    }

    const data = (await response.json()) as Record<string, unknown>;
    const items = data[key];

    return Array.isArray(items) ? (items as T[]) : [];
  } catch (error) {
    console.error(`Unable to fetch ${path} from Campus Radar API`, error);
    return [];
  }
}

const formatDate = (value: string | null) => {
  if (!value) return '';

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return '';

  return date.toLocaleDateString('en-NG', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    timeZone: 'Africa/Lagos',
  });
};

export default async function Home() {
  const [allStories, radarItems, opportunities] = await Promise.all([
    fetchContent<Story>('/stories?limit=25', 'stories'),
    fetchContent<RadarItem>('/radar?limit=5', 'items'),
    fetchContent<Opportunity>('/opportunities?limit=5', 'opportunities'),
  ]);

  const publishedStories = allStories
    .filter(
      (story) =>
        ['NEWS', 'News'].includes(story.contentType) &&
        story.publishedAt !== null
    )
    .slice(0, 8);

  const topStories = publishedStories.slice(0, 3);
  const latestStories = publishedStories.slice(3, 8);

  return (
    <>
      <Header />
      <EditorialSpotlight />

      <main>
        {/* Top Stories */}
        <section className="container py-4">
          <div className="mb-4 flex items-center justify-between border-b-2 border-[#173B87] pb-2">
            <h1 className="text-lg font-black tracking-tight text-[#173B87]">
              Top Stories
            </h1>
            <span className="kicker text-[var(--muted)]">
              Campus &amp; beyond
            </span>
          </div>

          {topStories.length > 0 ? (
            <div className="grid gap-5 md:grid-cols-[1.5fr_1fr]">
              <div>
                <StoryCard
                  story={{
                    id: topStories[0].id,
                    slug: topStories[0].slug,
                    title: topStories[0].title,
                    excerpt: topStories[0].excerpt ?? '',
                    category: 'News',
                   author: topStories[0].authorName ?? 'Campus Radar',
                    date: formatDate(topStories[0].publishedAt),
                    readTime: '',
                    origin: 'Editorial',
                    commercialStatus: 'Editorial',
                    image: topStories[0].coverImage ?? undefined,
                  }}
                />
              </div>

              <div className="grid content-start divide-y divide-[var(--line)]">
                {topStories.slice(1).map((story) => (
                  <article key={story.id} className="py-3 first:pt-0">
                    <Link href={`/news/${story.slug}`} className="group block">
                      <p className="kicker text-[var(--muted)]">
                        {formatDate(story.publishedAt)}
                      </p>
                      <h2 className="mt-1 text-base font-bold leading-snug group-hover:text-[#173B87]">
                        {story.title}
                      </h2>
                      <p className="mt-1 line-clamp-2 text-sm text-[var(--muted)]">
                        {story.excerpt}
                      </p>
                    </Link>
                  </article>
                ))}
              </div>
            </div>
          ) : (
            <p className="py-4 text-sm text-[var(--muted)]">
              Published news stories will appear here.
            </p>
          )}
        </section>

        {/* Latest News */}
        <section className="container py-6">
          <div className="mb-3 flex items-center justify-between border-b border-[var(--line)] pb-2">
            <h2 className="text-xl font-black">Latest News</h2>
            <Link
              href="/news"
              className="text-sm font-bold text-[#173B87] underline underline-offset-4"
            >
              View all
            </Link>
          </div>

          {latestStories.length > 0 ? (
            <div className="divide-y divide-[var(--line)]">
              {latestStories.map((story) => (
                <Link
                  href={`/news/${story.slug}`}
                  key={story.id}
                  className="block py-3 transition-colors hover:text-[#173B87]"
                >
                  <p className="text-xs text-[var(--muted)]">
                    {formatDate(story.publishedAt)}
                  </p>
                  <h3 className="mt-1 text-base font-bold leading-snug">
                    {story.title}
                  </h3>
                  <p className="mt-1 text-sm text-[var(--muted)]">
                    {story.excerpt}
                  </p>
                </Link>
              ))}
            </div>
          ) : (
            <p className="py-4 text-sm text-[var(--muted)]">
              More news will appear here as stories are published.
            </p>
          )}
        </section>

        {/* External publishing feeds */}
        <section className="border-y border-[var(--line)] bg-[#F8FAFC] py-2">
          <LatestFeed />
        </section>

        {/* The Radar */}
        <section className="container py-6">
          <div className="mb-3 flex items-center justify-between border-b border-[var(--line)] pb-2">
            <div>
              <p className="kicker text-[#173B87]">Quick updates</p>
              <h2 className="text-xl font-black">The Radar</h2>
            </div>
            <Link
              href="/radar"
              className="text-sm font-bold text-[#173B87] underline underline-offset-4"
            >
              View all
            </Link>
          </div>

          {radarItems.length > 0 ? (
            <div className="divide-y divide-[var(--line)]">
              {radarItems.map((item) => (
                <article key={item.id} className="py-3">
                  <p className="kicker text-[var(--muted)]">
                    {item.kind} {item.publishedAt ? `· ${formatDate(item.publishedAt)}` : ''}
                  </p>
                  <h3 className="mt-1 font-bold leading-snug">
                    {item.link ? (
                      <a href={item.link} className="hover:text-[#173B87]">
                        {item.title}
                      </a>
                    ) : (
                      item.title
                    )}
                  </h3>
                  {item.summary && (
                    <p className="mt-1 text-sm text-[var(--muted)]">
                      {item.summary}
                    </p>
                  )}
                  {(item.eventDate || item.location) && (
                    <p className="mt-1 text-xs text-[var(--muted)]">
                      {item.eventDate ? formatDate(item.eventDate) : ''}
                      {item.eventDate && item.location ? ' · ' : ''}
                      {item.location ?? ''}
                    </p>
                  )}
                </article>
              ))}
            </div>
          ) : (
            <p className="py-4 text-sm text-[var(--muted)]">
              Published campus updates will appear here.
            </p>
          )}
        </section>

        {/* Opportunities */}
        <section className="border-y border-[var(--line)] bg-white">
          <div className="container py-6">
            <div className="mb-3 flex items-center justify-between border-b border-[var(--line)] pb-2">
              <div>
                <p className="kicker text-[#173B87]">For students</p>
                <h2 className="text-xl font-black">Opportunities</h2>
              </div>
              <Link
                href="/opportunities"
                className="text-sm font-bold text-[#173B87] underline underline-offset-4"
              >
                View all
              </Link>
            </div>

            {opportunities.length > 0 ? (
              <div className="grid gap-4 sm:grid-cols-2">
                {opportunities.map((opportunity) => (
                  <article
                    key={opportunity.id}
                    className="rounded-lg border border-[var(--line)] p-4"
                  >
                    <p className="kicker text-[#173B87]">
                      {opportunity.type}
                    </p>
                    <h3 className="mt-2 font-bold leading-snug">
                      {opportunity.title}
                    </h3>
                    {opportunity.organisation && (
                      <p className="mt-1 text-sm text-[var(--muted)]">
                        {opportunity.organisation}
                      </p>
                    )}
                    {opportunity.description && (
                      <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
                        {opportunity.description}
                      </p>
                    )}
                    {opportunity.deadline && (
                      <p className="mt-3 text-xs font-semibold">
                        Deadline: {formatDate(opportunity.deadline)}
                      </p>
                    )}
                    {opportunity.applicationUrl && (
                      <a
                        href={opportunity.applicationUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-3 inline-block text-sm font-bold text-[#173B87] underline underline-offset-4"
                      >
                        View opportunity
                      </a>
                    )}
                  </article>
                ))}
              </div>
            ) : (
              <p className="py-4 text-sm text-[var(--muted)]">
                Published opportunities will appear here.
              </p>
            )}
          </div>
        </section>

        {/* Secondary destinations */}
        <section className="container py-6">
          <div className="flex flex-wrap items-center justify-between gap-4 rounded-lg border border-[var(--line)] bg-[#F8FAFC] p-4">
            <div>
              <h2 className="font-black text-[#173B87]">
                More from Campus Radar
              </h2>
              <p className="mt-1 text-sm text-[var(--muted)]">
                Stories, conversations and confidential tips.
              </p>
            </div>

            <div className="flex flex-wrap gap-x-4 gap-y-2 text-sm font-bold text-[#173B87]">
              <Link href="/features" className="hover:text-[var(--accent)]">
                Features
              </Link>
              <Link href="/opinion" className="hover:text-[var(--accent)]">
                Opinion
              </Link>
              <Link href="/podcast" className="hover:text-[var(--accent)]">
                Podcast
              </Link>
              <Link href="/confidential" className="hover:text-[var(--accent)]">
                Confidential
              </Link>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </>
  );
}
