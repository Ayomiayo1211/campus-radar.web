'use client';

import { FormEvent, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { PasswordInput } from '@/components/PasswordInput';

type LoginResponse = { error?: string; message?: string };

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [sessionExpired, setSessionExpired] = useState(false);
  const [passwordResetSuccess, setPasswordResetSuccess] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setSessionExpired(params.get('reason') === 'session-expired');
    setPasswordResetSuccess(params.get('password-reset') === 'success');
  }, []);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const responseText = await response.text();
      let result: LoginResponse = {};
      if (responseText) {
        try {
          result = JSON.parse(responseText) as LoginResponse;
        } catch {
          throw new Error(`Login service returned an unexpected response (HTTP ${response.status}). Please retry shortly.`);
        }
      } else {
        throw new Error(`Login service returned an empty response (HTTP ${response.status}). Please retry shortly.`);
      }

      if (!response.ok) throw new Error(result.error || `Login failed (HTTP ${response.status}).`);
      router.push('/admin');
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-gray-50 px-6">
      <div className="w-full max-w-md">
        <div className="mb-8">
          <p className="text-sm font-medium uppercase tracking-wide text-gray-500">Campus Radar</p>
          <h1 className="mt-2 text-3xl font-bold text-black">Newsroom Login</h1>
          <p className="mt-2 text-gray-600">Sign in to access the newsroom.</p>
          {passwordResetSuccess && <div role="status" className="mt-4 rounded-lg border border-green-200 bg-green-50 p-3 text-sm text-green-800">Your password has been reset. Sign in with your new password.</div>}
          {sessionExpired && (
            <div role="alert" className="mt-4 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
              Your session has expired. Please log in again to continue.
            </div>
          )}
        </div>
        <form onSubmit={handleSubmit} className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          {error && <div role="alert" className="mb-5 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>}
          <div className="space-y-5">
            <div>
              <label htmlFor="email" className="mb-2 block text-sm font-medium text-gray-900">Email</label>
              <input id="email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} required autoComplete="username" className="w-full rounded-lg border border-gray-300 px-4 py-3 text-sm outline-none focus:border-black" placeholder="admin@campusradar.ng" />
            </div>
            <PasswordInput id="password" label="Password" value={password} onChange={setPassword} autoComplete="current-password" placeholder="Enter your password" />
            <div className="-mt-2 text-right"><Link href="/admin/forgot-password" className="text-sm font-medium text-gray-700 underline underline-offset-4 hover:text-black">Forgot password?</Link></div>
            <button type="submit" disabled={loading} className="w-full rounded-lg bg-black px-4 py-3 text-sm font-medium text-white hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-60">
              {loading ? 'Signing in...' : 'Sign in'}
            </button>
          </div>
        </form>
      </div>
    </main>
  );
}
