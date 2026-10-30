import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/server/prisma';

async function tokenMatches(provided: string, expected: string): Promise<boolean> {
  const encoder = new TextEncoder();
  const [left, right] = await Promise.all([
    crypto.subtle.digest('SHA-256', encoder.encode(provided)),
    crypto.subtle.digest('SHA-256', encoder.encode(expected)),
  ]);
  const a = new Uint8Array(left);
  const b = new Uint8Array(right);
  let difference = 0;
  for (let index = 0; index < a.length; index += 1) difference |= a[index] ^ b[index];
  return difference === 0;
}

/**
 * One-time first-admin provisioning.
 * Set ADMIN_BOOTSTRAP_TOKEN as a Worker secret, create the first Super Admin,
 * then immediately remove that secret from the Worker.
 */
export async function POST(request: NextRequest) {
  const expectedToken = process.env.ADMIN_BOOTSTRAP_TOKEN;
  if (!expectedToken || expectedToken.length < 32) {
    return NextResponse.json({ error: 'Admin bootstrap is not enabled' }, { status: 404 });
  }

  const providedToken = request.headers.get('x-admin-bootstrap-token') || '';
  if (!providedToken || !(await tokenMatches(providedToken, expectedToken))) {
    return NextResponse.json({ error: 'Invalid bootstrap authorization' }, { status: 401 });
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

  if (!name || name.length > 120 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254 || password.length < 12 || password.length > 1024) {
    return NextResponse.json({ error: 'Provide a valid name, email and password of at least 12 characters' }, { status: 400 });
  }

  try {
    const existingAdmins = await prisma.user.count({
      where: { role: 'SUPER_ADMIN', isActive: true },
    });
    if (existingAdmins > 0) {
      return NextResponse.json({ error: 'An active Super Admin already exists; bootstrap is closed' }, { status: 409 });
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const user = await prisma.user.create({
      data: { name, email, passwordHash, role: 'SUPER_ADMIN', isActive: true },
      select: { id: true, name: true, email: true, role: true, isActive: true },
    });

    return NextResponse.json({
      message: 'First Super Admin created. Remove ADMIN_BOOTSTRAP_TOKEN from Worker secrets now.',
      user,
    }, { status: 201 });
  } catch (error) {
    console.error('Admin bootstrap failed', error);
    return NextResponse.json({ error: 'Could not provision the first Super Admin' }, { status: 500 });
  }
}
