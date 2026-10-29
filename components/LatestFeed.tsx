
'use client';

import { useEffect, useState } from 'react';

type FeedPost = {
  id: string;
  title: string;
  source: string;
  link: string;
  publishedAt: string | null;
  excerpt: string;
  image: string | null;
};

type FeedResponse = {
  posts: FeedPost[];
  sources: {
    source: string;
    available: boolean;
    error: string | null;
  }[];
};

export function LatestFeed() {
  const [posts, setPosts] = useState<FeedPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let active = true;

    async function loadFeed() {
      try {
        const response = await fetch('/api/feeds');

        if (!response.ok) {
          throw new Error('Unable to load feeds');
        }

        const data: FeedResponse = await response.json();

        if (active) {
          setPosts(data.posts ?? []);
          setFailed(false);
        }
      } catch {
        if (active) setFailed(true);
      } finally {
        if (active) setLoading(false);
      }
    }

    void loadFeed();

    return () => {
      active = false;
    };
  }, []);

  const visiblePosts = posts.slice(0, 2);

  return (
    <section className="bg-[#F8FAFC]">
      <div className="container py-6 md:py-8">
        <div className="flex flex-wrap items-end justify-between gap-3 border-b border-[var(--line)] pb-3">
          <div>
            <p className="kicker text-[var(--accent)]">
              From our platforms
            </p>
            <h2 className="mt-1 text-xl font-black md:text-2xl">
              Latest from Campus Radar
            </h2>
          </div>

          <span className="text-xs font-bold text-[var(--muted)]">
            SUBSTACK + BLOGGER
          </span>
        </div>

        {loading ? (
          <p className="py-6 text-sm text-[var(--muted)]">
            Loading recent posts…
          </p>
        ) : failed ? (
          <p className="py-6 text-sm text-[var(--muted)]">
            We couldn’t load the latest posts. Please try again later.
          </p>
        ) : visiblePosts.length === 0 ? (
          <p className="py-6 text-sm text-[var(--muted)]">
            No published posts are available yet.
          </p>
        ) : (
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            {visiblePosts.map((post) => (
              <article
                key={post.id}
                className="flex gap-3 border-b border-[var(--line)] py-3"
              >
                {post.image && (
                  <a
                    href={post.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={`Read ${post.title}`}
                    className="w-24 shrink-0 self-start overflow-hidden rounded-md bg-white sm:w-28"
                  >
                    <img
                      src={post.image}
                      alt=""
                      loading="lazy"
                      className="aspect-square w-full object-cover"
                    />
                  </a>
                )}

                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-[var(--accent)]">
                      {post.source}
                    </span>

                    {post.publishedAt && (
                      <time
                        dateTime={post.publishedAt}
                        className="text-[11px] text-[var(--muted)]"
                      >
                        {new Date(post.publishedAt).toLocaleDateString(
                          'en-GB',
                          {
                            day: 'numeric',
                            month: 'short',
                          }
                        )}
                      </time>
                    )}
                  </div>

                  <h3 className="mt-1 text-sm font-bold leading-snug sm:text-base">
                    <a
                      href={post.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hover:text-[#2457C5]"
                    >
                      {post.title}
                    </a>
                  </h3>

                  {post.excerpt && (
                    <p className="mt-1 line-clamp-2 text-xs leading-5 text-[var(--muted)]">
                      {post.excerpt}
                    </p>
                  )}

                  <a
                    href={post.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-2 inline-block text-xs font-bold text-[#173B87] underline underline-offset-4"
                  >
                    Read post →
                  </a>
                </div>
              </article>
            ))}
          </div>
        )}

        <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
          <p className="text-xs text-[var(--muted)]">
            A temporary home for posts published elsewhere.
          </p>
          <a
            href="https://campusradarfunaab.substack.com/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs font-bold text-[#173B87] underline underline-offset-4 hover:text-[var(--accent)]"
          >
            Visit Substack →
          </a>
        </div>
      </div>
    </section>
  );
}
