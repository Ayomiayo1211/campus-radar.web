
import Link from 'next/link';
import { getSupabaseAdmin } from '@/lib/server/supabase';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';

export const dynamic = 'force-dynamic';

export default async function NewsPage() {
  const { data: rows, error } = await getSupabaseAdmin()
    .from('stories')
    .select('id,slug,title,excerpt,author_name,published_at')
    .eq('status', 'PUBLISHED')
    .eq('content_type', 'NEWS')
    .order('published_at', { ascending: false });
  if (error) console.error('News page query failed:', error.message);
  const stories = (rows ?? []).map((story) => ({
    ...story,
    authorName: story.author_name,
    publishedAt: story.published_at ? new Date(story.published_at) : null,
  }));

  return (
    <>
      <Header />

      <main className="container min-h-screen py-6">
        <div className="mb-6 border-b-2 border-[#173B87] pb-3">
          <p className="kicker mb-2 text-[var(--muted)]">
            CAMPUS RADAR
          </p>
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
                <Link
                  href={`/news/${story.slug}`}
                  className="group block"
                >
                  <h2 className="text-xl font-bold leading-snug group-hover:text-[#173B87]">
                    {story.title}
                  </h2>

                  <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
                    {story.excerpt}
                  </p>
                </Link>

                <div className="mt-3 flex flex-wrap gap-x-3 text-xs text-[var(--muted)]">
                  <span>{story.authorName}</span>
                  {story.publishedAt && (
                    <time dateTime={story.publishedAt.toISOString()}>
                      {story.publishedAt.toLocaleDateString('en-NG', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </time>
                  )}
                </div>
              </article>
            ))}
          </div>
        ) : (
          <p className="py-8 text-sm text-[var(--muted)]">
            No news articles have been published yet. Check back soon.
          </p>
        )}
      </main>

      <Footer />
    </>
  );
}
