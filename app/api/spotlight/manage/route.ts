import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/server/supabase';
import { requireRole } from '@/lib/server/auth';

export async function GET() {
  let user;
  try { user = await requireRole(['SUPER_ADMIN', 'EDITOR']); }
  catch { return NextResponse.json({ error: 'Editors only' }, { status: 403 }); }
  const db = getSupabaseAdmin() as any;
  const { data, error } = await db.from('spotlights').select('*').order('created_at', { ascending: false });
  if (error) return NextResponse.json({ error: 'Could not load Spotlights' }, { status: 500 });
  const ids = (data ?? []).map((x: any) => x.id);
  const editorIds = [...new Set((data ?? []).map((x: any) => x.editing_locked_by).filter(Boolean))];
  const [{ data: users }, { data: history }] = await Promise.all([
    editorIds.length ? db.from('users').select('id,name').in('id', editorIds) : Promise.resolve({ data: [] }),
    ids.length ? db.from('spotlight_edit_history').select('spotlight_id,editor_name,action,created_at').in('spotlight_id', ids).order('created_at', { ascending: false }) : Promise.resolve({ data: [] }),
  ]);
  const names = new Map((users ?? []).map((x: any) => [x.id, x.name]));
  const contributors = new Map<string, string[]>();
  for (const entry of history ?? []) {
    const list = contributors.get(entry.spotlight_id) ?? [];
    if (!list.includes(entry.editor_name)) list.push(entry.editor_name);
    contributors.set(entry.spotlight_id, list);
  }
  const enriched = (data ?? []).map((x: any) => ({
    ...x,
    editing_locked_by_name: names.get(x.editing_locked_by) ?? null,
    contributors: contributors.get(x.id) ?? [],
  }));
  return NextResponse.json({ data: enriched, currentUserId: user.id });
}