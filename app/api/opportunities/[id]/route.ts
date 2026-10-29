
import { NextRequest, NextResponse } from 'next/server';

import { prisma } from '@/lib/server/prisma';
import { requireRole } from '@/lib/server/auth';
import { opportunitySchema } from '@/lib/validation/content';

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

export async function GET(
  _request: NextRequest,
  { params }: RouteContext
) {
  const { id } = await params;

  const opportunity = await prisma.opportunity.findUnique({
    where: {
      id,
    },
  });

  if (!opportunity) {
    return NextResponse.json(
      { error: 'Opportunity not found' },
      { status: 404 }
    );
  }

  return NextResponse.json({
    data: opportunity,
  });
}

export async function PATCH(
  request: NextRequest,
  { params }: RouteContext
) {
  const { id } = await params;

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

  const existingOpportunity =
    await prisma.opportunity.findUnique({
      where: {
        id,
      },
    });

  if (!existingOpportunity) {
    return NextResponse.json(
      { error: 'Opportunity not found' },
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

  const opportunity = await prisma.opportunity.update({
    where: {
      id,
    },
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
      publishedAt:
        data.status === 'PUBLISHED'
          ? existingOpportunity.publishedAt ?? new Date()
          : null,
    },
  });

  return NextResponse.json({
    data: opportunity,
  });
}

export async function DELETE(
  _request: NextRequest,
  { params }: RouteContext
) {
  const { id } = await params;

  try {
    await requireRole([
      'SUPER_ADMIN',
      'EDITOR',
    ]);
  } catch {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    );
  }

  const opportunity = await prisma.opportunity.findUnique({
    where: {
      id,
    },
  });

  if (!opportunity) {
    return NextResponse.json(
      { error: 'Opportunity not found' },
      { status: 404 }
    );
  }

  await prisma.opportunity.delete({
    where: {
      id,
    },
  });

  return NextResponse.json({
    message: 'Opportunity deleted successfully',
  });
}
