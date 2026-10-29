
import { NextRequest, NextResponse } from 'next/server';

import { prisma } from '@/lib/server/prisma';
import { slugify } from '@/lib/server/slug';
import { requireRole } from '@/lib/server/auth';
import { opportunitySchema } from '@/lib/validation/content';

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

  const opportunities = await prisma.opportunity.findMany({
    where: admin ? {} : { status: 'PUBLISHED' },
    orderBy: { deadline: 'asc' },
    take: limit,
  });

  return NextResponse.json({ data: opportunities });
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

  const parsed = opportunitySchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      {
        error: 'Invalid opportunity',
        details: parsed.error.flatten(),
      },
      { status: 400 }
    );
  }

  const data = parsed.data;

  const opportunity = await prisma.opportunity.create({
    data: {
      title: data.title,
      organisation: data.organisation,
      type: data.type,
      description: data.description,
      deadline: data.deadline ?? null,
      applicationUrl: data.applicationUrl,
      origin: data.origin,
      commercialStatus: data.commercialStatus,
      status: data.status,
      slug: slugify(data.title),
      publishedAt:
        data.status === 'PUBLISHED'
          ? new Date()
          : undefined,
    },
  });

  return NextResponse.json(
    { data: opportunity },
    { status: 201 }
  );
}
