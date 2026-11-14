import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/server/supabase';
import { requireRole } from '@/lib/server/auth';

export const dynamic = 'force-dynamic';

const EDITOR_ROLES = ['SUPER_ADMIN', 'SENIOR_EDITOR', 'EDITOR'];
const SPOTLIGHT_LIFETIME_MS = 7 * 24 * 60 * 60 * 1000;

function publicationWindow(now = new Date()) {
  const publishedAt = now.toISOString();
  const expiresAt = new Date(now.getTime() + SPOTLIGHT_LIFETIME_MS).toISOString();
  return { published_at: publishedAt, expires_at: expiresAt };
}

export async function GET() {
  const now = new Date().toISOString();
  const { data, error } = await (getSupabaseAdmin() as any).from('spotlights')
    .select('id,title,excerpt,body,image_url,author_name,status,is_current,created_at,published_at,expires_at')
    .eq('status', 'PUBLISHED')
    .eq('is_current', true)
    .gt('expires_at', now)
    .maybeSingle();

  if (error) return NextResponse.json({ error: 'Could not load Spotlight' }, { status: 500 });
  return NextResponse.json({
    data: data ? {
      id: data.id,
      title: data.title,
      excerpt: data.excerpt,
      body: data.body,
      imageUrl: data.image_url,
      authorName: data.author_name,
      publishedAt: data.published_at,
      expiresAt: data.expires_at,
    } : null,
  });
}

export async function POST(request: NextRequest) {
  let user;
  try { user = await requireRole(EDITOR_ROLES); }
  catch { return NextResponse.json({ error: 'Editors only' }, { status: 403 }); }

  let b: any;
  try { b = await request.json(); }
  catch { return NextResponse.json({ error: 'Invalid request' }, { status: 400 }); }

  const title = String(b.title || '').trim();
  const excerpt = String(b.excerpt || '').trim();
  const body = String(b.body || '').trim();
  const author = String(b.author_name || '').trim();
  const image = typeof b.image_url === 'string' && b.image_url ? b.image_url : null;
  const status = b.status === 'PUBLISHED' ? 'PUBLISHED' : 'DRAFT';

  if (title.length < 3 || title.length > 180 || excerpt.length < 10 || excerpt.length > 500 || body.length < 20 || author.length < 2) {
    return NextResponse.json({ error: 'Complete the title, excerpt, write-up and author fields.' }, { status: 400 });
  }
  if (image && !/^https:\/\//i.test(image)) {
    return NextResponse.json({ error: 'Invalid image URL' }, { status: 400 });
  }

  const db = getSupabaseAdmin() as any;
  const now = new Date();
  const published = status === 'PUBLISHED' ? publicationWindow(now) : { published_at: null, expires_at: null };
  const { data, error } = await db.from('spotlights').insert({
    title,
    excerpt,
    body,
    image_url: image,
    author_name: author,
    status,
    is_current: false,
    created_by: user.id,
    ...published,
    editing_locked_by: user.id,
    editing_locked_at: now.toISOString(),
  }).select('*').single();

  if (error || !data) return NextResponse.json({ error: 'Could not save Spotlight' }, { status: 500 });

  const { error: historyError } = await db.from('spotlight_edit_history').insert({
    spotlight_id: data.id,
    editor_id: user.id,
    editor_name: user.name,
    action: 'STARTED',
    after_snapshot: {
      title,
      excerpt,
      body,
      author_name: author,
      image_url: image,
      status,
      is_current: false,
      published_at: data.published_at,
      expires_at: data.expires_at,
    },
  });

  if (historyError) {
    await db.from('spotlights').delete().eq('id', data.id);
    return NextResponse.json({ error: 'Could not record Spotlight ownership.' }, { status: 500 });
  }

  if (status === 'PUBLISHED') {
    const { error: deactivateError } = await db.from('spotlights').update({ is_current: false }).eq('is_current', true);
    if (deactivateError) return NextResponse.json({ error: 'Saved, but could not replace the current Spotlight.' }, { status: 500 });

    const { error: activateError } = await db.from('spotlights').update({ is_current: true }).eq('id', data.id).eq('editing_locked_by', user.id);
    if (activateError) return NextResponse.json({ error: 'Saved, but could not activate Spotlight' }, { status: 500 });
  }

  return NextResponse.json({ data }, { status: 201 });
}

export async function PATCH(request: NextRequest) {
  let user;
  try { user = await requireRole(EDITOR_ROLES); }
  catch { return NextResponse.json({ error: 'Editors only' }, { status: 403 }); }

  let b: any;
  try { b = await request.json(); }
  catch { return NextResponse.json({ error: 'Invalid request' }, { status: 400 }); }

  if (typeof b.id !== 'string') return NextResponse.json({ error: 'Missing Spotlight ID' }, { status: 400 });

  const db = getSupabaseAdmin() as any;
  const { data: before, error: lookupError } = await db.from('spotlights').select('*').eq('id', b.id).maybeSingle();
  if (lookupError) return NextResponse.json({ error: 'Could not load Spotlight' }, { status: 500 });
  if (!before) return NextResponse.json({ error: 'Spotlight not found' }, { status: 404 });

  // Removing a Spotlight from the popup is an editorial action, not a content edit.
  // It must remain available even when another editor currently owns the editing lock.
  if (b.deactivate === true) {
    if (!before.is_current) return NextResponse.json({ data: before });

    const { data, error } = await db.from('spotlights')
      .update({ is_current: false, updated_at: new Date().toISOString() })
      .eq('id', b.id)
      .eq('is_current', true)
      .select('*')
      .maybeSingle();

    if (error) return NextResponse.json({ error: 'Could not remove Spotlight from the popup.' }, { status: 500 });
    if (!data) return NextResponse.json({ error: 'Spotlight is no longer the current popup.' }, { status: 409 });

    const { error: historyError } = await db.from('spotlight_edit_history').insert({
      spotlight_id: b.id,
      editor_id: user.id,
      editor_name: user.name,
      action: 'DEACTIVATED',
      before_snapshot: { is_current: before.is_current },
      after_snapshot: { is_current: false },
    });

    if (historyError) return NextResponse.json({ error: 'Spotlight was removed, but the activity could not be recorded.' }, { status: 500 });
    return NextResponse.json({ data });
  }

  if (before.editing_locked_by !== user.id) {
    return NextResponse.json({
      error: before.editing_locked_by
        ? 'This Spotlight is locked by another editor. It is read-only until they release it.'
        : 'Claim this Spotlight before making changes.',
    }, { status: 409 });
  }

  const updates: any = { updated_at: new Date().toISOString() };
  for (const key of ['title', 'excerpt', 'body', 'author_name', 'image_url', 'status']) {
    if (b[key] !== undefined) updates[key] = b[key];
  }

  const isNewPublication = updates.status === 'PUBLISHED' && before.status !== 'PUBLISHED';
  const shouldPublish = b.activate === true || isNewPublication;
  if (shouldPublish) {
    Object.assign(updates, publicationWindow());
    updates.is_current = true;
    updates.status = 'PUBLISHED';
  } else if (updates.status && updates.status !== 'PUBLISHED') {
    updates.is_current = false;
    updates.published_at = null;
    updates.expires_at = null;
  }

  // The partial unique index permits only one current Spotlight. Clear the old
  // current row before activating this one.
  if (shouldPublish) {
    const { error: deactivateError } = await db.from('spotlights')
      .update({ is_current: false })
      .neq('id', b.id)
      .eq('is_current', true);
    if (deactivateError) return NextResponse.json({ error: 'Could not replace the current Spotlight.' }, { status: 500 });
  }

  const { data, error } = await db.from('spotlights')
    .update(updates)
    .eq('id', b.id)
    .eq('editing_locked_by', user.id)
    .select('*')
    .single();

  if (error || !data) return NextResponse.json({ error: 'Could not update Spotlight. Confirm you still own its lock.' }, { status: 409 });

  const changedFields = Object.keys(updates).filter((key) => key !== 'updated_at');
  if (changedFields.length) {
    const { error: historyError } = await db.from('spotlight_edit_history').insert({
      spotlight_id: b.id,
      editor_id: user.id,
      editor_name: user.name,
      action: 'UPDATED',
      before_snapshot: Object.fromEntries(changedFields.map((key) => [key, before[key]])),
      after_snapshot: Object.fromEntries(changedFields.map((key) => [key, data[key]])),
    });
    if (historyError) return NextResponse.json({ error: 'Spotlight saved, but revision history could not be recorded.' }, { status: 500 });
  }

  return NextResponse.json({ data });
}
