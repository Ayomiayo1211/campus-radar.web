import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/server/supabase';
import { requireRole } from '@/lib/server/auth';

type RouteContext = { params: Promise<{ id: string }> };
const STAFF = ['SUPER_ADMIN', 'SENIOR_EDITOR', 'EDITOR', 'REPORTER'] as const;

export async function POST(request: NextRequest, { params }: RouteContext) {
  const { id } = await params;
  let actor;
  try { actor = await requireRole([...STAFF]); }
  catch { return NextResponse.json({ error: 'Authentication required' }, { status: 401 }); }

  let body: any;
  try { body = await request.json(); }
  catch { return NextResponse.json({ error: 'Invalid request body' }, { status: 400 }); }

  const type = body?.type;
  const assigneeId = typeof body?.assigneeId === 'string' ? body.assigneeId : '';
  const note = typeof body?.note === 'string' ? body.note.trim().slice(0, 1000) : null;
  if (!assigneeId || !['EDITOR_REVIEW', 'REPORTER_TASK'].includes(type)) {
    return NextResponse.json({ error: 'Choose a valid recipient and assignment type.' }, { status: 400 });
  }
  if (type === 'REPORTER_TASK' && !['SUPER_ADMIN', 'SENIOR_EDITOR'].includes(actor.role)) {
    return NextResponse.json({ error: 'Only Senior Editors can allocate work to reporters.' }, { status: 403 });
  }

  const db = getSupabaseAdmin();
  const [{ data: story, error: storyError }, { data: target, error: targetError }] = await Promise.all([
    db.from('stories').select('id,title,status,author_id,assigned_editor_id,assigned_reporter_id,editing_locked_by').eq('id', id).maybeSingle(),
    db.from('users').select('id,name,role,is_active').eq('id', assigneeId).maybeSingle(),
  ]);
  if (storyError || targetError) return NextResponse.json({ error: 'Could not verify the story or recipient.' }, { status: 500 });
  if (!story) return NextResponse.json({ error: 'Story not found.' }, { status: 404 });
  if (!target || !target.is_active) return NextResponse.json({ error: 'That newsroom account is unavailable.' }, { status: 404 });

  if (type === 'EDITOR_REVIEW') {
    if (!['EDITOR', 'SENIOR_EDITOR', 'SUPER_ADMIN'].includes(target.role)) {
      return NextResponse.json({ error: 'Choose an Editor or Senior Editor.' }, { status: 400 });
    }
    if (actor.role === 'REPORTER' && story.author_id !== actor.id && story.assigned_reporter_id !== actor.id) {
      return NextResponse.json({ error: 'You can only submit a story you wrote or were assigned.' }, { status: 403 });
    }
  } else if (target.role !== 'REPORTER') {
    return NextResponse.json({ error: 'Reporter assignments must go to a Reporter account.' }, { status: 400 });
  }

  if (story.editing_locked_by && story.editing_locked_by !== actor.id) {
    return NextResponse.json({ error: 'This story is currently being edited by another editor. Ask them to release it before reassigning.' }, { status: 423 });
  }
  if (story.status === 'PUBLISHED' || story.status === 'ARCHIVED') {
    return NextResponse.json({ error: 'Published or archived stories cannot be reassigned.' }, { status: 409 });
  }

  const updates = type === 'EDITOR_REVIEW'
    ? { assigned_editor_id: target.id, assigned_by_id: actor.id, status: 'REVIEW', editing_locked_by: null, editing_locked_at: null, updated_at: new Date().toISOString() }
    : { assigned_reporter_id: target.id, assigned_by_id: actor.id, status: story.status === 'REVIEW' ? 'DRAFT' : story.status, editing_locked_by: null, editing_locked_at: null, updated_at: new Date().toISOString() };
  const { error: updateError } = await db.from('stories').update(updates).eq('id', id);
  if (updateError) return NextResponse.json({ error: 'Could not save the assignment.' }, { status: 500 });

  const { error: historyError } = await db.from('story_assignment_history').insert({
    story_id: id,
    assigned_by_id: actor.id,
    assigned_by_name: actor.name,
    assigned_to_id: target.id,
    assigned_to_name: target.name,
    assignment_type: type,
    note,
  });
  if (historyError) return NextResponse.json({ error: 'Assignment saved, but its activity could not be recorded. Contact a Super Admin.' }, { status: 500 });

  return NextResponse.json({ message: type === 'EDITOR_REVIEW' ? `Sent to ${target.name} for editorial review.` : `Assigned to ${target.name}.` });
}
