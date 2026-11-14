import { NextRequest, NextResponse } from 'next/server';
import { randomBytes, createHash } from 'node:crypto';
import { getSupabaseAdmin } from '@/lib/server/supabase';
import { requireRole } from '@/lib/server/auth';
import { sendEmail } from '@/lib/server/email';
import { getCloudflareContext } from '@opennextjs/cloudflare';

const INVITABLE_ROLES = ['EDITOR', 'REPORTER'] as const;
const ASSIGNABLE_ROLES = ['EDITOR', 'REPORTER', 'SENIOR_EDITOR'] as const;
const TEAMS = ['EDITORIAL', 'CREATIVE', 'PHOTOGRAPHY', 'PODCAST', 'EVENTS', 'PARTNERSHIPS'] as const;
type Team = typeof TEAMS[number];

const authError = (e: unknown) => e instanceof Error && e.message === 'Forbidden'
  ? NextResponse.json({ error: 'Master Admin access required' }, { status: 403 })
  : NextResponse.json({ error: 'Authentication required' }, { status: 401 });

const safe = (u: any, teams: Team[] = []) => ({
  id: u.id,
  name: u.name,
  email: u.email,
  role: u.role,
  isActive: u.is_active,
  createdAt: u.created_at,
  teams,
});

export async function GET() {
  try { await requireRole(['SUPER_ADMIN']); } catch (e) { return authError(e); }

  const db = getSupabaseAdmin();
  const [{ data: users, error }, { data: invitations, error: inviteError }, { data: memberships, error: teamError }] = await Promise.all([
    db.from('users').select('id,name,email,role,is_active,created_at').order('created_at', { ascending: true }),
    (db as any).from('admin_invitations').select('id,email,role,expires_at,created_at')
      .is('accepted_at', null).is('revoked_at', null).gt('expires_at', new Date().toISOString()).order('created_at', { ascending: false }),
    (db as any).from('user_teams').select('user_id,team'),
  ]);

  if (error || inviteError || teamError) {
    return NextResponse.json({ error: 'Could not load account management data' }, { status: 500 });
  }

  const teamMap = new Map<string, Team[]>();
  for (const membership of memberships ?? []) {
    const current = teamMap.get(membership.user_id) ?? [];
    current.push(membership.team as Team);
    teamMap.set(membership.user_id, current);
  }

  return NextResponse.json({
    users: (users ?? []).map(user => safe(user, teamMap.get(user.id) ?? [])),
    invitations: invitations ?? [],
  });
}

export async function POST(request: NextRequest) {
  let actor;
  try { actor = await requireRole(['SUPER_ADMIN']); } catch (e) { return authError(e); }

  let body: any;
  try { body = await request.json(); } catch { return NextResponse.json({ error: 'Invalid request body' }, { status: 400 }); }

  const email = typeof body?.email === 'string' ? body.email.trim().toLowerCase() : '';
  const role = body?.role;
  if (!/^\S+@\S+\.\S+$/.test(email) || email.length > 254 || !INVITABLE_ROLES.includes(role)) {
    return NextResponse.json({ error: 'Provide a valid email address and role' }, { status: 400 });
  }

  const db = getSupabaseAdmin();
  const { data: existing, error: lookupError } = await db.from('users').select('id').eq('email', email).maybeSingle();
  if (lookupError) return NextResponse.json({ error: 'Could not verify email address' }, { status: 500 });
  if (existing) return NextResponse.json({ error: 'An account with this email already exists' }, { status: 409 });

  const token = randomBytes(32).toString('base64url');
  const tokenHash = createHash('sha256').update(token).digest('hex');
  const expiresAt = new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString();

  const { error: revokeError } = await (db as any).from('admin_invitations').update({ revoked_at: new Date().toISOString() })
    .eq('email', email).is('accepted_at', null).is('revoked_at', null);
  if (revokeError) return NextResponse.json({ error: 'Could not replace previous invitation' }, { status: 500 });

  const { data: invite, error: insertError } = await (db as any).from('admin_invitations')
    .insert({ email, role, token_hash: tokenHash, invited_by: actor.id, expires_at: expiresAt }).select('id').single();
  if (insertError || !invite) return NextResponse.json({ error: 'Could not create invitation' }, { status: 500 });

  const env = getCloudflareContext().env as unknown as Record<string, unknown>;
  const configuredSiteUrl = typeof env.NEXT_PUBLIC_SITE_URL === 'string' ? env.NEXT_PUBLIC_SITE_URL : process.env.NEXT_PUBLIC_SITE_URL;
  const siteUrl = (configuredSiteUrl || request.nextUrl.origin).replace(/\/$/, '');
  const link = `${siteUrl}/admin/accept-invitation?token=${encodeURIComponent(token)}`;

  try {
    await sendEmail({
      to: email,
      subject: 'Your Campus Radar newsroom invitation',
      html: `<div style="font-family:Arial,sans-serif;line-height:1.6;color:#171717"><h2>Campus Radar newsroom invitation</h2><p>You have been invited as a <strong>${role === 'EDITOR' ? 'Editor' : 'Reporter'}</strong>.</p><p>Use this secure link to create your account password. It expires in 48 hours and can only be used once.</p><p><a href="${link}" style="display:inline-block;padding:12px 18px;background:#111;color:#fff;text-decoration:none;border-radius:6px">Create your account</a></p><p>If you were not expecting this invitation, ignore this email.</p></div>`,
      env,
    });
  } catch (error) {
    const diagnostic = error instanceof Error ? error.message : 'Unknown error';
    console.error('[admin invitation] Resend delivery failed:', diagnostic);
    await (db as any).from('admin_invitations').update({ revoked_at: new Date().toISOString() }).eq('id', invite.id);
    return NextResponse.json({ error: 'Invitation email could not be sent.', diagnostic: { stage: 'resend_delivery', message: diagnostic } }, { status: 502 });
  }

  return NextResponse.json({ message: `Invitation sent to ${email}` }, { status: 201 });
}

export async function PATCH(request: NextRequest) {
  let actor;
  try { actor = await requireRole(['SUPER_ADMIN']); } catch (e) { return authError(e); }

  let body: any;
  try { body = await request.json(); } catch { return NextResponse.json({ error: 'Invalid request body' }, { status: 400 }); }

  const id = typeof body?.id === 'string' ? body.id : '';
  const role = body?.role;
  const isActive = body?.isActive;
  const hasTeams = Object.prototype.hasOwnProperty.call(body ?? {}, 'teams');
  const teams = body?.teams;

  if (!id) return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
  if (role !== undefined && !ASSIGNABLE_ROLES.includes(role)) {
    return NextResponse.json({ error: 'Choose Reporter, Editor, or Senior Editor' }, { status: 400 });
  }
  if (isActive !== undefined && typeof isActive !== 'boolean') {
    return NextResponse.json({ error: 'Invalid account status' }, { status: 400 });
  }
  if (hasTeams && (!Array.isArray(teams) || teams.length > TEAMS.length || teams.some((team: unknown) => typeof team !== 'string' || !TEAMS.includes(team as Team)))) {
    return NextResponse.json({ error: 'Choose valid Campus Radar teams' }, { status: 400 });
  }
  if (role === undefined && isActive === undefined && !hasTeams) {
    return NextResponse.json({ error: 'No changes supplied' }, { status: 400 });
  }
  if (id === actor.id) return NextResponse.json({ error: 'The Master Admin account cannot be changed here' }, { status: 400 });

  const db = getSupabaseAdmin();
  const { data: target, error: lookup } = await db.from('users').select('id,role').eq('id', id).maybeSingle();
  if (lookup) return NextResponse.json({ error: 'Could not load account' }, { status: 500 });
  if (!target) return NextResponse.json({ error: 'Account not found' }, { status: 404 });
  if (target.role === 'SUPER_ADMIN') return NextResponse.json({ error: 'Master Admin privileges cannot be changed here' }, { status: 403 });

  if (hasTeams) {
    const { error: membershipError } = await (db as any).rpc('set_user_teams', {
      p_user_id: id,
      p_teams: teams,
      p_assigned_by: actor.id,
    });
    if (membershipError) {
      console.error('[user management] Team assignment failed:', membershipError.message);
      return NextResponse.json({ error: 'Could not update team assignments' }, { status: 500 });
    }
  }

  if (role !== undefined || isActive !== undefined) {
    const changes: any = { updated_at: new Date().toISOString() };
    if (role !== undefined) changes.role = role;
    if (isActive !== undefined) changes.is_active = isActive;
    const { error: updateError } = await db.from('users').update(changes).eq('id', id);
    if (updateError) return NextResponse.json({ error: 'Could not update account' }, { status: 500 });
  }

  const [{ data: user, error: userError }, { data: memberships, error: membershipError }] = await Promise.all([
    db.from('users').select('id,name,email,role,is_active,created_at').eq('id', id).single(),
    (db as any).from('user_teams').select('team').eq('user_id', id),
  ]);
  if (userError || membershipError || !user) return NextResponse.json({ error: 'Account updated, but could not reload its details' }, { status: 500 });

  return NextResponse.json({ user: safe(user, (memberships ?? []).map((item: any) => item.team as Team)) });
}
