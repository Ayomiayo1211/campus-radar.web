import { cookies } from 'next/headers';
import { jwtVerify, SignJWT } from 'jose';

import { getSupabaseAdmin } from '@/lib/server/supabase';

const SESSION_COOKIE = 'campus_radar_session';
const SESSION_DURATION = 60 * 60 * 24 * 7;

type SessionPayload = { userId: string; role: string };

function getSecret() {
  const secret = process.env.AUTH_SECRET;
  if (!secret || secret.length < 32) throw new Error('AUTH_SECRET must be configured with at least 32 characters');
  return new TextEncoder().encode(secret);
}

export async function createSession(userId: string, role: string) {
  const token = await new SignJWT({ userId, role })
    .setProtectedHeader({ alg: 'HS256' }).setIssuedAt().setExpirationTime('7d').sign(getSecret());
  (await cookies()).set(SESSION_COOKIE, token, {
    httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax', path: '/', maxAge: SESSION_DURATION,
  });
}

export async function getSession(): Promise<SessionPayload | null> {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, getSecret());
    if (typeof payload.userId !== 'string' || typeof payload.role !== 'string') return null;
    return { userId: payload.userId, role: payload.role };
  } catch { return null; }
}

export async function requireRole(allowedRoles: string[]) {
  const session = await getSession();
  if (!session) throw new Error('Unauthorized');

  const { data: user, error } = await getSupabaseAdmin()
    .from('users').select('id,name,email,role,is_active')
    .eq('id', session.userId).maybeSingle();

  if (error || !user || !user.is_active) throw new Error('Unauthorized');
  if (!allowedRoles.includes(user.role)) throw new Error('Forbidden');
  return { ...user, isActive: user.is_active };
}

export async function destroySession() {
  (await cookies()).set(SESSION_COOKIE, '', {
    httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax', path: '/', maxAge: 0,
  });
}
