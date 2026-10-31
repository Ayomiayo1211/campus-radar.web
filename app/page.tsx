
import Link from 'next/link';
import { EditorialSpotlight } from '@/components/EditorSpotlight';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { StoryCard } from '@/components/StoryCard';
import { LatestFeed } from '@/components/LatestFeed';
import { getSupabaseAdmin } from '@/lib/server/supabase';

export const dynamic = 'force-dynamic';

export default async function Home() {
  const { data: rows, error } = await getSupabaseAdmin()
    .from('stories')
    .select('id,slug,title,excerpt,content_type,author_name,published_at,origin,commercial_status,cover_image')
    .eq('status', 'PUBLISHED')
    .in('content_type', ['NEWS', 'News'])
    .not('published_at', 'is', null)
    .order('published_at', { ascending: false })
    .order('created_at', { ascending: false })
    .limit(8);

  if (error) console.error('Home page stories query failed:', error.message);
  const publishedStories = (rows ?? []).map((story) => ({
    id: story.id, slug: story.slug, title: story.title, excerpt: story.excerpt,
    contentType: story.content_type, authorName: story.author_name,
    publishedAt: story.published_at ? new Date(story.published_at) : null,
    origin: story.origin, commercialStatus: story.commercial_status,
    coverImage: story.cover_image,
  }));

  const topStories = publishedStories.slice(0, 3);
  const latestStories = publishedStories.slice(3, 8);

  const formatDate = (date: Date | null) =>
    date
      ? date.toLocaleDateString('en-NG', {
          day: 'numeric',
          month: 'short',
          year: 'numeric',
        })
      : '';

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
                    excerpt: topStories[0].excerpt,
                    category: 'News',
                    author: topStories[0].authorName,
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
                    <Link
                      href={`/news/${story.slug}`}
                      className="group block"
                    >
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

        {/* The Radar - Coming Soon */}
        <section className="container py-6">
          <div className="mb-3 border-b border-[var(--line)] pb-2">
            <p className="kicker text-[#173B87]">Quick updates</p>
            <h2 className="text-xl font-black">The Radar</h2>
          </div>

          <div className="rounded-lg border border-[var(--line)] bg-[#F8FAFC] px-5 py-6 text-center">
            <p className="text-sm font-bold text-[#173B87]">
              Coming Soon
            </p>
            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-[var(--muted)]">
              We’re preparing a dedicated space for campus updates,
              announcements and events. Check back soon.
            </p>
          </div>
        </section>

        {/* Opportunities - Coming Soon */}
        <section className="border-y border-[var(--line)] bg-white">
          <div className="container py-6">
            <div className="mb-3 border-b border-[var(--line)] pb-2">
              <p className="kicker text-[#173B87]">For students</p>
              <h2 className="text-xl font-black">Opportunities</h2>
            </div>

            <div className="rounded-lg border border-[var(--line)] bg-[#F8FAFC] px-5 py-6 text-center">
              <p className="text-sm font-bold text-[#173B87]">
                Coming Soon
              </p>
              <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-[var(--muted)]">
                We’re working on a collection of scholarships,
                internships, fellowships and other opportunities
                for FUNAAB students. Check back soon.
              </p>
            </div>
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
