import { NextResponse } from 'next/server';
import { getSupabaseAdmin, toCamelCase } from '@/lib/server/supabase';
import { requireRole } from '@/lib/server/auth';

const ROLES = ['SUPER_ADMIN', 'SENIOR_EDITOR', 'EDITOR', 'REPORTER'] as const;

export async function GET() {
  let user;
  try { user = await requireRole([...ROLES]); }
  catch { return NextResponse.json({ error: 'Authentication required' }, { status: 401 }); }

  const db = getSupabaseAdmin();
  let query = db.from('stories')
    .select('id,title,slug,excerpt,status,author_name,author_id,assigned_editor_id,assigned_reporter_id,assigned_note,created_at,updated_at')
    .neq('status', 'ARCHIVED')
    .order('updated_at', { ascending: false })
    .limit(100);

  if (user.role === 'REPORTER') {
    query = query.or(`author_id.eq.${user.id},assigned_reporter_id.eq.${user.id}`).in('status', ['DRAFT', 'REVIEW']);
  } else if (user.role === 'EDITOR') {
    query = query.or(`assigned_editor_id.eq.${user.id},and(status.eq.REVIEW,assigned_editor_id.is.null)`);
  } else if (user.role === 'SENIOR_EDITOR') {
    query = query.or(`assigned_editor_id.eq.${user.id},assigned_reporter_id.not.is.null,and(status.eq.REVIEW,assigned_editor_id.is.null)`);
  }

  const [{ data: stories, error }, { data: reporters, error: reportersError }, { data: editors, error: editorsError }] = await Promise.all([
    query,
    ['SUPER_ADMIN', 'SENIOR_EDITOR'].includes(user.role)
      ? db.from('users').select('id,name,email').eq('role', 'REPORTER').eq('is_active', true).order('name')
      : Promise.resolve({ data: [], error: null }),
    ['SUPER_ADMIN', 'SENIOR_EDITOR', 'EDITOR', 'REPORTER'].includes(user.role)
      ? db.from('users').select('id,name,email,role').in('role', ['EDITOR', 'SENIOR_EDITOR', 'SUPER_ADMIN']).eq('is_active', true).order('name')
      : Promise.resolve({ data: [], error: null }),
  ]);

  if (error || reportersError || editorsError) {
    return NextResponse.json({ error: 'Could not load newsroom assignments.' }, { status: 500 });
  }

  return NextResponse.json({
    stories: toCamelCase(stories ?? []),
    reporters: reporters ?? [],
    editors: editors ?? [],
    currentUser: { id: user.id, role: user.role, name: user.name },
  }, { headers: { 'Cache-Control': 'no-store' } });
}
