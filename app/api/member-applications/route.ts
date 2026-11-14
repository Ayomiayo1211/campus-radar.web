import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getSupabaseAdmin } from '@/lib/server/supabase';
import { sendEmail } from '@/lib/server/email';
import { getCloudflareContext } from '@opennextjs/cloudflare';

export const runtime = 'nodejs';

const TEAMS = ['EDITORIAL', 'CREATIVE', 'PHOTOGRAPHY', 'PODCAST', 'EVENTS', 'PARTNERSHIPS'] as const;
const TEAM_LABELS: Record<string, string> = {
  EDITORIAL: 'Editorial',
  CREATIVE: 'Creative',
  PHOTOGRAPHY: 'Photography',
  PODCAST: 'Podcast',
  EVENTS: 'Events',
  PARTNERSHIPS: 'Partnerships',
};

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
  priorRole: z.enum(['Yes', 'No']).or(z.literal('')).optional(),
  heardFrom: z.string().trim().max(80).optional().default(''),
  hours: z.enum(['1–3 hrs', '4–6 hrs', '7–10 hrs', '10+ hrs']),
  acknowledged: z.literal(true),
  website: z.string().max(0).optional().default(''),
});

function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, character => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  })[character] ?? character);
}

async function notifyTrackEditors(value: z.infer<typeof applicationSchema>) {
  try {
    const db = getSupabaseAdmin() as any;
    type Team = (typeof TEAMS)[number];
    const selectedTeams: Team[] = [...new Set(value.teams)];
    const { data: memberships, error: membershipError } = await db
      .from('user_teams')
      .select('user_id,team')
      .in('team', selectedTeams);

    if (membershipError) throw membershipError;

    const userIds = [...new Set((memberships ?? []).map((item: { user_id: string }) => item.user_id))];
    if (!userIds.length) {
      console.warn('[member application] No assigned track editors found for:', selectedTeams.join(', '));
      return;
    }

    const { data: users, error: usersError } = await db
      .from('users')
      .select('id,name,email,role,is_active')
      .in('id', userIds)
      .in('role', ['EDITOR', 'SENIOR_EDITOR'])
      .eq('is_active', true);

    if (usersError) throw usersError;

    const recipients = (users ?? []).filter((user: { email?: string | null }) => Boolean(user.email));
    if (!recipients.length) {
      console.warn('[member application] No active Editors or Senior Editors assigned to:', selectedTeams.join(', '));
      return;
    }

    const teamsByUser = new Map<string, Team[]>();
    for (const membership of memberships ?? []) {
      const current = teamsByUser.get(membership.user_id) ?? [];
      current.push(membership.team as Team);
      teamsByUser.set(membership.user_id, current);
    }

    const env = getCloudflareContext().env as unknown as Record<string, unknown>;
    const siteUrl = 'https://www.campusradarfunaab.com.ng';
    const applicationUrl = siteUrl + '/admin/applications';
    const safe = (input: string) => escapeHtml(input || 'Not provided');

    const deliveries = await Promise.allSettled(recipients.map((recipient: {
      id: string; name?: string | null; email: string;
    }) => {
      const relevantTeams = (teamsByUser.get(recipient.id) ?? []).filter(team => selectedTeams.includes(team));
      const trackNames = relevantTeams.map(team => TEAM_LABELS[team] ?? team).join(', ');
      const subject = `New Campus Radar application (${trackNames})`;
      const html = `
        <div style="margin:0;padding:32px 16px;background:#f7f9fc;font-family:Arial,sans-serif;color:#101828">
          <div style="max-width:600px;margin:0 auto;overflow:hidden;border:1px solid #dce4f0;border-radius:14px;background:#ffffff">
            <div style="height:6px;background:linear-gradient(90deg,#173b87 0%,#2457c5 72%,#e63946 100%)"></div>
            <div style="padding:28px">
              <p style="margin:0 0 8px;color:#173b87;font-size:11px;font-weight:bold;letter-spacing:1.5px;text-transform:uppercase">Campus Radar · Recruitment</p>
              <h1 style="margin:0 0 12px;color:#173b87;font-size:23px">A new application has arrived</h1>
              <p style="margin:0 0 22px;color:#667085;font-size:14px;line-height:1.6">Hello ${safe(recipient.name ?? 'Editor')}, a student has applied to join the track(s) assigned to you.</p>
              <div style="margin:0 0 20px;padding:16px;border:1px solid #dce4f0;border-radius:10px;background:#f8faff">
                <p style="margin:0 0 6px;color:#667085;font-size:11px;font-weight:bold;text-transform:uppercase">Applicant</p>
                <p style="margin:0;color:#101828;font-size:18px;font-weight:bold">${safe(value.fullName)}</p>
                <p style="margin:5px 0 0;color:#667085;font-size:13px">${safe(value.department)} · ${safe(value.level)} level</p>
                <p style="margin:12px 0 5px;color:#667085;font-size:11px;font-weight:bold;text-transform:uppercase">Your track(s)</p>
                <p style="margin:0;color:#173b87;font-size:14px;font-weight:bold">${escapeHtml(trackNames)}</p>
              </div>
              <table role="presentation" style="width:100%;border-collapse:collapse;font-size:13px">
                <tr><td style="padding:7px 0;color:#667085">Email</td><td style="padding:7px 0;text-align:right;color:#101828">${safe(value.email)}</td></tr>
                <tr><td style="padding:7px 0;color:#667085">Phone</td><td style="padding:7px 0;text-align:right;color:#101828">${safe(value.phone)}</td></tr>
                <tr><td style="padding:7px 0;color:#667085">Availability</td><td style="padding:7px 0;text-align:right;color:#101828">${escapeHtml(value.hours)} weekly</td></tr>
              </table>
              <p style="margin:22px 0 0"><a href="${applicationUrl}" style="display:inline-block;padding:12px 18px;border-radius:7px;background:#173b87;color:#ffffff;font-size:13px;font-weight:bold;text-decoration:none">Review application</a></p>
              <p style="margin:22px 0 0;color:#98a2b3;font-size:11px;line-height:1.5">This notification was sent because you are an active Editor or Senior Editor assigned to one of the applicant's selected Campus Radar tracks.</p>
            </div>
          </div>
        </div>`;

      return sendEmail({ to: recipient.email, subject, html, env });
    }));

    const failed = deliveries.filter(result => result.status === 'rejected');
    if (failed.length) {
      console.error('[member application] Some track notification emails failed:', failed.length, 'of', deliveries.length);
    } else {
      console.info('[member application] Track notification emails sent:', deliveries.length);
    }
  } catch (error) {
    console.error('[member application] Track notification routing failed:', error instanceof Error ? error.message : error);
  }
}

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
  const db = getSupabaseAdmin() as any;
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

  await notifyTrackEditors({ ...value, email });
  return NextResponse.json({ message: 'Application received.' }, { status: 201 });
}
