'use client';

import { FormEvent, useState } from 'react';
import { useRouter } from 'next/navigation';
import { redirect } from 'next/navigation';

import { getSession } from '@/lib/server/auth';

export default function AdminLoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          password,
        }),
      });

      const result = (await response.json()) as { error?: string; message?: string };

      if (!response.ok) {
        throw new Error(
          result.error || 'Login failed'
        );
      }

      router.push('/admin');
      router.refresh();
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

  return (
    <main className="flex min-h-screen items-center justify-center bg-gray-50 px-6">
      <div className="w-full max-w-md">
        <div className="mb-8">
          <p className="text-sm font-medium uppercase tracking-wide text-gray-500">
            Campus Radar
          </p>

          <h1 className="mt-2 text-3xl font-bold text-black">
            Newsroom Login
          </h1>

          <p className="mt-2 text-gray-600">
            Sign in to access the newsroom.
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm"
        >
          {error && (
            <div className="mb-5 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
              {error}
            </div>
          )}

          <div className="space-y-5">
            <div>
              <label
                htmlFor="email"
                className="mb-2 block text-sm font-medium text-gray-900"
              >
                Email
              </label>

              <input
                id="email"
                type="email"
                value={email}
                onChange={(event) =>
                  setEmail(event.target.value)
                }
                required
                autoComplete="email"
                className="w-full rounded-lg border border-gray-300 px-4 py-3 text-sm outline-none focus:border-black"
                placeholder="admin@campusradar.ng"
              />
            </div>

            <div>
              <label
                htmlFor="password"
                className="mb-2 block text-sm font-medium text-gray-900"
              >
                Password
              </label>

              <input
                id="password"
                type="password"
                value={password}
                onChange={(event) =>
                  setPassword(event.target.value)
                }
                required
                autoComplete="current-password"
                className="w-full rounded-lg border border-gray-300 px-4 py-3 text-sm outline-none focus:border-black"
                placeholder="Enter your password"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg bg-black px-4 py-3 text-sm font-medium text-white hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? 'Signing in...' : 'Sign in'}
            </button>
          </div>
        </form>
      </div>
    </main>
  );
}