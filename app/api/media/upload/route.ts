import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/server/prisma';
import { requireRole } from '@/lib/server/auth';

const MAX_FILE_SIZE = 10 * 1024 * 1024;
const ALLOWED_TYPES: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/gif': 'gif',
};

function detectImageFormat(bytes: Uint8Array): string | null {
  if (bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return 'jpg';
  if (bytes.length >= 8 && [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a].every((value, index) => bytes[index] === value)) return 'png';
  if (bytes.length >= 12 && String.fromCharCode(...bytes.slice(0, 4)) === 'RIFF' && String.fromCharCode(...bytes.slice(8, 12)) === 'WEBP') return 'webp';
  if (bytes.length >= 6 && ['GIF87a', 'GIF89a'].includes(String.fromCharCode(...bytes.slice(0, 6)))) return 'gif';
  return null;
}

function toHex(buffer: ArrayBuffer): string {
  return Array.from(new Uint8Array(buffer), (byte) => byte.toString(16).padStart(2, '0')).join('');
}

async function signCloudinaryParams(params: Record<string, string>, apiSecret: string): Promise<string> {
  const canonical = Object.keys(params).sort().map((key) => `${key}=${params[key]}`).join('&');
  const bytes = new TextEncoder().encode(canonical + apiSecret);
  const digest = await crypto.subtle.digest('SHA-1', bytes);
  return toHex(digest);
}

function cloudinaryCredentials() {
  const value = process.env.CLOUDINARY_URL;
  if (!value) throw new Error('Cloudinary is not configured');
  const parsed = new URL(value);
  if (parsed.protocol !== 'cloudinary:') throw new Error('Invalid Cloudinary configuration');
  const cloudName = parsed.hostname;
  const apiKey = decodeURIComponent(parsed.username);
  const apiSecret = decodeURIComponent(parsed.password);
  if (!cloudName || !apiKey || !apiSecret) throw new Error('Incomplete Cloudinary configuration');
  return { cloudName, apiKey, apiSecret };
}

export async function POST(request: NextRequest) {
  try {
    await requireRole(['SUPER_ADMIN', 'EDITOR', 'REPORTER']);
  } catch (error) {
    const forbidden = error instanceof Error && error.message === 'Forbidden';
    return NextResponse.json({ error: forbidden ? 'You do not have permission to upload media' : 'Authentication required' }, { status: forbidden ? 403 : 401 });
  }

  try {
    const formData = await request.formData();
    const file = formData.get('file');
    if (!(file instanceof File)) return NextResponse.json({ error: 'No image file provided' }, { status: 400 });
    if (!file.size) return NextResponse.json({ error: 'The image file is empty' }, { status: 400 });
    if (file.size > MAX_FILE_SIZE) return NextResponse.json({ error: 'Image must be 10MB or smaller' }, { status: 400 });

    const expectedFormat = ALLOWED_TYPES[file.type];
    if (!expectedFormat) return NextResponse.json({ error: 'Only JPEG, PNG, WebP and GIF images are allowed' }, { status: 400 });

    const bytes = new Uint8Array(await file.arrayBuffer());
    const actualFormat = detectImageFormat(bytes);
    if (!actualFormat || actualFormat !== expectedFormat) {
      return NextResponse.json({ error: 'The file content does not match a supported image type' }, { status: 400 });
    }

    const { cloudName, apiKey, apiSecret } = cloudinaryCredentials();
    const timestamp = Math.floor(Date.now() / 1000).toString();
    const signedParams = { folder: 'campus-radar', timestamp };
    const signature = await signCloudinaryParams(signedParams, apiSecret);

    const uploadData = new FormData();
    uploadData.set('file', file, file.name);
    uploadData.set('api_key', apiKey);
    uploadData.set('timestamp', timestamp);
    uploadData.set('folder', 'campus-radar');
    uploadData.set('signature', signature);

    const uploadResponse = await fetch(`https://api.cloudinary.com/v1_1/${encodeURIComponent(cloudName)}/image/upload`, {
      method: 'POST',
      body: uploadData,
    });
    const uploaded = await uploadResponse.json() as {
      public_id?: string;
      url?: string;
      secure_url?: string;
      resource_type?: string;
      format?: string;
      width?: number;
      height?: number;
      bytes?: number;
      error?: { message?: string };
    };

    if (!uploadResponse.ok || !uploaded.public_id || !uploaded.secure_url) {
      console.error('Cloudinary upload failed', uploaded.error?.message || uploadResponse.status);
      return NextResponse.json({ error: 'Image upload failed. Please try again.' }, { status: 502 });
    }

    const media = await prisma.media.create({
      data: {
        publicId: uploaded.public_id,
        url: uploaded.url || uploaded.secure_url,
        secureUrl: uploaded.secure_url,
        resourceType: uploaded.resource_type || 'image',
        format: uploaded.format || actualFormat,
        width: uploaded.width ?? null,
        height: uploaded.height ?? null,
        bytes: uploaded.bytes ?? file.size,
        originalName: file.name.slice(0, 255),
        folder: 'campus-radar',
      },
    });

    return NextResponse.json({ data: media }, { status: 201 });
  } catch (error) {
    console.error('Media upload failed:', error);
    return NextResponse.json({ error: 'Image upload failed. Please try again.' }, { status: 500 });
  }
}
