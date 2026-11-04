'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import AdminNav from './AdminNav';

const PUBLIC_ADMIN_PATHS = ['/admin/login', '/admin/accept-invitation'];

export default function AdminSessionGuard({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [checking, setChecking] = useState(true);
  const checkingRef = useRef(false);
  const publicPage = PUBLIC_ADMIN_PATHS.some((path) => pathname === path || pathname.startsWith(path + '/'));

  const verifySession = useCallback(async () => {
    if (checkingRef.current || publicPage) return;
    checkingRef.current = true;
    try {
      const response = await fetch('/api/auth/session', {
        method: 'GET',
        cache: 'no-store',
        credentials: 'same-origin',
        headers: { Accept: 'application/json' },
      });
      if (response.status === 401) {
        router.replace('/admin/login?reason=session-expired');
        return;
      }
      if (response.ok) setChecking(false);
    } catch {
      // A temporary network failure should not sign the user out.
      setChecking(false);
    } finally {
      checkingRef.current = false;
    }
  }, [publicPage, router]);

  useEffect(() => {
    if (publicPage) {
      setChecking(false);
      return;
    }
    setChecking(true);
    void verifySession();

    const interval = window.setInterval(() => void verifySession(), 60_000);
    const onFocus = () => void verifySession();
    window.addEventListener('focus', onFocus);
    return () => {
      window.clearInterval(interval);
      window.removeEventListener('focus', onFocus);
    };
  }, [pathname, publicPage, verifySession]);

  if (publicPage) return <>{children}</>;
  if (checking) {
    return (
      <main className="flex min-h-[60vh] items-center justify-center bg-white">
        <p className="text-sm text-gray-500">Checking your newsroom session...</p>
      </main>
    );
  }

  return (
    <>
      <AdminNav />
      {children}
    </>
  );
}
