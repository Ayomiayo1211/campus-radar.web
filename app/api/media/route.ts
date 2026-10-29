import { NextResponse } from 'next/server';

import { prisma } from '@/lib/server/prisma';
import { requireRole } from '@/lib/server/auth';

export async function GET() {
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

  const media = await prisma.media.findMany({
    orderBy: {
      createdAt: 'desc',
    },
  });

  return NextResponse.json({
    data: media,
  });
}