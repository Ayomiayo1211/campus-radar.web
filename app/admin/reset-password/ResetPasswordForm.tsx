'use client';

import { FormEvent, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { PasswordInput } from '@/components/PasswordInput';

export default function ResetPasswordForm({ token }: { token: string }) {
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setError('');
    if (!token) { setError('This reset link is invalid. Request a new one.'); return; }
    if (password !== confirmPassword) { setError('The passwords do not match.'); return; }
    setLoading(true);
    try {
      const response = await fetch('/api/auth/reset-password', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password }),
      });
      const result = await response.json() as { error?: string };
      if (!response.ok) throw new Error(result.error || 'Could not reset your password.');
      router.replace('/admin/login?password-reset=success');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not reset your password.');
    } finally { setLoading(false); }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-gray-50 px-6">
      <div className="w-full max-w-md">
        <p className="text-sm font-medium uppercase tracking-wide text-gray-500">Campus Radar</p>
        <h1 className="mt-2 text-3xl font-bold text-black">Set a new password</h1>
        <p className="mt-2 text-gray-600">Choose a new password for your newsroom account.</p>
        <form onSubmit={submit} className="mt-8 space-y-5 rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          {error && <p role="alert" className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</p>}
          <PasswordInput id="new-password" label="New password" value={password} onChange={setPassword} autoComplete="new-password" minLength={12} placeholder="At least 12 characters" />
          <PasswordInput id="confirm-new-password" label="Confirm new password" value={confirmPassword} onChange={setConfirmPassword} autoComplete="new-password" minLength={12} placeholder="Re-enter your new password" />
          <p className="text-xs text-gray-500">Use at least 12 characters. The reset link expires after 30 minutes and works once.</p>
          <button type="submit" disabled={loading || !token} className="w-full rounded-lg bg-black px-4 py-3 text-sm font-medium text-white disabled:opacity-60">{loading ? 'Updating password...' : 'Reset password'}</button>
          <p className="text-center text-sm text-gray-600"><Link href="/admin/forgot-password" className="font-medium text-black underline">Request another reset link</Link></p>
        </form>
      </div>
    </main>
  );
}
