
import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';

import { prisma } from '@/lib/server/prisma';
import { createSession } from '@/lib/server/auth';

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

  if (
    typeof body !== 'object' ||
    body === null ||
    !('email' in body) ||
    !('password' in body)
  ) {
    return NextResponse.json(
      { error: 'Email and password are required' },
      { status: 400 }
    );
  }

  const rawEmail = (body as { email: unknown }).email;
  const rawPassword = (body as { password: unknown }).password;

  if (
    typeof rawEmail !== 'string' ||
    typeof rawPassword !== 'string'
  ) {
    return NextResponse.json(
      { error: 'Email and password are required' },
      { status: 400 }
    );
  }

  const email = rawEmail.trim().toLowerCase();
  const password = rawPassword;

  if (
    !email ||
    !password ||
    email.length > 254 ||
    password.length > 1024
  ) {
    return NextResponse.json(
      { error: 'Invalid email or password' },
      { status: 401 }
    );
  }

  const user = await prisma.user.findUnique({
    where: { email },
  });

  if (!user) {
    return NextResponse.json(
      { error: 'Invalid email or password' },
      { status: 401 }
    );
  }

  const passwordMatches = await bcrypt.compare(
    password,
    user.passwordHash
  );

  if (!passwordMatches || !user.isActive) {
    return NextResponse.json(
      { error: 'Invalid email or password' },
      { status: 401 }
    );
  }

  await createSession(user.id, user.role);

  return NextResponse.json({
    message: 'Login successful',
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
    },
  });
}
