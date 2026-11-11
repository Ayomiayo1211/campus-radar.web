import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/server/supabase';
import { requireRole } from '@/lib/server/auth';

type Ctx = { params: Promise<{ id: string }> };
const EDITORS = ['EDITOR', 'SENIOR_EDITOR', 'SUPER_ADMIN'] as const;

export async function POST(_request: NextRequest, { params }: Ctx) {
  const { id } = await params;
  let user;
  try { user = await requireRole([...EDITORS]); }
  catch { return NextResponse.json({ error: 'Editors only' }, { status: 403 }); }
  const db = getSupabaseAdmin() as any;
  const now = new Date().toISOString();
  const { data: claimed, error } = await db.from('spotlights')
    .update({ editing_locked_by: user.id, editing_locked_at: now })
    .eq('id', id).is('editing_locked_by', null).select('id').maybeSingle();
  if (error) return NextResponse.json({ error: 'Could not claim this Spotlight.' }, { status: 500 });
  if (!claimed) {
    const { data: current } = await db.from('spotlights')
      .select('id,editing_locked_by,editing_locked_at').eq('id', id).maybeSingle();
    if (!current) return NextResponse.json({ error: 'Spotlight not found.' }, { status: 404 });
    if (current.editing_locked_by === user.id)
      return NextResponse.json({ data: { lockedBy: user.id, lockedAt: current.editing_locked_at, alreadyOwned: true } });
    const { data: owner } = current.editing_locked_by
      ? await db.from('users').select('name').eq('id', current.editing_locked_by).maybeSingle()
      : { data: null };
    return NextResponse.json({ error: current.editing_locked_by
      ? `This Spotlight is already being worked on by ${owner?.name || 'another editor'}. It is read-only until they release it.`
      : 'Could not claim this Spotlight. Refresh and try again.' }, { status: 409 });
  }
  const { data: snapshot } = await db.from('spotlights').select('title,excerpt,body,author_name,image_url,status,is_current').eq('id', id).maybeSingle();
  const { error: historyError } = await db.from('spotlight_edit_history').insert({
    spotlight_id: id, editor_id: user.id, editor_name: user.name,
    action: 'STARTED', after_snapshot: snapshot || null,
  });
  if (historyError) {
    await db.from('spotlights').update({ editing_locked_by: null, editing_locked_at: null }).eq('id', id).eq('editing_locked_by', user.id);
    return NextResponse.json({ error: 'Could not record the editing lock.' }, { status: 500 });
  }
  return NextResponse.json({ data: { lockedBy: user.id, lockedAt: now, alreadyOwned: false } });
}

export async function DELETE(_request: NextRequest, { params }: Ctx) {
  const { id } = await params;
  let user;
  try { user = await requireRole([...EDITORS]); }
  catch { return NextResponse.json({ error: 'Editors only' }, { status: 403 }); }
  const db = getSupabaseAdmin() as any;
  const { data: spotlight, error: lookupError } = await db.from('spotlights').select('*').eq('id', id).maybeSingle();
  if (lookupError) return NextResponse.json({ error: 'Could not load Spotlight.' }, { status: 500 });
  if (!spotlight) return NextResponse.json({ error: 'Spotlight not found.' }, { status: 404 });
  if (spotlight.editing_locked_by !== user.id)
    return NextResponse.json({ error: 'Only the editor who claimed this Spotlight can release it.' }, { status: 403 });
  const { data: released, error } = await db.from('spotlights').update({ editing_locked_by: null, editing_locked_at: null })
    .eq('id', id).eq('editing_locked_by', user.id).select('id').maybeSingle();
  if (error || !released) return NextResponse.json({ error: 'Could not release this Spotlight.' }, { status: 409 });
  const { error: historyError } = await db.from('spotlight_edit_history').insert({
    spotlight_id: id, editor_id: user.id, editor_name: user.name, action: 'RELEASED', before_snapshot: spotlight,
  });
  if (historyError) return NextResponse.json({ error: 'Released, but activity could not be recorded.' }, { status: 500 });
  return NextResponse.json({ message: 'Spotlight released.' });
}