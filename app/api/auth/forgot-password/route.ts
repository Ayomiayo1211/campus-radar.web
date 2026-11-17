import { NextRequest, NextResponse } from 'next/server';
import { getCloudflareContext } from '@opennextjs/cloudflare';
import { getSupabaseAdmin } from '@/lib/server/supabase';
import { hashValue, makeToken, siteOrigin } from '@/lib/server/engagement';
import { sendEmail } from '@/lib/server/email';
import { enforceRateLimit } from '@/lib/server/rate-limit';

const GENERIC_MESSAGE = 'If an active account exists for that email, a password reset link will be sent shortly.';

export async function POST(request: NextRequest) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Enter the email address for your newsroom account.' }, { status: 400 });
  }

  const email = typeof body === 'object' && body !== null && 'email' in body && typeof body.email === 'string'
    ? body.email.trim().toLowerCase()
    : '';

  if (!email || email.length > 254 || !/^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/.test(email)) {
    return NextResponse.json({ error: 'Enter a valid email address.' }, { status: 400 });
  }

  const ipLimit = await enforceRateLimit(request, 'forgot-password-ip', 5, 15 * 60);
  if (!ipLimit.allowed) return NextResponse.json({ message: GENERIC_MESSAGE }, { status: 200 });
  const accountLimit = await enforceRateLimit(request, 'forgot-password-account', 3, 60 * 60, email);
  if (!accountLimit.allowed) return NextResponse.json({ message: GENERIC_MESSAGE }, { status: 200 });

  // Keep account-existence responses identical, but log each server-side failure
  // with a one-way email fingerprint so failures can be correlated without
  // writing the user's email address or reset token to application logs.
  const emailFingerprint = hashValue(email).slice(0, 12);
  let phase = 'database_initialization';

  try {
    const db = getSupabaseAdmin() as any;

    phase = 'account_lookup';
    const { data: user, error } = await db
      .from('users')
      .select('id,email,is_active')
      .eq('email', email)
      .maybeSingle();

    if (error) {
      console.error('[password reset] Failed:', { phase, emailFingerprint, code: error.code, message: error.message });
      return NextResponse.json({ error: 'Password reset is temporarily unavailable. Please try again.' }, { status: 503 });
    }

    if (!user || !user.is_active) {
      console.info('[password reset] No eligible account:', { phase, emailFingerprint });
      return NextResponse.json({ message: GENERIC_MESSAGE });
    }

    phase = 'rate_limit_lookup';
    const { data: recent, error: recentError } = await db
      .from('password_reset_tokens')
      .select('id')
      .eq('user_id', user.id)
      .gte('created_at', new Date(Date.now() - 60_000).toISOString())
      .limit(1);

    if (recentError) {
      console.error('[password reset] Failed:', { phase, emailFingerprint, code: recentError.code, message: recentError.message });
      return NextResponse.json({ error: 'Password reset is temporarily unavailable. Please try again.' }, { status: 503 });
    }
    if (recent?.length) return NextResponse.json({ message: GENERIC_MESSAGE });

    phase = 'invalidate_previous_tokens';
    const { error: invalidateError } = await db
      .from('password_reset_tokens')
      .update({ used_at: new Date().toISOString() })
      .eq('user_id', user.id)
      .is('used_at', null);

    if (invalidateError) {
      console.error('[password reset] Failed:', { phase, emailFingerprint, code: invalidateError.code, message: invalidateError.message });
      return NextResponse.json({ error: 'Password reset is temporarily unavailable. Please try again.' }, { status: 503 });
    }

    phase = 'create_token';
    const token = makeToken();
    const tokenHash = hashValue(token);
    const { error: insertError } = await db.from('password_reset_tokens').insert({
      user_id: user.id,
      token_hash: tokenHash,
      expires_at: new Date(Date.now() + 30 * 60_000).toISOString(),
    });

    if (insertError) {
      console.error('[password reset] Failed:', { phase, emailFingerprint, code: insertError.code, message: insertError.message });
      return NextResponse.json({ error: 'Password reset is temporarily unavailable. Please try again.' }, { status: 503 });
    }

    phase = 'send_email';
    try {
      const env = getCloudflareContext().env as unknown as Record<string, unknown>;
      const resetUrl = `${siteOrigin(request.nextUrl.origin)}/admin/reset-password?token=${encodeURIComponent(token)}`;
      await sendEmail({
        to: user.email,
        subject: 'Reset your Campus Radar newsroom password',
        html: `<div style="font-family:Arial,sans-serif;line-height:1.6;max-width:600px"><p>Campus Radar</p><h2>Password reset request</h2><p>We received a request to reset the password for your newsroom account.</p><p><a href="${resetUrl}" style="display:inline-block;padding:12px 18px;background:#111;color:#fff;text-decoration:none;border-radius:6px">Reset password</a></p><p>This link expires in 30 minutes and can only be used once.</p><p>If you did not request this, you can ignore this email. Your password will not change.</p></div>`,
        env,
      });
    } catch (mailError) {
      console.error('[password reset] Failed:', {
        phase,
        emailFingerprint,
        error: mailError instanceof Error ? mailError.message : String(mailError),
      });

      const { error: cleanupError } = await db
        .from('password_reset_tokens')
        .update({ used_at: new Date().toISOString() })
        .eq('token_hash', tokenHash)
        .is('used_at', null);

      if (cleanupError) {
        console.error('[password reset] Failed to invalidate undelivered token:', {
          emailFingerprint,
          code: cleanupError.code,
          message: cleanupError.message,
        });
      }

      // Do not reveal whether an account exists or whether delivery failed.
      return NextResponse.json({ message: GENERIC_MESSAGE });
    }

    console.info('[password reset] Reset email accepted by provider:', { emailFingerprint });
    return NextResponse.json({ message: GENERIC_MESSAGE });
  } catch (error) {
    console.error('[password reset] Unexpected failure:', {
      phase,
      emailFingerprint,
      error: error instanceof Error ? error.message : String(error),
    });
    return NextResponse.json({ error: 'Password reset is temporarily unavailable. Please try again.' }, { status: 503 });
  }
}
