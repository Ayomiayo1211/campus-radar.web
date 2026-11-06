import { NextResponse } from 'next/server';
import { getSupabaseAdmin, toCamelCase } from '@/lib/server/supabase';

export const dynamic = 'force-dynamic';

export async function GET() {
  const { data, error } = await getSupabaseAdmin()
    .from('stories')
    .select('slug,title,excerpt,cover_image')
    .eq('status', 'PUBLISHED')
    .eq('is_spotlight', true)
    .maybeSingle();

  if (error) {
    console.error('Campus Radar Spotlight lookup failed:', error.message);
    return NextResponse.json({ error: 'Could not load Spotlight' }, { status: 500 });
  }

  return NextResponse.json({ data: data ? toCamelCase(data) : null });
}
