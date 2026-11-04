import { NextResponse } from 'next/server';
import { requireRole } from '@/lib/server/auth';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const user = await requireRole(['SUPER_ADMIN', 'EDITOR', 'REPORTER']);
    return NextResponse.json({
      authenticated: true,
      user: { id: user.id, name: user.name, email: user.email, role: user.role },
    }, { headers: { 'Cache-Control': 'no-store' } });
  } catch {
    return NextResponse.json(
      { authenticated: false, error: 'Authentication required' },
      { status: 401, headers: { 'Cache-Control': 'no-store' } },
    );
  }
}
