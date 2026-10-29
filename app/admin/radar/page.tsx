'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

type RadarItem = {
  id: string;
  slug: string;
  title: string;
  summary: string;
  kind: string;
  origin: string;
  commercialStatus: string;
  status: string;
  eventDate: string | null;
  location: string | null;
  link: string | null;
  publishedAt: string | null;
  createdAt: string;
};

export default function RadarPage() {
  const [items, setItems] = useState<RadarItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  async function loadItems() {
    try {
      setLoading(true);
      setError('');

      const response = await fetch(
        '/api/radar?admin=true'
      );

      if (!response.ok) {
        throw new Error('Failed to load Radar items');
      }

      const result = (await response.json()) as { data?: RadarItem[]; error?: string };

      setItems(result.data ?? []);
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
    loadItems();
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
              The Radar
            </h1>

            <p className="mt-2 text-gray-600">
              Manage campus updates, events and announcements.
            </p>
          </div>

          <Link
            href="/admin/radar/new"
            className="rounded-lg bg-black px-4 py-2 text-sm font-medium text-white hover:bg-gray-800"
          >
            New Radar Item
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
              <h2 className="font-semibold text-black">
                All Radar Items
              </h2>

              <p className="text-sm text-gray-500">
                Updates, events, announcements and campus life.
              </p>
            </div>

            <button
              onClick={loadItems}
              className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium hover:bg-gray-50"
            >
              Refresh
            </button>
          </div>

          {loading ? (
            <div className="px-6 py-10 text-center text-gray-500">
              Loading Radar items...
            </div>
          ) : items.length === 0 ? (
            <div className="px-6 py-10 text-center text-gray-500">
              No Radar items yet.
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {items.map((item) => (
                <article
                  key={item.id}
                  className="p-6"
                >
                  <div className="flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
                    <div className="min-w-0">
                      <div className="mb-2 flex flex-wrap items-center gap-2">
                        <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-medium uppercase">
                          {item.kind}
                        </span>

                        <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-medium">
                          {item.status}
                        </span>

                        {item.commercialStatus !== 'EDITORIAL' && (
                          <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-medium">
                            {item.commercialStatus}
                          </span>
                        )}
                      </div>

                      <h3 className="text-lg font-semibold text-black">
                        {item.title}
                      </h3>

                      <p className="mt-2 text-sm leading-6 text-gray-600">
                        {item.summary}
                      </p>

                      <div className="mt-4 space-y-1 text-xs text-gray-500">
                        {item.eventDate && (
                          <p>
                            Date:{' '}
                            {new Date(
                              item.eventDate
                            ).toLocaleString()}
                          </p>
                        )}

                        {item.location && (
                          <p>
                            Location: {item.location}
                          </p>
                        )}

                        <p>
                          Created:{' '}
                          {new Date(
                            item.createdAt
                          ).toLocaleString()}
                        </p>
                      </div>
                    </div>

                    <Link
                      href={`/admin/radar/${item.id}`}
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