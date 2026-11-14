'use server';

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getSupabaseAdmin } from '@/lib/server/supabase';

export const runtime = 'nodejs';

const TEAMS = ['EDITORIAL', 'CREATIVE', 'PHOTOGRAPHY', 'PODCAST', 'EVENTS', 'PARTNERSHIPS'] as const;
const applicationSchema = z.object({
  fullName: z.string().trim().min(2).max(120),
  matricNumber: z.string().trim().min(2).max(60),
  level: z.enum(['100', '200', '300', '400', '500', 'Postgraduate', 'Other']),
  department: z.string().trim().min(2).max(120),
  phone: z.string().trim().min(7).max(40),
  whatsapp: z.string().trim().max(40).optional().default(''),
  email: z.string().trim().email().max(254),
  teams: z.array(z.enum(TEAMS)).min(1).max(6),
  whyTeam: z.string().trim().max(2000).optional().default(''),
  skills: z.string().trim().max(3000).optional().default(''),
  portfolio: z.string().trim().max(500).optional().default(''),
  priorRole: z.enum(['Yes', 'No']).optional(),
  heardFrom: z.string().trim().max(80).optional().default(''),
  hours: z.enum(['1–3 hrs', '4–6 hrs', '7–10 hrs', '10+ hrs']),
  acknowledged: z.literal(true),
  website: z.string().max(0).optional().default(''),
});

export async function POST(request: NextRequest) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid application data.' }, { status: 400 });
  }

  const parsed = applicationSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Please check the required fields and try again.', details: parsed.error.flatten() }, { status: 400 });
  }

  const value = parsed.data;
  const email = value.email.toLowerCase();
  const db = getSupabaseAdmin();
  const recentCutoff = new Date(Date.now() - 15 * 60 * 1000).toISOString();

  const { data: recent, error: duplicateError } = await db
    .from('member_applications')
    .select('id')
    .eq('email', email)
    .gte('created_at', recentCutoff)
    .limit(1);

  if (duplicateError) {
    console.error('[member application] Duplicate check failed:', duplicateError.message);
    return NextResponse.json({ error: 'We could not process your application right now. Please try again shortly.' }, { status: 500 });
  }
  if (recent?.length) {
    return NextResponse.json({ error: 'An application using this email was submitted recently. Please wait before trying again.' }, { status: 429 });
  }

  const { error } = await db.from('member_applications').insert({
    full_name: value.fullName,
    matric_number: value.matricNumber,
    level: value.level,
    department: value.department,
    phone: value.phone,
    whatsapp: value.whatsapp || null,
    email,
    teams: [...new Set(value.teams)],
    why_team: value.whyTeam || null,
    skills: value.skills || null,
    portfolio: value.portfolio || null,
    prior_role: value.priorRole || null,
    heard_from: value.heardFrom || null,
    hours_per_week: value.hours,
    terms_acknowledged: value.acknowledged,
  });

  if (error) {
    console.error('[member application] Insert failed:', error.message);
    return NextResponse.json({ error: 'Your application could not be saved. Please try again.' }, { status: 500 });
  }

  return NextResponse.json({ message: 'Application received.' }, { status: 201 });
}
