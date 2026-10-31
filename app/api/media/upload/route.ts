
import { NextRequest, NextResponse } from 'next/server';

import { cloudinary } from '@/lib/server/cloudinary';
import { getSupabaseAdmin, toCamelCase } from '@/lib/server/supabase';
import { requireRole } from '@/lib/server/auth';

const MAX_FILE_SIZE = 10 * 1024 * 1024;

const ALLOWED_TYPES: Record<string, string> = {
  'image/jpeg': 'jpeg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/gif': 'gif',
};

function detectImageFormat(buffer: Buffer): string | null {
  if (
    buffer.length >= 3 &&
    buffer[0] === 0xff &&
    buffer[1] === 0xd8 &&
    buffer[2] === 0xff
  ) {
    return 'jpeg';
  }

  if (
    buffer.length >= 8 &&
    buffer.subarray(0, 8).equals(
      Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])
    )
  ) {
    return 'png';
  }

  if (
    buffer.length >= 12 &&
    buffer.toString('ascii', 0, 4) === 'RIFF' &&
    buffer.toString('ascii', 8, 12) === 'WEBP'
  ) {
    return 'webp';
  }

  if (
    buffer.length >= 6 &&
    ['GIF87a', 'GIF89a'].includes(
      buffer.toString('ascii', 0, 6)
    )
  ) {
    return 'gif';
  }

  return null;
}

export async function POST(request: NextRequest) {
  try {
    await requireRole([
      'SUPER_ADMIN',
      'EDITOR',
      'REPORTER',
    ]);
  } catch {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    );
  }

  try {
    const formData = await request.formData();
    const file = formData.get('file');

    if (!(file instanceof File)) {
      return NextResponse.json(
        { error: 'No image file provided' },
        { status: 400 }
      );
    }

    if (file.size === 0) {
      return NextResponse.json(
        { error: 'The image file is empty' },
        { status: 400 }
      );
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: 'Image must be 10MB or smaller' },
        { status: 400 }
      );
    }

    const expectedFormat = ALLOWED_TYPES[file.type];

    if (!expectedFormat) {
      return NextResponse.json(
        { error: 'Only JPEG, PNG, WebP and GIF images are allowed' },
        { status: 400 }
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const actualFormat = detectImageFormat(buffer);

    if (!actualFormat || actualFormat !== expectedFormat) {
      return NextResponse.json(
        { error: 'The file content does not match a supported image type' },
        { status: 400 }
      );
    }

    const result = await new Promise<any>((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: 'campus-radar',
          resource_type: 'image',
          allowed_formats: ['jpg', 'jpeg', 'png', 'webp', 'gif'],
        },
        (error, uploadedResult) => {
          if (error) {
            reject(error);
          } else if (!uploadedResult) {
            reject(new Error('Cloudinary returned no upload result'));
          } else {
            resolve(uploadedResult);
          }
        }
      );

      uploadStream.end(buffer);
    });

    const { data: media, error: mediaError } = await getSupabaseAdmin().from('media').insert({
        public_id: result.public_id,
        url: result.url,
        secure_url: result.secure_url,
        resource_type: result.resource_type,
        format: result.format,
        width: result.width,
        height: result.height,
        bytes: result.bytes,
        original_name: file.name.slice(0, 255),
        folder: 'campus-radar',
      }).select('*').single();

    if (mediaError || !media) throw new Error('Could not save media record');

    return NextResponse.json(
      { data: toCamelCase(media) },
      { status: 201 }
    );
  } catch (error) {
    console.error('Media upload failed:', error);

    return NextResponse.json(
      { error: 'Image upload failed. Please try again.' },
      { status: 500 }
    );
  }
}
