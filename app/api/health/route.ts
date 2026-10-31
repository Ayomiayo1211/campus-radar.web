import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/server/supabase';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const { error } = await getSupabaseAdmin().from('users').select('id', { count: 'exact', head: true });
    if (error) throw error;
    return NextResponse.json({ ok: true, service: 'campus-radar-api', database: 'connected' }, { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    console.error('Health check failed:', error);
    return NextResponse.json({ ok: false, service: 'campus-radar-api', database: 'unavailable' }, { status: 503, headers: { 'Cache-Control': 'no-store' } });
  }
}
