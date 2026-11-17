import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { getSupabaseAdmin } from '@/lib/server/supabase';
import { createSession } from '@/lib/server/auth';
import { enforceRateLimit } from '@/lib/server/rate-limit';

function describeError(error: unknown) {
  if (error instanceof Error) {
    return { name: error.name, message: error.message, stack: error.stack };
  }
  return { name: typeof error, message: String(error) };
}

export async function POST(request: NextRequest) {
  let phase = 'request parsing';

  try {
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
    }

    if (typeof body !== 'object' || body === null || !('email' in body) || !('password' in body)) {
      return NextResponse.json({ error: 'Email and password are required' }, { status: 400 });
    }

    const rawEmail = (body as { email: unknown }).email;
    const rawPassword = (body as { password: unknown }).password;
    if (typeof rawEmail !== 'string' || typeof rawPassword !== 'string') {
      return NextResponse.json({ error: 'Email and password are required' }, { status: 400 });
    }

    const email = rawEmail.trim().toLowerCase();
    const password = rawPassword;
    if (!email || !password || email.length > 254 || password.length > 1024) {
      return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 });
    }

    const ipLimit = await enforceRateLimit(request, 'admin-login-ip', 10, 15 * 60);
    if (!ipLimit.allowed) return ipLimit.response!;
    const accountLimit = await enforceRateLimit(request, 'admin-login-account', 5, 15 * 60, email);
    if (!accountLimit.allowed) return accountLimit.response!;

    phase = 'Supabase client initialization';
    const supabase = getSupabaseAdmin();

    phase = 'Supabase user lookup';
    const { data: user, error } = await supabase
      .from('users')
      .select('id,name,email,password_hash,role,is_active,session_version')
      .eq('email', email)
      .maybeSingle();

    if (error) {
      console.error('Admin login database query failed', JSON.stringify({
        phase,
        name: error.name,
        message: error.message,
        code: error.code,
        details: error.details,
        hint: error.hint,
      }));
      return NextResponse.json({ error: 'Login service is temporarily unavailable. Please retry.' }, { status: 503 });
    }
    if (!user) return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 });

    phase = 'password verification';
    const matches = await bcrypt.compare(password, user.password_hash);
    if (!matches || !user.is_active) {
      return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 });
    }

    phase = 'session creation';
    await createSession(user.id, user.role, user.session_version ?? 0);

    return NextResponse.json({
      message: 'Login successful',
      user: { id: user.id, name: user.name, email: user.email, role: user.role },
    });
  } catch (error) {
    console.error('Admin login failed', JSON.stringify({ phase, ...describeError(error) }));
    return NextResponse.json({ error: 'Login service is temporarily unavailable. Please retry.' }, { status: 503, headers: { 'Cache-Control': 'no-store' } });
  }
}
