
'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

type Story = {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  contentType: string;
  status: string;
  featured: boolean;
  authorName: string;
  publishedAt: string | null;
  createdAt: string;
};

type StoriesResponse = {
  data?: Story[];
  error?: string;
};

export default function StoriesPage() {
  const [stories, setStories] = useState<Story[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  async function loadStories() {
    try {
      setLoading(true);
      setError('');

      const response = await fetch('/api/stories?admin=true');

      const result = (await response.json()) as StoriesResponse;

      if (!response.ok) {
        throw new Error(result.error || 'Failed to load stories');
      }

      setStories(result.data ?? []);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Something went wrong'
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadStories();
  }, []);

  return (
    <main className="min-h-screen bg-white px-6 py-10">
      <div className="mx-auto max-w-6xl">
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-medium uppercase tracking-wide text-gray-500">
              Campus Radar
            </p>
            <h1 className="mt-2 text-3xl font-bold text-black">
              Stories
            </h1>
            <p className="mt-2 text-gray-600">
              Create and manage newsroom stories.
            </p>
          </div>

          <Link
            href="/admin/stories/new"
            className="rounded-lg bg-black px-4 py-2 text-sm font-medium text-white hover:bg-gray-800"
          >
            New Story
          </Link>
        </div>

        {error && (
          <div className="mb-6 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {error}
          </div>
        )}

        <section className="rounded-xl border border-gray-200 bg-white">
          <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
            <div>
              <h2 className="font-semibold text-black">All Stories</h2>
              <p className="text-sm text-gray-500">
                News, features, opinion and Radar stories.
              </p>
            </div>

            <button
              type="button"
              onClick={() => void loadStories()}
              className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium hover:bg-gray-50"
            >
              Refresh
            </button>
          </div>

          {loading ? (
            <div className="px-6 py-10 text-center text-gray-500">
              Loading stories...
            </div>
          ) : stories.length === 0 ? (
            <div className="px-6 py-10 text-center text-gray-500">
              No stories yet.
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {stories.map((story) => (
                <article key={story.id} className="p-6">
                  <div className="flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
                    <div className="min-w-0">
                      <div className="mb-2 flex flex-wrap items-center gap-2">
                        <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-medium uppercase">
                          {story.contentType}
                        </span>

                        <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-medium">
                          {story.status}
                        </span>

                        {story.featured && (
                          <span className="rounded-full bg-black px-3 py-1 text-xs font-medium text-white">
                            Featured
                          </span>
                        )}
                      </div>

                      <h3 className="text-lg font-semibold text-black">
                        {story.title}
                      </h3>

                      <p className="mt-2 text-sm leading-6 text-gray-600">
                        {story.excerpt}
                      </p>

                      <div className="mt-4 text-xs text-gray-500">
                        <p>By {story.authorName}</p>
                        <p className="mt-1">
                          Created{' '}
                          {new Date(story.createdAt).toLocaleString()}
                        </p>
                      </div>
                    </div>

                    <Link
                      href={`/admin/stories/${story.id}`}
                      className="shrink-0 rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium hover:bg-gray-50"
                    >
                      Edit
                    </Link>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
