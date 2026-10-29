
import { NextRequest, NextResponse } from 'next/server';

import { prisma } from '@/lib/server/prisma';
import { slugify } from '@/lib/server/slug';
import { requireRole } from '@/lib/server/auth';
import { radarSchema } from '@/lib/validation/content';

const MANAGERS = ['SUPER_ADMIN', 'EDITOR'] as const;

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const admin = searchParams.get('admin') === 'true';

  if (admin) {
    try {
      await requireRole([...MANAGERS]);
    } catch {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
  }

  const limitParam = Number(searchParams.get('limit') ?? 20);
  const limit = Number.isFinite(limitParam)
    ? Math.min(Math.max(limitParam, 1), 50)
    : 20;

  const radarItems = await prisma.radarItem.findMany({
    where: admin ? {} : { status: 'PUBLISHED' },
    orderBy: admin
      ? { createdAt: 'desc' }
      : { publishedAt: 'desc' },
    take: limit,
  });

  return NextResponse.json({ data: radarItems });
}

export async function POST(request: NextRequest) {
  try {
    await requireRole([...MANAGERS]);
  } catch {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    );
  }

  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: 'Invalid JSON body' },
      { status: 400 }
    );
  }

  const parsed = radarSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      {
        error: 'Invalid Radar item',
        details: parsed.error.flatten(),
      },
      { status: 400 }
    );
  }

  const data = parsed.data;

  const radarItem = await prisma.radarItem.create({
    data: {
      title: data.title,
      summary: data.summary,
      coverImage: data.coverImage || null,
      kind: data.kind,
      origin: data.origin,
      commercialStatus: data.commercialStatus,
      eventDate: data.eventDate
        ? new Date(data.eventDate)
        : undefined,
      location: data.location,
      link: data.link,
      status: data.status,
      slug: slugify(data.title),
      publishedAt:
        data.status === 'PUBLISHED'
          ? new Date()
          : undefined,
    },
  });

  return NextResponse.json(
    { data: radarItem },
    { status: 201 }
  );
}
