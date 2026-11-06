import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { getSupabaseAdmin } from '@/lib/server/supabase';
import { hashValue } from '@/lib/server/engagement';

export async function POST(request: NextRequest) {
  let body: unknown;
  try { body = await request.json(); } catch {
    return NextResponse.json({ error: 'Invalid reset request.' }, { status: 400 });
  }
  const token = typeof body === 'object' && body !== null && 'token' in body && typeof body.token === 'string' ? body.token : '';
  const password = typeof body === 'object' && body !== null && 'password' in body && typeof body.password === 'string' ? body.password : '';
  if (!/^[a-f0-9]{64}$/i.test(token)) return NextResponse.json({ error: 'This reset link is invalid or has expired. Request a new one.' }, { status: 400 });
  if (password.length < 12 || password.length > 128) return NextResponse.json({ error: 'Use a password between 12 and 128 characters.' }, { status: 400 });

  const passwordHash = await bcrypt.hash(password, 12);
  const { data, error } = await (getSupabaseAdmin() as any).rpc('reset_user_password', {
    p_token_hash: hashValue(token),
    p_password_hash: passwordHash,
  });
  if (error) {
    console.error('[password reset] Password update failed:', error);
    return NextResponse.json({ error: 'Could not reset your password right now. Please try again.' }, { status: 503 });
  }
  if (data !== true) return NextResponse.json({ error: 'This reset link is invalid, expired, or has already been used. Request a new one.' }, { status: 400 });
  return NextResponse.json({ message: 'Your password has been reset. You can now sign in.' });
}
