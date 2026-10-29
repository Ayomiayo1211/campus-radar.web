
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

type Submission = {
  id: string;
  type: string;
  name: string | null;
  contact: string | null;
  title: string | null;
  body: string;
  status: string;
  createdAt: string;
};

type SubmissionsResponse = {
  data?: Submission[];
  error?: string;
};

export default function AdminPage() {
  const router = useRouter();

  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  async function loadSubmissions() {
    try {
      setLoading(true);
      setError('');

      const response = await fetch('/api/submissions');

      if (!response.ok) {
        throw new Error('Failed to load submissions');
      }

      const result =
        (await response.json()) as SubmissionsResponse;

      setSubmissions(result.data ?? []);
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
    void loadSubmissions();
  }, []);

  async function updateStatus(id: string, status: string) {
    try {
      setError('');

      const response = await fetch(`/api/submissions/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status }),
      });

      if (!response.ok) {
        throw new Error('Failed to update submission');
      }

      await loadSubmissions();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Something went wrong'
      );
    }
  }

  async function handleLogout() {
    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
      });
    } finally {
      router.push('/admin/login');
      router.refresh();
    }
  }

  return (
    <main className="min-h-screen bg-white px-6 py-10">
      <div className="mx-auto max-w-6xl">
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-medium uppercase tracking-wide text-gray-500">
              Campus Radar
            </p>

            <h1 className="mt-2 text-3xl font-bold text-black">
              Newsroom
            </h1>

            <p className="mt-2 text-gray-600">
              Manage submissions and editorial activity.
            </p>
          </div>

          <button
            type="button"
            onClick={handleLogout}
            className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium hover:bg-gray-50"
          >
            Log out
          </button>
        </div>

        {error && (
          <div
            role="alert"
            className="mb-6 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700"
          >
            {error}
          </div>
        )}

        <section className="rounded-xl border border-gray-200 bg-white">
          <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
            <div>
              <h2 className="font-semibold text-black">
                Submissions
              </h2>

              <p className="text-sm text-gray-500">
                Tips, stories, events and other submissions.
              </p>
            </div>

            <button
              type="button"
              onClick={() => void loadSubmissions()}
              disabled={loading}
              className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading ? 'Loading...' : 'Refresh'}
            </button>
          </div>

          {loading ? (
            <div className="px-6 py-10 text-center text-gray-500">
              Loading submissions...
            </div>
          ) : submissions.length === 0 ? (
            <div className="px-6 py-10 text-center text-gray-500">
              No submissions yet.
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {submissions.map((submission) => (
                <article key={submission.id} className="p-6">
                  <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                    <div className="min-w-0">
                      <div className="mb-2 flex flex-wrap items-center gap-2">
                        <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-medium uppercase">
                          {submission.type}
                        </span>

                        <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-medium">
                          {submission.status}
                        </span>
                      </div>

                      <h3 className="text-lg font-semibold text-black">
                        {submission.title || 'Untitled submission'}
                      </h3>

                      <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-gray-700">
                        {submission.body}
                      </p>

                      <div className="mt-4 text-xs text-gray-500">
                        <p>
                          Submitted by: {submission.name || 'Anonymous'}
                        </p>

                        {submission.contact && (
                          <p>Contact: {submission.contact}</p>
                        )}

                        <p>
                          {new Date(
                            submission.createdAt
                          ).toLocaleString()}
                        </p>
                      </div>
                    </div>

                    <div className="flex shrink-0 flex-wrap gap-2">
                      {submission.status === 'PENDING' && (
                        <button
                          type="button"
                          onClick={() =>
                            void updateStatus(
                              submission.id,
                              'REVIEWING'
                            )
                          }
                          className="rounded-lg bg-black px-4 py-2 text-sm font-medium text-white hover:bg-gray-800"
                        >
                          Review
                        </button>
                      )}

                      {submission.status === 'REVIEWING' && (
                        <>
                          <button
                            type="button"
                            onClick={() =>
                              void updateStatus(
                                submission.id,
                                'ACCEPTED'
                              )
                            }
                            className="rounded-lg bg-black px-4 py-2 text-sm font-medium text-white hover:bg-gray-800"
                          >
                            Accept
                          </button>

                          <button
                            type="button"
                            onClick={() =>
                              void updateStatus(
                                submission.id,
                                'REJECTED'
                              )
                            }
                            className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium hover:bg-gray-50"
                          >
                            Reject
                          </button>
                        </>
                      )}
                    </div>
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
