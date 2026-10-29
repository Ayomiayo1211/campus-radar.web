import Link from 'next/link';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';

export const dynamic = 'force-dynamic';

const API_BASE_URL =
  'https://campus-radar-data-api.campusradarfunaab.workers.dev';

type Story = {
  id: string;
  slug: string;
  title: string;
  excerpt: string | null;
  authorName: string | null;
  publishedAt: string | null;
};

async function getStories(): Promise<Story[]> {
  try {
    const response = await fetch(`${API_BASE_URL}/stories?limit=25`, {
      cache: 'no-store',
    });

    if (!response.ok) {
      console.error(`Campus Radar API returned ${response.status} for /stories`);
      return [];
    }

    const data = (await response.json()) as { stories?: Story[] };
    return Array.isArray(data.stories) ? data.stories : [];
  } catch (error) {
    console.error('Unable to fetch news from Campus Radar API', error);
    return [];
  }
}

function formatDate(value: string | null): string {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleDateString('en-NG', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    timeZone: 'Africa/Lagos',
  });
}

export default async function NewsPage() {
  const stories = (await getStories()).filter(
    (story) => story.publishedAt !== null
  );

  return (
    <>
      <Header />

      <main className="container min-h-screen py-6">
        <div className="mb-6 border-b-2 border-[#173B87] pb-3">
          <p className="kicker mb-2 text-[var(--muted)]">CAMPUS RADAR</p>
          <h1 className="text-3xl font-black tracking-tight text-[#173B87]">
            Latest News
          </h1>
          <p className="mt-2 text-sm text-[var(--muted)]">
            News and updates from FUNAAB and beyond.
          </p>
        </div>

        {stories.length > 0 ? (
          <div className="divide-y divide-[var(--line)]">
            {stories.map((story) => (
              <article key={story.id} className="py-5 first:pt-0">
                <Link href={`/news/${story.slug}`} className="group block">
                  <h2 className="text-xl font-bold leading-snug group-hover:text-[#173B87]">
                    {story.title}
                  </h2>
                  {story.excerpt && (
                    <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
                      {story.excerpt}
                    </p>
                  )}
                </Link>

                <div className="mt-3 flex flex-wrap gap-x-3 text-xs text-[var(--muted)]">
                  <span>{story.authorName || 'Campus Radar'}</span>
                  {story.publishedAt && (
                    <time dateTime={story.publishedAt}>
                      {formatDate(story.publishedAt)}
                    </time>
                  )}
                </div>
              </article>
            ))}
          </div>
        ) : (
          <p className="py-8 text-sm text-[var(--muted)]">
            News is temporarily unavailable or no stories have been published yet.
          </p>
        )}
      </main>

      <Footer />
    </>
  );
}
