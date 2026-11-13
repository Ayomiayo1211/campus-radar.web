import { NextResponse } from 'next/server';
import { requireRole } from '@/lib/server/auth';
import { getSupabaseAdmin } from '@/lib/server/supabase';

export async function DELETE(_request: Request, context: { params: Promise<{ id: string }> }) {
  let user;
  try {
    user = await requireRole(['SUPER_ADMIN', 'SENIOR_EDITOR', 'EDITOR', 'REPORTER']);
  } catch {
    return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
  }

  const { id } = await context.params;
  const db = getSupabaseAdmin();
  const { data: resource, error } = await (db as any)
    .from('newsroom_resources')
    .select('id,storage_path,uploaded_by')
    .eq('id', id)
    .maybeSingle();

  if (error || !resource) return NextResponse.json({ error: 'Resource not found.' }, { status: 404 });

  const canDeleteAny = ['SUPER_ADMIN', 'SENIOR_EDITOR'].includes(user.role);
  if (!canDeleteAny && resource.uploaded_by !== user.id) {
    return NextResponse.json({ error: 'You can only delete resources you uploaded.' }, { status: 403 });
  }

  const { error: storageError } = await db.storage.from('campus-radar-resources').remove([resource.storage_path]);
  if (storageError) {
    console.error('Newsroom resource deletion failed:', storageError.message);
    return NextResponse.json({ error: 'Could not delete the stored file. Please try again.' }, { status: 502 });
  }

  const { error: deleteError } = await (db as any).from('newsroom_resources').delete().eq('id', id);
  if (deleteError) {
    console.error('Newsroom resource record deletion failed:', deleteError.message);
    return NextResponse.json({ error: 'The file was removed but its library record could not be deleted.' }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
