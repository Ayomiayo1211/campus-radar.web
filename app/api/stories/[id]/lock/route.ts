import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/server/supabase';
import { requireRole } from '@/lib/server/auth';
import { notifySeniorEditorsStoryStarted } from '@/lib/server/newsroom-notifications';

type RouteContext = { params: Promise<{ id: string }> };

const EDITORS = ['EDITOR', 'SENIOR_EDITOR', 'SUPER_ADMIN'] as const;

export async function POST(request: NextRequest, { params }: RouteContext) {
  const { id } = await params;
  let user;
  try { user = await requireRole([...EDITORS]); }
  catch { return NextResponse.json({ error: 'Only editors and Super Admins can claim a story.' }, { status: 403 }); }

  const db = getSupabaseAdmin();
  const now = new Date().toISOString();
  const { data: claimed, error } = await db.from('stories')
    .update({ editing_locked_by: user.id, editing_locked_at: now })
    .eq('id', id).is('editing_locked_by', null)
    .select('id').maybeSingle();

  if (error) return NextResponse.json({ error: 'Could not claim this story.' }, { status: 500 });

  if (!claimed) {
    const { data: current } = await db.from('stories')
      .select('id,editing_locked_by,editing_locked_at')
      .eq('id', id).maybeSingle();
    if (!current) return NextResponse.json({ error: 'Story not found.' }, { status: 404 });
    if (current.editing_locked_by === user.id) {
      return NextResponse.json({ data: { lockedBy: user.id, lockedAt: current.editing_locked_at, alreadyOwned: true } });
    }
    const { data: owner } = current.editing_locked_by
      ? await db.from('users').select('name').eq('id', current.editing_locked_by).maybeSingle()
      : { data: null };
    return NextResponse.json({
      error: current.editing_locked_by
        ? `This story is already being worked on by ${owner?.name || 'another editor'}. It is read-only until they release it.`
        : 'This story could not be claimed. Refresh and try again.',
      lockedByName: owner?.name || null,
    }, { status: 409 });
  }

  const { data: snapshot } = await db.from('stories')
    .select('title,excerpt,body,content_type,origin,commercial_status,status,featured,author_name,cover_image')
    .eq('id', id).maybeSingle();

  const { error: historyError } = await db.from('story_edit_history').insert({
    story_id: id, editor_id: user.id, editor_name: user.name,
    action: 'STARTED', before_snapshot: null, after_snapshot: snapshot || null,
  });

  if (historyError) {
    await db.from('stories').update({ editing_locked_by: null, editing_locked_at: null })
      .eq('id', id).eq('editing_locked_by', user.id);
    return NextResponse.json({ error: 'The lock could not be recorded. Please try again.' }, { status: 500 });
  }

  const { data: storyForNotice } = await db.from('stories').select('id,title').eq('id', id).maybeSingle();
  if (storyForNotice) {
    await notifySeniorEditorsStoryStarted({ story: storyForNotice, actor: { id: user.id, name: user.name }, requestOrigin: request.nextUrl.origin });
  }

  return NextResponse.json({ data: { lockedBy: user.id, lockedAt: now, alreadyOwned: false } });
}

export async function DELETE(_request: NextRequest, { params }: RouteContext) {
  const { id } = await params;
  let user;
  try { user = await requireRole([...EDITORS]); }
  catch { return NextResponse.json({ error: 'Only the editor who owns this lock can release it.' }, { status: 403 }); }

  const db = getSupabaseAdmin();
  const { data: story, error: lookupError } = await db.from('stories')
    .select('id,editing_locked_by,title,excerpt,body,content_type,origin,commercial_status,status,featured,author_name,cover_image')
    .eq('id', id).maybeSingle();
  if (lookupError) return NextResponse.json({ error: 'Could not load story.' }, { status: 500 });
  if (!story) return NextResponse.json({ error: 'Story not found.' }, { status: 404 });
  if (story.editing_locked_by !== user.id) {
    return NextResponse.json({ error: 'Only the editor who claimed this story can release it.' }, { status: 403 });
  }

  const { data: released, error } = await db.from('stories')
    .update({ editing_locked_by: null, editing_locked_at: null })
    .eq('id', id).eq('editing_locked_by', user.id)
    .select('id').maybeSingle();
  if (error || !released) return NextResponse.json({ error: 'The story lock could not be released. Refresh and try again.' }, { status: 409 });

  const { error: historyError } = await db.from('story_edit_history').insert({
    story_id: id, editor_id: user.id, editor_name: user.name,
    action: 'RELEASED', before_snapshot: story, after_snapshot: null,
  });
  if (historyError) return NextResponse.json({ error: 'The lock was released, but its activity could not be recorded.' }, { status: 500 });

  return NextResponse.json({ message: 'Story released.' });
}
