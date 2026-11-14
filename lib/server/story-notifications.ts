import { getSupabaseAdmin } from '@/lib/server/supabase';
import { sendEmail } from '@/lib/server/email';
import { getCloudflareContext } from '@opennextjs/cloudflare';

type StorySubmission = { id: string; title: string; excerpt: string; author_name: string };

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (character) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  })[character] ?? character);
}

export async function notifyEditorsOfStorySubmission(story: StorySubmission, requestOrigin: string): Promise<void> {
  try {
    const db = getSupabaseAdmin();
    const { data: editors, error } = await db.from('users')
      .select('email').in('role', ['EDITOR', 'SENIOR_EDITOR']).eq('is_active', true);
    if (error) throw new Error(`Could not load editorial recipients: ${error.message}`);
    const recipients = (editors ?? []).filter(({ email }) => !!email);
    if (!recipients.length) {
      console.warn('[story notification] No active editorial accounts found.');
      return;
    }
    const context = getCloudflareContext();
    const env = context.env as unknown as Record<string, unknown>;
    const configuredSiteUrl = typeof env.NEXT_PUBLIC_SITE_URL === 'string' ? env.NEXT_PUBLIC_SITE_URL : process.env.NEXT_PUBLIC_SITE_URL;
    const siteUrl = (configuredSiteUrl || requestOrigin).replace(/\/$/, '');
    const reviewUrl = `${siteUrl}/admin/stories/${encodeURIComponent(story.id)}`;
    const title = escapeHtml(story.title);
    const reporter = escapeHtml(story.author_name);
    const excerpt = escapeHtml(story.excerpt || 'No summary was provided.');
    const results = await Promise.allSettled(recipients.map(({ email }) => sendEmail({
      to: email,
      subject: `New story submitted for review: ${story.title}`,
      html: `<div style="font-family:Arial,sans-serif;line-height:1.6;color:#171717;max-width:640px"><h2>New story submitted for review</h2><p>A reporter has submitted a story to the Campus Radar newsroom.</p><p><strong>Headline:</strong> ${title}<br><strong>Reporter:</strong> ${reporter}</p><p><strong>Summary</strong><br>${excerpt}</p><p><a href="${reviewUrl}" style="display:inline-block;padding:12px 18px;background:#111;color:#fff;text-decoration:none;border-radius:6px">Review story</a></p><p style="color:#666;font-size:12px">You are receiving this email because you have an active editorial account on Campus Radar.</p></div>`,
      env,
    })));
    const failures = results.filter(result => result.status === 'rejected');
    if (failures.length) console.error(`[story notification] ${failures.length} of ${recipients.length} editorial notification(s) failed.`);
  } catch (error) {
    console.error('[story notification] Could not send editorial notifications:', error instanceof Error ? error.message : error);
  }
}
