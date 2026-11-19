import { NextRequest, NextResponse } from 'next/server';
import { getCloudflareContext } from '@opennextjs/cloudflare';
import { getSupabaseAdmin } from '@/lib/server/supabase';

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

async function fetchAllRows(queryFactory: () => any): Promise<any[]> {
  const rows: any[] = [];
  const pageSize = 1000;

  for (let offset = 0; ; offset += pageSize) {
    const { data, error } = await queryFactory().range(offset, offset + pageSize - 1);

    if (error) throw error;

    const page = data ?? [];
    rows.push(...page);

    if (page.length < pageSize) break;
  }

  return rows;
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

  try {
    // Fetch every account and every team membership, including inactive accounts.
    // Pagination avoids silently stopping at Supabase's 1,000-row response limit.
    const [users, memberships] = await Promise.all([
      fetchAllRows(() => db.from('users')
        .select('id,name,email,role,is_active,created_at')
        .order('created_at', { ascending: true })
        .order('id', { ascending: true })),
      fetchAllRows(() => db.from('user_teams')
        .select('user_id,team')
        .order('user_id', { ascending: true })
        .order('team', { ascending: true })),
    ]);

    const teamsByUserId = new Map<string, string[]>();

    for (const membership of memberships) {
      const current = teamsByUserId.get(membership.user_id) ?? [];
      current.push(membership.team);
      teamsByUserId.set(membership.user_id, current);
    }

    // Include all Editorial team accounts, regardless of role/status,
    // plus all Reporter accounts even if they have no team assignment.
    const newsroomUsers = users.filter((user: any) =>
      user.role === 'REPORTER' ||
      (teamsByUserId.get(user.id) ?? []).includes('EDITORIAL')
    );

    const team = newsroomUsers.map((user: any) => ({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      isActive: user.is_active,
      teams: teamsByUserId.get(user.id) ?? [],
    }));

    return NextResponse.json(
      {
        team,
        count: team.length,
        generatedAt: new Date().toISOString(),
      },
      { headers: { 'Cache-Control': 'no-store, max-age=0' } },
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown database error';
    console.error('[automation team] Database lookup failed:', message);

    return NextResponse.json(
      { error: 'Could not load newsroom accounts.' },
      { status: 500, headers: { 'Cache-Control': 'no-store' } },
    );
  }
}
