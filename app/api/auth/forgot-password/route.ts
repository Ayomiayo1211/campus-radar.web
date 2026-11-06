import { NextRequest, NextResponse } from 'next/server';
import { getCloudflareContext } from '@opennextjs/cloudflare';
import { getSupabaseAdmin } from '@/lib/server/supabase';
import { hashValue, makeToken, siteOrigin } from '@/lib/server/engagement';
import { sendGmailMessage } from '@/lib/server/gmail';

const GENERIC_MESSAGE = 'If an active account exists for that email, a password reset link will be sent shortly.';

export async function POST(request: NextRequest) {
  let body: unknown;
  try { body = await request.json(); } catch {
    return NextResponse.json({ error: 'Enter the email address for your newsroom account.' }, { status: 400 });
  }
  const email = typeof body === 'object' && body !== null && 'email' in body && typeof body.email === 'string'
    ? body.email.trim().toLowerCase() : '';
  if (!email || email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: 'Enter a valid email address.' }, { status: 400 });
  }

  const db = getSupabaseAdmin() as any;
  const { data: user, error } = await db.from('users').select('id,email,is_active').eq('email', email).maybeSingle();
  if (error) {
    console.error('[password reset] Account lookup failed:', error);
    return NextResponse.json({ error: 'Password reset is temporarily unavailable. Please try again.' }, { status: 503 });
  }
  if (!user || !user.is_active) return NextResponse.json({ message: GENERIC_MESSAGE });

  const { data: recent } = await db.from('password_reset_tokens')
    .select('id').eq('user_id', user.id)
    .gte('created_at', new Date(Date.now() - 60_000).toISOString()).limit(1);
  if (recent?.length) return NextResponse.json({ message: GENERIC_MESSAGE });

  const token = makeToken();
  const { error: invalidateError } = await db.from('password_reset_tokens')
    .update({ used_at: new Date().toISOString() }).eq('user_id', user.id).is('used_at', null);
  if (invalidateError) {
    console.error('[password reset] Could not invalidate previous tokens:', invalidateError);
    return NextResponse.json({ error: 'Password reset is temporarily unavailable. Please try again.' }, { status: 503 });
  }

  const { error: insertError } = await db.from('password_reset_tokens').insert({
    user_id: user.id,
    token_hash: hashValue(token),
    expires_at: new Date(Date.now() + 30 * 60_000).toISOString(),
  });
  if (insertError) {
    console.error('[password reset] Could not create reset token:', insertError);
    return NextResponse.json({ error: 'Password reset is temporarily unavailable. Please try again.' }, { status: 503 });
  }

  try {
    const env = getCloudflareContext().env as unknown as Record<string, unknown>;
    const resetUrl = `${siteOrigin(request.nextUrl.origin)}/admin/reset-password?token=${encodeURIComponent(token)}`;
    await sendGmailMessage({
      to: user.email,
      subject: 'Reset your Campus Radar newsroom password',
      html: `<div style="font-family:Arial,sans-serif;line-height:1.6;max-width:600px"><p>Campus Radar</p><h2>Password reset request</h2><p>We received a request to reset the password for your newsroom account.</p><p><a href="${resetUrl}" style="display:inline-block;padding:12px 18px;background:#111;color:#fff;text-decoration:none;border-radius:6px">Reset password</a></p><p>This link expires in 30 minutes and can only be used once.</p><p>If you did not request this, you can ignore this email. Your password will not change.</p></div>`,
      env,
    });
  } catch (mailError) {
    console.error('[password reset] Email delivery failed:', mailError);
    await db.from('password_reset_tokens').update({ used_at: new Date().toISOString() }).eq('token_hash', hashValue(token)).is('used_at', null);
    return NextResponse.json({ message: GENERIC_MESSAGE });
  }

  return NextResponse.json({ message: GENERIC_MESSAGE });
}
