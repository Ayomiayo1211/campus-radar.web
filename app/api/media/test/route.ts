
import { NextResponse } from 'next/server';

import { cloudinary } from '@/lib/server/cloudinary';
import { requireRole } from '@/lib/server/auth';

export async function GET() {
  try {
    await requireRole(['SUPER_ADMIN']);
  } catch {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    );
  }

  try {
    const result = await cloudinary.api.ping();

    return NextResponse.json({
      success: true,
      status: result.status,
    });
  } catch (error) {
    console.error('Cloudinary connection failed:', error);

    return NextResponse.json(
      { success: false, error: 'Cloudinary connection failed' },
      { status: 503 }
    );
  }
}
