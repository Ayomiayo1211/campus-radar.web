import { NextRequest, NextResponse } from 'next/server';
import { createHash } from 'node:crypto';
import { getSupabaseAdmin } from '@/lib/server/supabase';

type RouteContext = { params: Promise<{ id: string }> };

export async function POST(request: NextRequest, { params }: RouteContext) {
  const { id } = await params;
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id)) {
    return NextResponse.json({ error: 'Invalid article' }, { status: 400 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }

  const visitorId = (body as { visitorId?: unknown })?.visitorId;
  if (typeof visitorId !== 'string' || !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(visitorId)) {
    return NextResponse.json({ error: 'Invalid visitor identifier' }, { status: 400 });
  }

  const visitorHash = createHash('sha256').update(visitorId).digest('hex');
  const { data, error } = await getSupabaseAdmin().rpc('record_story_read', {
    p_story_id: id,
    p_visitor_hash: visitorHash,
  });

  if (error) {
    console.error('Could not record article read:', error.message);
    return NextResponse.json({ error: 'Could not record article read' }, { status: 500 });
  }

  if (data === null) return NextResponse.json({ error: 'Article not found' }, { status: 404 });
  return NextResponse.json({ readCount: Number(data) });
}
