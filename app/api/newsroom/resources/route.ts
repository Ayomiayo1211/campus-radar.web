import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/lib/server/auth';
import { getSupabaseAdmin } from '@/lib/server/supabase';

export const runtime = 'nodejs';

const MAX_FILE_SIZE = 25 * 1024 * 1024;
const FILE_TYPES: Record<string, { extension: string; category: 'IMAGE' | 'PDF' | 'AUDIO' }> = {
  'image/jpeg': { extension: 'jpg', category: 'IMAGE' },
  'image/png': { extension: 'png', category: 'IMAGE' },
  'image/webp': { extension: 'webp', category: 'IMAGE' },
  'image/gif': { extension: 'gif', category: 'IMAGE' },
  'application/pdf': { extension: 'pdf', category: 'PDF' },
  'audio/mpeg': { extension: 'mp3', category: 'AUDIO' },
  'audio/mp3': { extension: 'mp3', category: 'AUDIO' },
  'audio/wav': { extension: 'wav', category: 'AUDIO' },
  'audio/x-wav': { extension: 'wav', category: 'AUDIO' },
  'audio/ogg': { extension: 'ogg', category: 'AUDIO' },
  'audio/flac': { extension: 'flac', category: 'AUDIO' },
  'audio/aac': { extension: 'aac', category: 'AUDIO' },
};

function hasValidFileSignature(bytes: Uint8Array, category: 'IMAGE' | 'PDF' | 'AUDIO', extension: string) {
  if (category === 'PDF') return bytes.length >= 5 && String.fromCharCode(...bytes.slice(0, 5)) === '%PDF-';

  if (extension === 'jpg') return bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
  if (extension === 'png') return bytes.length >= 8 && [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a].every((value, index) => bytes[index] === value);
  if (extension === 'webp') return bytes.length >= 12 && String.fromCharCode(...bytes.slice(0, 4)) === 'RIFF' && String.fromCharCode(...bytes.slice(8, 12)) === 'WEBP';
  if (extension === 'gif') return bytes.length >= 6 && ['GIF87a', 'GIF89a'].includes(String.fromCharCode(...bytes.slice(0, 6)));
  if (extension === 'wav') return bytes.length >= 12 && String.fromCharCode(...bytes.slice(0, 4)) === 'RIFF' && String.fromCharCode(...bytes.slice(8, 12)) === 'WAVE';
  if (extension === 'ogg') return bytes.length >= 4 && String.fromCharCode(...bytes.slice(0, 4)) === 'OggS';
  if (extension === 'flac') return bytes.length >= 4 && String.fromCharCode(...bytes.slice(0, 4)) === 'fLaC';
  if (extension === 'aac') return bytes.length >= 2 && bytes[0] === 0xff && (bytes[1] & 0xf6) === 0xf0;
  if (extension === 'mp3') return bytes.length >= 3 && (
    String.fromCharCode(...bytes.slice(0, 3)) === 'ID3' ||
    (bytes[0] === 0xff && (bytes[1] & 0xe0) === 0xe0)
  );
  return false;
}

function safeFileName(name: string) {
  return name.replace(/[\\/]/g, '_').replace(/[^a-zA-Z0-9._() -]/g, '_').slice(0, 180) || 'resource';
}

export async function GET() {
  let user;
  try {
    user = await requireRole(['SUPER_ADMIN', 'SENIOR_EDITOR', 'EDITOR', 'REPORTER']);
  } catch {
    return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
  }

  const db = getSupabaseAdmin();
  const { data, error } = await (db as any)
    .from('newsroom_resources')
    .select('id,title,description,original_file_name,mime_type,file_category,file_size,uploaded_by,created_at')
    .order('created_at', { ascending: false })
    .limit(250);

  if (error) {
    console.error('Newsroom resources query failed:', error.message);
    return NextResponse.json({ error: 'Could not load newsroom resources.' }, { status: 500 });
  }

  const uploaderIds: string[] = [...new Set<string>((data ?? []).map((item: any) => item.uploaded_by).filter((id: unknown): id is string => typeof id === 'string'))];
  const { data: uploaders } = uploaderIds.length
    ? await db.from('users').select('id,name').in('id', uploaderIds)
    : { data: [] };
  const names = new Map<string, string>((uploaders ?? []).map(person => [person.id, person.name] as [string, string]));

  return NextResponse.json({
    resources: (data ?? []).map((item: any) => ({
      id: item.id,
      title: item.title,
      description: item.description,
      originalFileName: item.original_file_name,
      mimeType: item.mime_type,
      fileCategory: item.file_category,
      fileSize: Number(item.file_size),
      uploadedBy: item.uploaded_by,
      uploaderName: (item.uploaded_by ? names.get(item.uploaded_by) : undefined) ?? 'Former newsroom member',
      createdAt: item.created_at,
    })),
    currentUser: { id: user.id, role: user.role },
  }, { headers: { 'Cache-Control': 'no-store' } });
}

export async function POST(request: NextRequest) {
  let user;
  try {
    user = await requireRole(['SUPER_ADMIN', 'SENIOR_EDITOR', 'EDITOR', 'REPORTER']);
  } catch (error) {
    const forbidden = error instanceof Error && error.message === 'Forbidden';
    return NextResponse.json(
      { error: forbidden ? 'You do not have permission to upload resources.' : 'Authentication required' },
      { status: forbidden ? 403 : 401 },
    );
  }

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return NextResponse.json({ error: 'Could not read the uploaded file.' }, { status: 400 });
  }

  const file = form.get('file');
  if (!(file instanceof File)) return NextResponse.json({ error: 'Choose a file to upload.' }, { status: 400 });
  if (!file.size) return NextResponse.json({ error: 'The selected file is empty.' }, { status: 400 });
  if (file.size > MAX_FILE_SIZE) return NextResponse.json({ error: 'Files must be 25MB or smaller for this first release.' }, { status: 413 });

  const type = FILE_TYPES[file.type.toLowerCase()];
  if (!type) {
    return NextResponse.json({ error: 'Supported files: JPEG, PNG, WebP, GIF, PDF, MP3, WAV, OGG, FLAC and AAC.' }, { status: 415 });
  }

  const bytes = new Uint8Array(await file.arrayBuffer());
  if (!hasValidFileSignature(bytes, type.category, type.extension)) {
    return NextResponse.json({ error: 'The file contents do not match the selected file type.' }, { status: 415 });
  }

  const titleInput = String(form.get('title') ?? '').trim();
  const description = String(form.get('description') ?? '').trim();
  const lastDot = file.name.lastIndexOf('.');
  const fallbackTitle = lastDot > 0 ? file.name.slice(0, lastDot) : file.name;
  const title = (titleInput || fallbackTitle).slice(0, 160);
  if (description.length > 1000) return NextResponse.json({ error: 'Description must be 1,000 characters or fewer.' }, { status: 400 });

  const db = getSupabaseAdmin();
  const storagePath = `resources/${user.id}/${crypto.randomUUID()}.${type.extension}`;
  const { error: uploadError } = await db.storage.from('campus-radar-resources').upload(storagePath, file, {
    contentType: file.type,
    cacheControl: '3600',
    upsert: false,
  });

  if (uploadError) {
    console.error('Newsroom resource upload failed:', uploadError.message);
    return NextResponse.json({ error: 'File upload failed. Please try again.' }, { status: 502 });
  }

  const { data, error } = await (db as any).from('newsroom_resources').insert({
    title,
    description: description || null,
    original_file_name: safeFileName(file.name),
    mime_type: file.type,
    file_category: type.category,
    file_size: file.size,
    storage_path: storagePath,
    uploaded_by: user.id,
  }).select('id,title,description,original_file_name,mime_type,file_category,file_size,uploaded_by,created_at').single();

  if (error || !data) {
    await db.storage.from('campus-radar-resources').remove([storagePath]);
    console.error('Newsroom resource metadata insert failed:', error?.message);
    return NextResponse.json({ error: 'The file was uploaded but its library record could not be saved.' }, { status: 500 });
  }

  return NextResponse.json({
    resource: {
      id: data.id,
      title: data.title,
      description: data.description,
      originalFileName: data.original_file_name,
      mimeType: data.mime_type,
      fileCategory: data.file_category,
      fileSize: Number(data.file_size),
      uploadedBy: data.uploaded_by,
      uploaderName: user.name,
      createdAt: data.created_at,
    },
  }, { status: 201 });
}
