import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/server/supabase';
import { requireRole } from '@/lib/server/auth';

type Ctx = { params: Promise<{ id: string }> };
export async function GET(_request: NextRequest, { params }: Ctx) {
  const { id } = await params;
  try { await requireRole(['SUPER_ADMIN', 'SENIOR_EDITOR', 'EDITOR']); }
  catch { return NextResponse.json({ error: 'Editors only' }, { status: 403 }); }
  const { data, error } = await (getSupabaseAdmin() as any).from('spotlight_edit_history')
    .select('id,spotlight_id,editor_id,editor_name,action,before_snapshot,after_snapshot,created_at')
    .eq('spotlight_id', id).order('created_at', { ascending: false });
  if (error) return NextResponse.json({ error: 'Could not load revision history.' }, { status: 500 });
  return NextResponse.json({ data: data ?? [] });
}