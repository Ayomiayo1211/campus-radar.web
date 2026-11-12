import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin, toCamelCase } from '@/lib/server/supabase';
import { requireRole } from '@/lib/server/auth';
import { storySchema } from '@/lib/validation/content';
import { notifyEditorsOfStorySubmission } from '@/lib/server/story-notifications';
import { sendPublishedStoryNewsletter } from '@/lib/server/engagement';

type RouteContext = { params: Promise<{ id: string }> };
const ROLES = ['SUPER_ADMIN', 'SENIOR_EDITOR', 'EDITOR', 'REPORTER'] as const;

function snapshot(story: any) {
  return {
    title: story.title, excerpt: story.excerpt, body: story.body,
    content_type: story.content_type, origin: story.origin,
    commercial_status: story.commercial_status, status: story.status,
    featured: story.featured, author_name: story.author_name,
    cover_image: story.cover_image, tags: story.tags ?? [], images: story.images ?? [],
  };
}

export async function GET(_request: NextRequest, { params }: RouteContext) {
  const { id } = await params;
  const db = getSupabaseAdmin();
  const { data: story, error } = await db.from('stories')
    .select('*,tags:story_tags(*),images:story_images(*),author:users!stories_author_id_fkey(id,name)')
    .eq('id', id).maybeSingle();
  if (error) return NextResponse.json({ error: 'Could not load story' }, { status: 500 });
  if (!story) return NextResponse.json({ error: 'Story not found' }, { status: 404 });

  let user: Awaited<ReturnType<typeof requireRole>> | null = null;
  try { user = await requireRole([...ROLES]); } catch { /* public published-story read */ }
  if (story.status !== 'PUBLISHED' && !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  if (user?.role === 'REPORTER' && story.status !== 'PUBLISHED' && story.author_id !== user.id && story.assigned_reporter_id !== user.id) {
    return NextResponse.json({ error: 'You cannot access this story' }, { status: 403 });
  }

  const response = toCamelCase(story);
  if (user && (user.role !== 'REPORTER' || story.status !== 'PUBLISHED')) {
    response.currentUserId = user.id;
    response.currentUserRole = user.role;
    response.editingLockedBy = story.editing_locked_by;
    response.editingLockedAt = story.editing_locked_at;
    if (story.editing_locked_by) {
      const { data: owner } = await db.from('users').select('id,name')
        .eq('id', story.editing_locked_by).maybeSingle();
      response.editingLockedByName = owner?.name ?? 'Another editor';
    } else {
      response.editingLockedByName = null;
    }
  } else {
    delete response.currentUserId;
    delete response.currentUserRole;
    delete response.editingLockedBy;
    delete response.editingLockedAt;
  }
  return NextResponse.json({ data: response });
}

export async function PATCH(request: NextRequest, { params }: RouteContext) {
  const { id } = await params;
  let user;
  try { user = await requireRole([...ROLES]); }
  catch { return NextResponse.json({ error: 'Unauthorized' }, { status: 401 }); }

  const db = getSupabaseAdmin();
  const { data: existing, error: lookupError } = await db.from('stories')
    .select('*,tags:story_tags(*),images:story_images(*)')
    .eq('id', id).maybeSingle();
  if (lookupError) return NextResponse.json({ error: 'Could not load story' }, { status: 500 });
  if (!existing) return NextResponse.json({ error: 'Story not found' }, { status: 404 });

  if (existing.editing_locked_by && existing.editing_locked_by !== user.id) {
    const { data: owner } = await db.from('users').select('name')
      .eq('id', existing.editing_locked_by).maybeSingle();
    return NextResponse.json({
      error: `This story is locked by ${owner?.name || 'another editor'}. You can view its history, but cannot make changes.`,
    }, { status: 423 });
  }
  if (user.role === 'REPORTER' && ((existing.author_id !== user.id && existing.assigned_reporter_id !== user.id) || !['DRAFT', 'REVIEW'].includes(existing.status))) {
    return NextResponse.json({ error: 'You can only edit your own draft or review stories' }, { status: 403 });
  }
  if (user.role !== 'REPORTER' && existing.editing_locked_by !== user.id) {
    return NextResponse.json({ error: 'Claim this story before making changes.' }, { status: 409 });
  }

  let body: unknown;
  try { body = await request.json(); }
  catch { return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 }); }
  const parsed = storySchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: 'Invalid story', details: parsed.error.flatten() }, { status: 400 });
  const d = parsed.data;
  if (user.role === 'REPORTER' && !['DRAFT', 'REVIEW'].includes(d.status)) {
    return NextResponse.json({ error: 'Reporters cannot publish or archive stories' }, { status: 403 });
  }
  if (user.role === 'REPORTER' && existing.status === 'REVIEW' && d.status !== 'REVIEW') {
    return NextResponse.json({ error: 'A story already submitted for editorial review cannot be withdrawn by its reporter. An editor must return it for revisions.' }, { status: 403 });
  }

  const beforeSnapshot = snapshot(existing);
  let updateQuery = db.from('stories').update({
    title: d.title, excerpt: d.excerpt, body: d.body, content_type: d.contentType,
    origin: d.origin, commercial_status: d.commercialStatus,
    author_name: user.role === 'REPORTER' ? existing.author_name : d.authorName,
    author_id: user.role === 'REPORTER' ? existing.author_id : (d.authorId ?? existing.author_id),
    featured: user.role === 'REPORTER' ? existing.featured : d.featured,
    is_spotlight: user.role === 'REPORTER' ? existing.is_spotlight : false,
    cover_image: d.coverImage ?? null, status: d.status,
    published_at: d.status === 'PUBLISHED' ? (existing.published_at ?? new Date().toISOString()) : null,
    updated_at: new Date().toISOString(),
  }).eq('id', id);

  // Conditional filters make the ownership check race-safe: a second editor cannot
  // save against a story after another user has claimed it.
  updateQuery = user.role === 'REPORTER'
    ? updateQuery.is('editing_locked_by', null)
    : updateQuery.eq('editing_locked_by', user.id);

  const { data: story, error } = await updateQuery.select('*').maybeSingle();
  if (error) return NextResponse.json({ error: 'Could not update story' }, { status: 500 });
  if (!story) return NextResponse.json({ error: 'The story lock changed before your save. Reload the page; your changes were not saved.' }, { status: 409 });

  const tagDelete = await db.from('story_tags').delete().eq('story_id', id);
  if (tagDelete.error) return NextResponse.json({ error: 'Story fields saved, but tags could not be updated.' }, { status: 500 });
  if (d.tags.length) {
    const result = await db.from('story_tags').insert(d.tags.map(tag => ({ story_id: id, tag })));
    if (result.error) return NextResponse.json({ error: 'Story fields saved, but tags could not be updated.' }, { status: 500 });
  }

  if (d.galleryImages !== undefined) {
    const deleted = await db.from('story_images').delete().eq('story_id', id);
    if (deleted.error) return NextResponse.json({ error: 'Story saved, but gallery images could not be updated.' }, { status: 500 });
    if (d.galleryImages.length) {
      const result = await db.from('story_images').insert(d.galleryImages.map((image, index) => ({
        story_id: id, url: image.url, media_id: image.mediaId || null,
        alt_text: image.altText || null, caption: image.caption || null,
        photographer: image.photographer || null, display_order: image.displayOrder ?? index,
      })));
      if (result.error) return NextResponse.json({ error: 'Story saved, but gallery images could not be updated.' }, { status: 500 });
    }
  }

  if (user.role !== 'REPORTER' && (d.isSpotlight || existing.is_spotlight)) {
    const spotlight = await db.rpc('set_current_spotlight', {
      p_story_id: d.isSpotlight && d.status === 'PUBLISHED' ? id : null,
    });
    if (spotlight.error) return NextResponse.json({ error: 'Story saved, but Spotlight selection could not be updated.' }, { status: 500 });
  }

  const { data: complete, error: completeError } = await db.from('stories')
    .select('*,tags:story_tags(*),images:story_images(*),author:users(id,name)')
    .eq('id', id).single();
  if (completeError || !complete) return NextResponse.json({ error: 'Story saved, but the updated version could not be reloaded.' }, { status: 500 });

  const { error: historyError } = await db.from('story_edit_history').insert({
    story_id: id, editor_id: user.id, editor_name: user.name, action: 'UPDATED',
    before_snapshot: beforeSnapshot, after_snapshot: snapshot(complete),
  });
  if (historyError) {
    return NextResponse.json({ error: 'Story was saved, but its revision could not be recorded. Please notify a Super Admin before making another change.' }, { status: 500 });
  }

  if (existing.status !== 'PUBLISHED' && d.status === 'PUBLISHED') {
    await sendPublishedStoryNewsletter(story, request.nextUrl.origin)
      .catch(error => console.error('[newsletter] Campaign dispatch failed:', error));
  }
  if (user.role === 'REPORTER' && existing.status !== 'REVIEW' && d.status === 'REVIEW') {
    await notifyEditorsOfStorySubmission(story, request.nextUrl.origin);
  }

  return NextResponse.json({ data: toCamelCase(complete) });
}

export async function DELETE(_request: NextRequest, { params }: RouteContext) {
  const { id } = await params;
  let user;
  try { user = await requireRole(['SUPER_ADMIN', 'SENIOR_EDITOR', 'EDITOR']); }
  catch { return NextResponse.json({ error: 'Unauthorized' }, { status: 401 }); }

  const db = getSupabaseAdmin();
  const { data: existing, error: lookupError } = await db.from('stories')
    .select('editing_locked_by').eq('id', id).maybeSingle();
  if (lookupError) return NextResponse.json({ error: 'Could not load story' }, { status: 500 });
  if (!existing) return NextResponse.json({ error: 'Story not found' }, { status: 404 });
  if (existing.editing_locked_by && existing.editing_locked_by !== user.id) {
    return NextResponse.json({ error: 'This story is locked by another editor and cannot be deleted.' }, { status: 423 });
  }

  const { data, error } = await db.from('stories').delete().eq('id', id).select('id').maybeSingle();
  if (error) return NextResponse.json({ error: 'Could not delete story' }, { status: 500 });
  if (!data) return NextResponse.json({ error: 'Story not found' }, { status: 404 });
  return NextResponse.json({ message: 'Story deleted successfully' });
}
