
import { NextRequest, NextResponse } from 'next/server';

import { prisma } from '@/lib/server/prisma';
import { slugify } from '@/lib/server/slug';
import { requireRole } from '@/lib/server/auth';
import { storySchema } from '@/lib/validation/content';

const ALL_ROLES = ['SUPER_ADMIN', 'EDITOR', 'REPORTER'] as const;

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);

  const contentType = searchParams.get('type')?.toUpperCase();
  const admin = searchParams.get('admin') === 'true';

  let user: Awaited<ReturnType<typeof requireRole>> | null = null;

  if (admin) {
    try {
      user = await requireRole([...ALL_ROLES]);
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

  const where = {
    ...(admin
      ? user?.role === 'REPORTER'
        ? { authorId: user.id, status: { in: ['DRAFT', 'REVIEW'] } }
        : {}
      : { status: 'PUBLISHED' }),
    ...(contentType ? { contentType } : {}),
  };

  const stories = await prisma.story.findMany({
    where,
    orderBy: admin
      ? { createdAt: 'desc' }
      : { publishedAt: 'desc' },
    take: limit,
    include: {
      tags: true,
      images: {
        orderBy: { displayOrder: 'asc' },
      },
    },
  });

  return NextResponse.json({ data: stories });
}

export async function POST(request: NextRequest) {
  let user: Awaited<ReturnType<typeof requireRole>>;

  try {
    user = await requireRole([...ALL_ROLES]);
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

  const parsed = storySchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      {
        error: 'Invalid story',
        details: parsed.error.flatten(),
      },
      { status: 400 }
    );
  }

  const data = parsed.data;
  const isReporter = user.role === 'REPORTER';

  if (isReporter && !['DRAFT', 'REVIEW'].includes(data.status)) {
    return NextResponse.json(
      {
        error:
          'Reporters can only create drafts or submit stories for review',
      },
      { status: 403 }
    );
  }

  const story = await prisma.story.create({
    data: {
      title: data.title,
      excerpt: data.excerpt,
      body: data.body,
      contentType: data.contentType,
      origin: data.origin,
      commercialStatus: data.commercialStatus,
      authorName: isReporter ? user.name : data.authorName,
      authorId: isReporter ? user.id : (data.authorId ?? user.id),
      featured: isReporter ? false : data.featured,
      coverImage: data.coverImage,
      status: data.status,
      slug: slugify(data.title),
      publishedAt:
        data.status === 'PUBLISHED'
          ? new Date()
          : undefined,
      tags: {
        create: data.tags.map((tag) => ({ tag })),
      },
      images: {
        create: data.galleryImages.map((image, index) => ({
          url: image.url,
          mediaId: image.mediaId,
          altText: image.altText,
          caption: image.caption,
          photographer: image.photographer,
          displayOrder: image.displayOrder ?? index,
        })),
      },
    },
    include: {
      tags: true,
      images: {
        orderBy: { displayOrder: 'asc' },
      },
    },
  });

  return NextResponse.json(
    { data: story },
    { status: 201 }
  );
}
