import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({ ok: true, service: 'campus-radar-api', timestamp: new Date().toISOString() });
}
