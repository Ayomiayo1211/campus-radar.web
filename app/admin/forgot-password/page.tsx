'use client';

import { FormEvent, useState } from 'react';
import Link from 'next/link';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(''); setMessage(''); setLoading(true);
    try {
      const response = await fetch('/api/auth/forgot-password', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email }),
      });
      const result = await response.json() as { message?: string; error?: string };
      if (!response.ok) throw new Error(result.error || 'Could not process your request.');
      setMessage(result.message || 'If an active account exists, a reset link will be sent shortly.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not process your request.');
    } finally { setLoading(false); }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-gray-50 px-6">
      <div className="w-full max-w-md">
        <p className="text-sm font-medium uppercase tracking-wide text-gray-500">Campus Radar</p>
        <h1 className="mt-2 text-3xl font-bold text-black">Forgot password?</h1>
        <p className="mt-2 text-gray-600">Enter the email address linked to your newsroom account.</p>
        <form onSubmit={submit} className="mt-8 space-y-5 rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          {error && <p role="alert" className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</p>}
          {message && <p role="status" className="rounded-lg border border-green-200 bg-green-50 p-3 text-sm text-green-800">{message}</p>}
          <div>
            <label htmlFor="reset-email" className="mb-2 block text-sm font-medium text-gray-900">Email</label>
            <input id="reset-email" type="email" value={email} onChange={event => setEmail(event.target.value)} required autoComplete="email" className="w-full rounded-lg border border-gray-300 px-4 py-3 text-sm outline-none focus:border-black" placeholder="you@example.com" />
          </div>
          <button type="submit" disabled={loading} className="w-full rounded-lg bg-black px-4 py-3 text-sm font-medium text-white disabled:opacity-60">{loading ? 'Sending...' : 'Send reset link'}</button>
          <p className="text-center text-sm text-gray-600"><Link href="/admin/login" className="font-medium text-black underline">Back to login</Link></p>
        </form>
      </div>
    </main>
  );
}
