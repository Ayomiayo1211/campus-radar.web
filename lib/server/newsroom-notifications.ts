import { getCloudflareContext } from '@opennextjs/cloudflare';
import { getSupabaseAdmin } from '@/lib/server/supabase';
import { sendGmailMessage } from '@/lib/server/gmail';

type StoryNotice = { id: string; title: string; author_name?: string | null };
type NoticeActor = { id: string; name: string };

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (character) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  })[character] ?? character);
}

function mailContext() {
  const context = getCloudflareContext();
  const env = context.env as unknown as Record<string, unknown>;
  const configured = typeof env.NEXT_PUBLIC_SITE_URL === 'string'
    ? env.NEXT_PUBLIC_SITE_URL : process.env.NEXT_PUBLIC_SITE_URL;
  return { env, siteUrl: (configured || '').replace(/\/$/, '') };
}

async function sendNotice(to: string, subject: string, html: string, env: Record<string, unknown>) {
  if (!to) return;
  await sendGmailMessage({ to, subject, html, env });
}

export async function notifyTaskAssigned(input: {
  story: StoryNotice; recipient: { email: string; name: string }; actor: NoticeActor;
  note?: string | null; requestOrigin: string;
}): Promise<void> {
  try {
    const { env, siteUrl } = mailContext();
    const url = `${siteUrl || input.requestOrigin.replace(/\/$/, '')}/admin/stories/${encodeURIComponent(input.story.id)}`;
    const note = input.note ? escapeHtml(input.note).replace(/\n/g, '<br>') : 'No additional instructions were provided.';
    await sendNotice(
      input.recipient.email,
      `New story task assigned: ${input.story.title}`,
      `<div style="font-family:Arial,sans-serif;line-height:1.6;color:#171717;max-width:640px"><h2>You have a new newsroom task</h2><p>Hello ${escapeHtml(input.recipient.name)},</p><p><strong>${escapeHtml(input.actor.name)}</strong> assigned you to work on <strong>${escapeHtml(input.story.title)}</strong>.</p><p><strong>Instructions</strong><br>${note}</p><p><a href="${url}" style="display:inline-block;padding:12px 18px;background:#173B87;color:#fff;text-decoration:none;border-radius:6px">Open assigned story</a></p><p style="color:#666;font-size:12px">Campus Radar Newsroom</p></div>`,
      env,
    );
  } catch (error) {
    console.error('[newsroom notification] Task assignment email failed:', error);
  }
}

export async function notifySeniorEditorsStoryStarted(input: {
  story: StoryNotice; actor: NoticeActor; requestOrigin: string;
}): Promise<void> {
  try {
    const db = getSupabaseAdmin();
    const { data: recipients, error } = await db.from('users')
      .select('id,email,name').eq('role', 'SENIOR_EDITOR').eq('is_active', true);
    if (error) throw new Error(error.message);
    const targets = (recipients ?? []).filter(person => person.id !== input.actor.id && person.email);
    if (!targets.length) return;

    const { env, siteUrl } = mailContext();
    const url = `${siteUrl || input.requestOrigin.replace(/\/$/, '')}/admin/stories/${encodeURIComponent(input.story.id)}`;
    const html = `<div style="font-family:Arial,sans-serif;line-height:1.6;color:#171717;max-width:640px"><h2>An editor has started working on a story</h2><p><strong>Story:</strong> ${escapeHtml(input.story.title)}</p><p><strong>Started by:</strong> ${escapeHtml(input.actor.name)}</p><p><a href="${url}" style="display:inline-block;padding:12px 18px;background:#173B87;color:#fff;text-decoration:none;border-radius:6px">View newsroom activity</a></p><p style="color:#666;font-size:12px">Campus Radar Newsroom</p></div>`;
    const results = await Promise.allSettled(targets.map(person =>
      sendNotice(person.email, `Story work started: ${input.story.title}`, html, env)
    ));
    const failed = results.filter(result => result.status === 'rejected').length;
    if (failed) console.error(`[newsroom notification] ${failed} start-work email(s) failed.`);
  } catch (error) {
    console.error('[newsroom notification] Start-work email failed:', error);
  }
}
