
import { NextRequest, NextResponse } from 'next/server';

import { prisma } from '@/lib/server/prisma';
import { requireRole } from '@/lib/server/auth';
import { submissionSchema } from '@/lib/validation/content';

const REVIEW_ROLES = ['SUPER_ADMIN', 'EDITOR'] as const;

export async function GET(request: NextRequest) {
  try {
    await requireRole([...REVIEW_ROLES]);
  } catch {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    );
  }

  const { searchParams } = new URL(request.url);
  const status = searchParams.get('status');
  const limitParam = Number(searchParams.get('limit') ?? 20);

  const limit = Number.isFinite(limitParam)
    ? Math.min(Math.max(Math.floor(limitParam), 1), 50)
    : 20;

  const submissions = await prisma.submission.findMany({
    where: status
      ? { status: status.trim().toUpperCase() }
      : undefined,
    orderBy: { createdAt: 'desc' },
    take: limit,
  });

  return NextResponse.json({ data: submissions });
}

export async function POST(request: NextRequest) {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: 'Invalid JSON body' },
      { status: 400 }
    );
  }

  const parsed = submissionSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      {
        error: 'Invalid submission',
        details: parsed.error.flatten(),
      },
      { status: 400 }
    );
  }

  const data = parsed.data;

  const submission = await prisma.submission.create({
    data: {
      type: data.type,
      name: data.name,
      contact: data.contact,
      title: data.title,
      body: data.body,
      status: 'PENDING',
    },
  });

  return NextResponse.json(
    {
      message: 'Submission received successfully',
      data: { id: submission.id, status: submission.status },
    },
    { status: 201 }
  );
}
