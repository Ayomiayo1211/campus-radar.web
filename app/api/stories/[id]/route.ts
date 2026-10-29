
import { NextRequest, NextResponse } from 'next/server';

import { prisma } from '@/lib/server/prisma';
import { requireRole } from '@/lib/server/auth';
import { storySchema } from '@/lib/validation/content';

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

const STORY_ROLES = ['SUPER_ADMIN', 'EDITOR', 'REPORTER'] as const;

export async function GET(
  _request: NextRequest,
  { params }: RouteContext
) {
  const { id } = await params;

  const story = await prisma.story.findUnique({
    where: { id },
    include: {
      tags: true,
      images: {
        orderBy: { displayOrder: 'asc' },
      },
      author: {
        select: { id: true, name: true },
      },
    },
  });

  if (!story) {
    return NextResponse.json(
      { error: 'Story not found' },
      { status: 404 }
    );
  }

  if (story.status !== 'PUBLISHED') {
    let user;

    try {
      user = await requireRole([...STORY_ROLES]);
    } catch {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    if (
      user.role === 'REPORTER' &&
      story.authorId !== user.id
    ) {
      return NextResponse.json(
        { error: 'You cannot access this story' },
        { status: 403 }
      );
    }
  }

  return NextResponse.json({ data: story });
}

export async function PATCH(
  request: NextRequest,
  { params }: RouteContext
) {
  const { id } = await params;

  let user;

  try {
    user = await requireRole([...STORY_ROLES]);
  } catch {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    );
  }

  const existingStory = await prisma.story.findUnique({
    where: { id },
  });

  if (!existingStory) {
    return NextResponse.json(
      { error: 'Story not found' },
      { status: 404 }
    );
  }

  if (user.role === 'REPORTER') {
    if (existingStory.authorId !== user.id) {
      return NextResponse.json(
        { error: 'You can only edit your own stories' },
        { status: 403 }
      );
    }

    if (!['DRAFT', 'REVIEW'].includes(existingStory.status)) {
      return NextResponse.json(
        { error: 'Only draft or review stories can be edited' },
        { status: 403 }
      );
    }
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

  if (
    user.role === 'REPORTER' &&
    !['DRAFT', 'REVIEW'].includes(data.status)
  ) {
    return NextResponse.json(
      { error: 'Reporters cannot publish or archive stories' },
      { status: 403 }
    );
  }

  // Update the story's scalar fields first.
  await prisma.story.update({
    where: { id },
    data: {
      title: data.title,
      excerpt: data.excerpt,
      body: data.body,
      contentType: data.contentType,
      origin: data.origin,
      commercialStatus: data.commercialStatus,
      authorName:
        user.role === 'REPORTER'
          ? existingStory.authorName
          : data.authorName,
      authorId:
        user.role === 'REPORTER'
          ? existingStory.authorId
          : data.authorId ?? existingStory.authorId,
      featured:
        user.role === 'REPORTER'
          ? existingStory.featured
          : data.featured,
      coverImage: data.coverImage,
      status: data.status,
      publishedAt:
        data.status === 'PUBLISHED'
          ? existingStory.publishedAt ?? new Date()
          : null,
    },
  });

  // D1-compatible relation updates: no interactive transaction.
  await prisma.storyTag.deleteMany({
    where: { storyId: id },
  });

  for (const tag of data.tags) {
    await prisma.storyTag.create({
      data: {
        storyId: id,
        tag,
      },
    });
  }

  if (data.galleryImages !== undefined) {
    await prisma.storyImage.deleteMany({
      where: { storyId: id },
    });

    for (const [index, image] of data.galleryImages.entries()) {
      await prisma.storyImage.create({
        data: {
          storyId: id,
          url: image.url,
          mediaId: image.mediaId || null,
          altText: image.altText || null,
          caption: image.caption || null,
          photographer: image.photographer || null,
          displayOrder: image.displayOrder ?? index,
        },
      });
    }
  }

  const story = await prisma.story.findUnique({
    where: { id },
    include: {
      tags: true,
      images: {
        orderBy: { displayOrder: 'asc' },
      },
    },
  });

  return NextResponse.json({ data: story });
}

export async function DELETE(
  _request: NextRequest,
  { params }: RouteContext
) {
  const { id } = await params;

  try {
    await requireRole(['SUPER_ADMIN', 'EDITOR']);
  } catch {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    );
  }

  const story = await prisma.story.findUnique({
    where: { id },
  });

  if (!story) {
    return NextResponse.json(
      { error: 'Story not found' },
      { status: 404 }
    );
  }

  await prisma.story.delete({
    where: { id },
  });

  return NextResponse.json({
    message: 'Story deleted successfully',
  });
}
