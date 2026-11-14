import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/server/supabase';
import { requireRole } from '@/lib/server/auth';

const REVIEW_ROLES = ['SUPER_ADMIN', 'SENIOR_EDITOR', 'EDITOR'] as const;
const STATUSES = ['NEW', 'REVIEWING', 'ACCEPTED', 'REJECTED'] as const;

function authError(error: unknown) {
  if (error instanceof Error && error.message === 'Forbidden') {
    return NextResponse.json({ error: 'You do not have permission to view member applications.' }, { status: 403 });
  }
  return NextResponse.json({ error: 'Authentication required.' }, { status: 401 });
}

export async function GET(request: NextRequest) {
  try {
    await requireRole([...REVIEW_ROLES]);
  } catch (error) {
    return authError(error);
  }

  const status = request.nextUrl.searchParams.get('status');
  const db = getSupabaseAdmin();
  let query = db.from('member_applications').select('*').order('created_at', { ascending: false }).limit(300);

  if (status && STATUSES.includes(status as typeof STATUSES[number])) {
    query = query.eq('status', status);
  }

  const { data, error } = await query;
  if (error) {
    console.error('[admin applications] Load failed:', error.message);
    return NextResponse.json({ error: 'Could not load applications.' }, { status: 500 });
  }

  return NextResponse.json({ applications: data ?? [] }, { headers: { 'Cache-Control': 'no-store' } });
}

export async function PATCH(request: NextRequest) {
  let actor;
  try {
    actor = await requireRole([...REVIEW_ROLES]);
  } catch (error) {
    return authError(error);
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 });
  }

  const input = body as { id?: unknown; status?: unknown };
  if (typeof input.id !== 'string' || !input.id || typeof input.status !== 'string' || !STATUSES.includes(input.status as typeof STATUSES[number])) {
    return NextResponse.json({ error: 'Provide a valid application and status.' }, { status: 400 });
  }

  const { data, error } = await getSupabaseAdmin()
    .from('member_applications')
    .update({
      status: input.status,
      reviewed_by: actor.id,
      reviewed_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('id', input.id)
    .select('id,status,reviewed_at')
    .maybeSingle();

  if (error) {
    console.error('[admin applications] Update failed:', error.message);
    return NextResponse.json({ error: 'Could not update this application.' }, { status: 500 });
  }
  if (!data) return NextResponse.json({ error: 'Application not found.' }, { status: 404 });

  return NextResponse.json({ application: data });
}
