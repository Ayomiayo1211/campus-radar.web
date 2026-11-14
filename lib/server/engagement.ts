import { createHash, randomBytes } from 'node:crypto';
import { getCloudflareContext } from '@opennextjs/cloudflare';
import { sendEmail } from '@/lib/server/email';

export function hashValue(value: string) {
  return createHash('sha256').update(value).digest('hex');
}
export function makeToken() { return randomBytes(32).toString('hex'); }
export function siteOrigin(fallback: string) {
  const env = getCloudflareContext().env as unknown as Record<string, unknown>;
  const configured = typeof env.NEXT_PUBLIC_SITE_URL === 'string' ? env.NEXT_PUBLIC_SITE_URL : process.env.NEXT_PUBLIC_SITE_URL;
  return (configured || fallback).replace(/\/$/, '');
}
export async function sendNewsletterConfirmation(email: string, token: string, origin: string) {
  const env = getCloudflareContext().env as unknown as Record<string, unknown>;
  const url = `${siteOrigin(origin)}/api/newsletter/confirm?token=${encodeURIComponent(token)}`;
  await sendEmail({to:email,subject:'Confirm your Campus Radar subscription',html:`<div style="font-family:Arial,sans-serif;line-height:1.6"><h2>Confirm your Campus Radar subscription</h2><p>Confirm your email to receive new stories, features and opportunities from Campus Radar.</p><p><a href="${url}">Confirm my subscription</a></p><p>If you did not request this, ignore this email.</p></div>`,env});
}
export async function sendPublishedStoryNewsletter(story: {id:string;title:string;excerpt:string;slug:string}, origin: string) {
  const {getSupabaseAdmin}=await import('@/lib/server/supabase');
  const db=getSupabaseAdmin() as any;
  const {data:subscribers,error}=await db.from('newsletter_subscribers').select('id,email,unsubscribe_token_hash').eq('status','ACTIVE').limit(5000);
  if(error) throw error;
  if(!subscribers?.length) return;
  const base=siteOrigin(origin);
  const articleUrl=`${base}/news/${encodeURIComponent(story.slug)}`;
  const env=getCloudflareContext().env as unknown as Record<string,unknown>;
  for(const subscriber of subscribers) {
    const {data:delivery}=await db.from('newsletter_deliveries').upsert({story_id:story.id,subscriber_id:subscriber.id,status:'PENDING',attempted_at:new Date().toISOString()},{onConflict:'story_id,subscriber_id',ignoreDuplicates:true}).select('id').maybeSingle();
    if(!delivery) continue;
    const unsubUrl=`${base}/api/newsletter/unsubscribe?token=${encodeURIComponent(subscriber.unsubscribe_token_hash)}`;
    try {
      const result=await sendEmail({to:subscriber.email,subject:`New on Campus Radar: ${story.title}`,html:`<div style="font-family:Arial,sans-serif;line-height:1.6;max-width:640px"><p>Campus Radar</p><h1>${story.title.replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]||c))}</h1><p>${(story.excerpt||'A new story is now available on Campus Radar.').replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]||c))}</p><p><a href="${articleUrl}">Read the story</a></p><hr><p style="font-size:12px;color:#666">You are receiving this because you subscribed to Campus Radar. <a href="${unsubUrl}">Unsubscribe</a></p></div>`,env});
      await db.from('newsletter_deliveries').update({status:'SENT',provider_message_id:result.id??null,sent_at:new Date().toISOString(),error_message:null}).eq('id',delivery.id);
    } catch(error) {
      await db.from('newsletter_deliveries').update({status:'FAILED',error_message:error instanceof Error?error.message:'Email delivery failed'}).eq('id',delivery.id);
      console.error('[newsletter] Delivery failed:',subscriber.id,error);
    }
  }
}
