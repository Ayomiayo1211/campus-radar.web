import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/server/supabase';
import { requireRole } from '@/lib/server/auth';

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_request: NextRequest, { params }: RouteContext) {
  const { id } = await params;
  let user;
  try { user = await requireRole(['SUPER_ADMIN', 'EDITOR', 'REPORTER']); }
  catch { return NextResponse.json({ error: 'Unauthorized' }, { status: 401 }); }

  const db = getSupabaseAdmin();
  if (user.role === 'REPORTER') {
    const { data: story } = await db.from('stories').select('author_id').eq('id', id).maybeSingle();
    if (!story || story.author_id !== user.id) {
      return NextResponse.json({ error: 'You cannot view this story history.' }, { status: 403 });
    }
  }

  const { data, error } = await db.from('story_edit_history')
    .select('id,story_id,editor_id,editor_name,action,before_snapshot,after_snapshot,created_at')
    .eq('story_id', id).order('created_at', { ascending: false });
  if (error) return NextResponse.json({ error: 'Could not load revision history.' }, { status: 500 });
  return NextResponse.json({ data: data ?? [] });
}
