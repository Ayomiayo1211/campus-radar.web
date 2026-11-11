import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/server/supabase';

type RouteContext = {
  params: Promise<{ code: string }>;
};

export async function GET(request: NextRequest, { params }: RouteContext) {
  const { code } = await params;
  const { data: story, error } = await getSupabaseAdmin()
    .from('stories')
    .select('slug')
    .eq('short_code', code.toLowerCase())
    .eq('status', 'PUBLISHED')
    .maybeSingle();

  if (error) {
    console.error('Short article link lookup failed:', error.message);
    return NextResponse.redirect(new URL('/404', request.url), 302);
  }

  if (!story) {
    return NextResponse.redirect(new URL('/404', request.url), 302);
  }

  return NextResponse.redirect(new URL(`/news/${story.slug}`, request.url), 308);
}
