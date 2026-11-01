import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { getSupabaseAdmin } from '@/lib/server/supabase';
import { createSession } from '@/lib/server/auth';

export async function POST(request: NextRequest) {
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

    const { data: user, error } = await getSupabaseAdmin()
      .from('users')
      .select('id,name,email,password_hash,role,is_active')
      .eq('email', email)
      .maybeSingle();

    if (error) {
      console.error('Admin login database query failed:', error.message);
      return NextResponse.json({ error: 'Login service is temporarily unavailable. Please retry.' }, { status: 503 });
    }
    if (!user) return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 });

    const matches = await bcrypt.compare(password, user.password_hash);
    if (!matches || !user.is_active) {
      return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 });
    }

    await createSession(user.id, user.role);
    return NextResponse.json({
      message: 'Login successful',
      user: { id: user.id, name: user.name, email: user.email, role: user.role },
    });
  } catch (error) {
    console.error('Admin login handler failed:', error);
    return NextResponse.json({ error: 'Login service is temporarily unavailable. Please retry.' }, { status: 500 });
  }
}
