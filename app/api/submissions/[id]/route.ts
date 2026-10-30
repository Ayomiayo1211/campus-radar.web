import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/server/prisma';
import { requireRole } from '@/lib/server/auth';

const REVIEW_ROLES = ['SUPER_ADMIN', 'EDITOR'] as const;
const ALLOWED_STATUSES = ['REVIEWING', 'ACCEPTED', 'REJECTED'] as const;

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  let reviewer: Awaited<ReturnType<typeof requireRole>>;

  try {
    reviewer = await requireRole([...REVIEW_ROLES]);
  } catch (error) {
    const forbidden = error instanceof Error && error.message === 'Forbidden';
    return NextResponse.json(
      { error: forbidden ? 'Editor access required' : 'Authentication required' },
      { status: forbidden ? 403 : 401 }
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }

  if (!body || typeof body !== 'object' || !('status' in body)) {
    return NextResponse.json({ error: 'A submission status is required' }, { status: 400 });
  }

  const status = (body as { status: unknown }).status;
  if (typeof status !== 'string' || !ALLOWED_STATUSES.includes(status as typeof ALLOWED_STATUSES[number])) {
    return NextResponse.json({ error: 'Invalid submission status' }, { status: 400 });
  }

  const { id } = await context.params;
  if (!id) return NextResponse.json({ error: 'Submission ID is required' }, { status: 400 });

  try {
    const existing = await prisma.submission.findUnique({ where: { id } });
    if (!existing) return NextResponse.json({ error: 'Submission not found' }, { status: 404 });

    const allowedTransition =
      (existing.status === 'PENDING' && status === 'REVIEWING') ||
      (existing.status === 'REVIEWING' && (status === 'ACCEPTED' || status === 'REJECTED'));

    if (!allowedTransition) {
      return NextResponse.json({ error: 'This status transition is not allowed' }, { status: 409 });
    }

    const submission = await prisma.submission.update({
      where: { id },
      data: {
        status,
        reviewedBy: reviewer.id,
        reviewedAt: new Date(),
      },
    });

    return NextResponse.json({ data: submission });
  } catch (error) {
    console.error('Submission status update failed', error);
    return NextResponse.json({ error: 'Could not update submission' }, { status: 500 });
  }
}
