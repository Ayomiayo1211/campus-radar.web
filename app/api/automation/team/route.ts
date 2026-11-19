import { NextRequest, NextResponse } from 'next/server';
import { getCloudflareContext } from '@opennextjs/cloudflare';
import { getSupabaseAdmin } from '@/lib/server/supabase';


const ALLOWED_ROLES = new Set(['REPORTER', 'EDITOR', 'SENIOR_EDITOR']);

async function matchesToken(provided: string, expected: string): Promise<boolean> {
  if (!provided || !expected) return false;

  const encoder = new TextEncoder();
  const [providedHash, expectedHash] = await Promise.all([
    crypto.subtle.digest('SHA-256', encoder.encode(provided)),
    crypto.subtle.digest('SHA-256', encoder.encode(expected)),
  ]);

  const a = new Uint8Array(providedHash);
  const b = new Uint8Array(expectedHash);
  let difference = 0;
  for (let i = 0; i < a.length; i++) difference |= a[i] ^ b[i];
  return difference === 0;
}

export async function GET(request: NextRequest) {
  const env = getCloudflareContext().env as unknown as Record<string, unknown>;
  const expectedToken = typeof env.CAMPUS_RADAR_AUTOMATION_TOKEN === 'string'
    ? env.CAMPUS_RADAR_AUTOMATION_TOKEN
    : '';

  const authorization = request.headers.get('authorization') || '';
  const providedToken = authorization.startsWith('Bearer ')
    ? authorization.slice(7).trim()
    : '';

  if (!(await matchesToken(providedToken, expectedToken))) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401, headers: { 'Cache-Control': 'no-store' } },
    );
  }

  const db = getSupabaseAdmin() as any;

  const [{ data: users, error: usersError }, { data: memberships, error: membershipsError }] =
    await Promise.all([
      db.from('users')
        .select('id,name,email,role,is_active,created_at')
        .eq('is_active', true)
        .in('role', [...ALLOWED_ROLES])
        .order('created_at', { ascending: true }),
      db.from('user_teams')
        .select('user_id,team')
        .eq('team', 'EDITORIAL'),
    ]);

  if (usersError || membershipsError) {
    console.error('[automation team] Database lookup failed:', usersError?.message || membershipsError?.message);
    return NextResponse.json(
      { error: 'Could not load editorial team.' },
      { status: 500, headers: { 'Cache-Control': 'no-store' } },
    );
  }

  const editorialUserIds = new Set((memberships ?? []).map((membership: { user_id: string }) => membership.user_id));

  const team = (users ?? [])
    .filter((user: any) => editorialUserIds.has(user.id))
    .map((user: any) => ({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      isActive: user.is_active,
      teams: ['EDITORIAL'],
    }));

  return NextResponse.json(
    { team, count: team.length, generatedAt: new Date().toISOString() },
    { headers: { 'Cache-Control': 'no-store, max-age=0' } },
  );
}
