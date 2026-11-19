import { NextRequest, NextResponse } from 'next/server';
import { getCloudflareContext } from '@opennextjs/cloudflare';
import { getSupabaseAdmin } from '@/lib/server/supabase';

const REPORTER_ROLE = 'REPORTER';

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

  // Include every account whose role is REPORTER, regardless of team membership
  // or account activation state. The isActive field is preserved for the sheet.
  const { data: users, error } = await db.from('users')
    .select('id,name,email,role,is_active,created_at')
    .eq('role', REPORTER_ROLE)
    .order('created_at', { ascending: true });

  if (error) {
    console.error('[automation team] Database lookup failed:', error.message);
    return NextResponse.json(
      { error: 'Could not load reporter accounts.' },
      { status: 500, headers: { 'Cache-Control': 'no-store' } },
    );
  }

  const team = (users ?? []).map((user: any) => ({
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
