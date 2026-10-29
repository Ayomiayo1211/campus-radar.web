
import { NextRequest, NextResponse } from 'next/server';

import { prisma } from '@/lib/server/prisma';
import { slugify } from '@/lib/server/slug';
import { requireRole } from '@/lib/server/auth';
import { radarSchema } from '@/lib/validation/content';

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

const MANAGERS = ['SUPER_ADMIN', 'EDITOR'] as const;

export async function GET(
  request: NextRequest,
  { params }: RouteContext
) {
  const { id } = await params;

  const admin =
    new URL(request.url).searchParams.get('admin') === 'true';

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

  const radarItem = await prisma.radarItem.findUnique({
    where: { id },
  });

  if (
    !radarItem ||
    (!admin && radarItem.status !== 'PUBLISHED')
  ) {
    return NextResponse.json(
      { error: 'Radar item not found' },
      { status: 404 }
    );
  }

  return NextResponse.json({ data: radarItem });
}

export async function PATCH(
  request: NextRequest,
  { params }: RouteContext
) {
  const { id } = await params;

  try {
    await requireRole([...MANAGERS]);
  } catch {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    );
  }

  const existingItem = await prisma.radarItem.findUnique({
    where: { id },
  });

  if (!existingItem) {
    return NextResponse.json(
      { error: 'Radar item not found' },
      { status: 404 }
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

  const radarItem = await prisma.radarItem.update({
    where: { id },
    data: {
      title: data.title,
      summary: data.summary,
      coverImage: data.coverImage || null,
      kind: data.kind,
      origin: data.origin,
      commercialStatus: data.commercialStatus,
      eventDate: data.eventDate
        ? new Date(data.eventDate)
        : null,
      location: data.location || null,
      link: data.link || null,
      status: data.status,
      slug: slugify(data.title),
      publishedAt:
        data.status === 'PUBLISHED'
          ? existingItem.publishedAt ?? new Date()
          : null,
    },
  });

  return NextResponse.json({ data: radarItem });
}

export async function DELETE(
  _request: NextRequest,
  { params }: RouteContext
) {
  const { id } = await params;

  try {
    await requireRole([...MANAGERS]);
  } catch {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    );
  }

  const existingItem = await prisma.radarItem.findUnique({
    where: { id },
  });

  if (!existingItem) {
    return NextResponse.json(
      { error: 'Radar item not found' },
      { status: 404 }
    );
  }

  await prisma.radarItem.delete({
    where: { id },
  });

  return NextResponse.json({ success: true });
}
