import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';

import { prisma } from '@/lib/server/prisma';
import { requireRole } from '@/lib/server/auth';

const ROLES = ['SUPER_ADMIN', 'EDITOR', 'REPORTER'] as const;

function authError(error: unknown) {
  if (error instanceof Error && error.message === 'Unauthorized') {
    return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
  }

  if (error instanceof Error && error.message === 'Forbidden') {
    return NextResponse.json({ error: 'Super Admin access required' }, { status: 403 });
  }

  return null;
}

export async function GET() {
  try {
    await requireRole(['SUPER_ADMIN']);

    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isActive: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'asc' },
    });

    return NextResponse.json({ users });
  } catch (error) {
    return authError(error) ?? NextResponse.json(
      { error: 'Could not load admin accounts' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    await requireRole(['SUPER_ADMIN']);
  } catch (error) {
    return authError(error) ?? NextResponse.json(
      { error: 'Could not verify permissions' },
      { status: 500 }
    );
  }

  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }

  if (!body || typeof body !== 'object') {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }

  const data = body as Record<string, unknown>;
  const name = typeof data.name === 'string' ? data.name.trim() : '';
  const email = typeof data.email === 'string' ? data.email.trim().toLowerCase() : '';
  const password = typeof data.password === 'string' ? data.password : '';
  const role = typeof data.role === 'string' ? data.role : '';

  if (!name || !email || !password || !ROLES.includes(role as typeof ROLES[number])) {
    return NextResponse.json(
      { error: 'Name, email, password and a valid role are required' },
      { status: 400 }
    );
  }

  if (password.length < 12) {
    return NextResponse.json(
      { error: 'Password must be at least 12 characters long' },
      { status: 400 }
    );
  }

  try {
    const passwordHash = await bcrypt.hash(password, 12);

    const user = await prisma.user.create({
      data: { name, email, passwordHash, role },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isActive: true,
        createdAt: true,
      },
    });

    return NextResponse.json({ user }, { status: 201 });
  } catch (error) {
    if (
      typeof error === 'object' &&
      error !== null &&
      'code' in error &&
      error.code === 'P2002'
    ) {
      return NextResponse.json(
        { error: 'An account with this email already exists' },
        { status: 409 }
      );
    }

    return NextResponse.json({ error: 'Could not create account' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  let actor;

  try {
    actor = await requireRole(['SUPER_ADMIN']);
  } catch (error) {
    return authError(error) ?? NextResponse.json(
      { error: 'Could not verify permissions' },
      { status: 500 }
    );
  }

  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }

  if (!body || typeof body !== 'object') {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }

  const data = body as Record<string, unknown>;
  const id = typeof data.id === 'string' ? data.id : '';
  const role = data.role;
  const isActive = data.isActive;

  if (!id) {
    return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
  }

  if (role !== undefined && (
    typeof role !== 'string' ||
    !ROLES.includes(role as typeof ROLES[number])
  )) {
    return NextResponse.json({ error: 'Invalid role' }, { status: 400 });
  }

  if (isActive !== undefined && typeof isActive !== 'boolean') {
    return NextResponse.json({ error: 'Invalid account status' }, { status: 400 });
  }

  if (role === undefined && isActive === undefined) {
    return NextResponse.json({ error: 'No changes supplied' }, { status: 400 });
  }

  if (
    id === actor.id &&
    (role !== undefined && role !== 'SUPER_ADMIN' || isActive === false)
  ) {
    return NextResponse.json(
      { error: 'You cannot remove your own Super Admin access' },
      { status: 400 }
    );
  }

  try {
    const target = await prisma.user.findUnique({ where: { id } });

    if (!target) {
      return NextResponse.json({ error: 'Account not found' }, { status: 404 });
    }

    const losingSuperAdminAccess =
      target.role === 'SUPER_ADMIN' &&
      target.isActive &&
      ((role !== undefined && role !== 'SUPER_ADMIN') || isActive === false);

    if (losingSuperAdminAccess) {
      const activeSuperAdmins = await prisma.user.count({
        where: { role: 'SUPER_ADMIN', isActive: true },
      });

      if (activeSuperAdmins <= 1) {
        return NextResponse.json(
          { error: 'You cannot remove or deactivate the last active Super Admin' },
          { status: 400 }
        );
      }
    }

    const user = await prisma.user.update({
      where: { id },
      data: {
        ...(role !== undefined ? { role: role as string } : {}),
        ...(isActive !== undefined ? { isActive } : {}),
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isActive: true,
        createdAt: true,
      },
    });

    return NextResponse.json({ user });
  } catch {
    return NextResponse.json({ error: 'Could not update account' }, { status: 500 });
  }
}