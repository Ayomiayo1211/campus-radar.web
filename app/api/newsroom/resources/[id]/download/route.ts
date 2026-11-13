import { NextResponse } from 'next/server';
import { requireRole } from '@/lib/server/auth';
import { getSupabaseAdmin } from '@/lib/server/supabase';

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    await requireRole(['SUPER_ADMIN', 'SENIOR_EDITOR', 'EDITOR', 'REPORTER']);
  } catch {
    return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
  }

  const { id } = await context.params;
  const db = getSupabaseAdmin();
  const { data: resource, error } = await (db as any)
    .from('newsroom_resources')
    .select('storage_path,original_file_name,mime_type')
    .eq('id', id)
    .maybeSingle();

  if (error || !resource) return NextResponse.json({ error: 'Resource not found.' }, { status: 404 });

  const { data, error: signedUrlError } = await db.storage
    .from('campus-radar-resources')
    .createSignedUrl(resource.storage_path, 60);

  if (signedUrlError || !data?.signedUrl) {
    console.error('Could not create newsroom resource download URL:', signedUrlError?.message);
    return NextResponse.json({ error: 'Could not open this resource. Please try again.' }, { status: 502 });
  }

  return NextResponse.redirect(data.signedUrl, {
    status: 302,
    headers: { 'Cache-Control': 'no-store, private' },
  });
}
