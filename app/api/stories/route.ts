import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/server/supabase';
import { slugify } from '@/lib/server/slug';
import { requireRole } from '@/lib/server/auth';
import { storySchema } from '@/lib/validation/content';
const ALL_ROLES = ['SUPER_ADMIN', 'EDITOR', 'REPORTER'] as const;

export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const admin = params.get('admin') === 'true';
  let user: Awaited<ReturnType<typeof requireRole>> | null = null;
  if (admin) {
    try { user = await requireRole([...ALL_ROLES]); }
    catch { return NextResponse.json({ error: 'Unauthorized' }, { status: 401 }); }
  }
  const n = Number(params.get('limit') ?? 20);
  const limit = Number.isFinite(n) ? Math.min(Math.max(n, 1), 50) : 20;
  const db = getSupabaseAdmin();
  let query = db.from('stories').select('*, tags:story_tags(*), images:story_images(*)')
    .order(admin ? 'created_at' : 'published_at', { ascending: false }).limit(limit);
  if (!admin) query = query.eq('status', 'PUBLISHED');
  if (admin && user?.role === 'REPORTER') query = query.eq('author_id', user.id).in('status', ['DRAFT', 'REVIEW']);
  const type = params.get('type')?.toUpperCase();
  if (type) query = query.eq('content_type', type);
  const { data, error } = await query;
  if (error) return NextResponse.json({ error: 'Could not load stories' }, { status: 500 });
  return NextResponse.json({ data: data ?? [] });
}

export async function POST(request: NextRequest) {
  let user;
  try { user = await requireRole([...ALL_ROLES]); }
  catch { return NextResponse.json({ error: 'Unauthorized' }, { status: 401 }); }
  let body: unknown;
  try { body = await request.json(); }
  catch { return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 }); }
  const parsed = storySchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: 'Invalid story', details: parsed.error.flatten() }, { status: 400 });
  const d = parsed.data;
  const reporter = user.role === 'REPORTER';
  if (reporter && !['DRAFT', 'REVIEW'].includes(d.status)) return NextResponse.json({ error: 'Reporters can only create drafts or submit stories for review' }, { status: 403 });
  const db = getSupabaseAdmin();
  const { data: story, error } = await db.from('stories').insert({
    title:d.title, slug:slugify(d.title), excerpt:d.excerpt, body:d.body, content_type:d.contentType,
    origin:d.origin, commercial_status:d.commercialStatus, author_name:reporter?user.name:d.authorName,
    author_id:reporter?user.id:(d.authorId??user.id), featured:reporter?false:d.featured,
    cover_image:d.coverImage??null, status:d.status, published_at:d.status==='PUBLISHED'?new Date().toISOString():null,
  }).select('*').single();
  if (error || !story) return NextResponse.json({ error: 'Could not create story' }, { status: 500 });
  const tags = d.tags.map(tag => ({ story_id:story.id, tag }));
  const images = d.galleryImages.map((image,index) => ({ story_id:story.id, url:image.url, media_id:image.mediaId||null, alt_text:image.altText||null, caption:image.caption||null, photographer:image.photographer||null, display_order:image.displayOrder??index }));
  if (tags.length) { const r=await db.from('story_tags').insert(tags); if(r.error){await db.from('stories').delete().eq('id',story.id);return NextResponse.json({error:'Could not save story tags'},{status:500});} }
  if (images.length) { const r=await db.from('story_images').insert(images); if(r.error){await db.from('stories').delete().eq('id',story.id);return NextResponse.json({error:'Could not save story images'},{status:500});} }
  const {data:complete}=await db.from('stories').select('*, tags:story_tags(*), images:story_images(*)').eq('id',story.id).single();
  return NextResponse.json({data:complete??story},{status:201});
}
