import { createHmac } from 'node:crypto';
import { getSupabaseAdmin } from '@/lib/server/supabase';

type RateLimitResult = { allowed: boolean; response?: Response };

function clientAddress(request: Request) {
  // Cloudflare supplies this header at the edge. Do not trust arbitrary
  // X-Forwarded-For values from public clients.
  return request.headers.get('cf-connecting-ip')?.trim() || 'unknown';
}

function makeRateKey(request: Request, scope: string, subject?: string) {
  const secret = process.env.AUTH_SECRET;
  if (!secret || secret.length < 32) throw new Error('AUTH_SECRET is unavailable');
  return createHmac('sha256', secret)
    .update(`${scope}|${subject ? `subject:${subject}` : `ip:${clientAddress(request)}`}`)
    .digest('hex');
}

export async function enforceRateLimit(
  request: Request,
  scope: string,
  maxRequests: number,
  windowSeconds: number,
  subject?: string,
): Promise<RateLimitResult> {
  try {
    const rateKey = makeRateKey(request, scope, subject);
    const { data, error } = await (getSupabaseAdmin() as any).rpc('consume_api_rate_limit', {
      p_rate_key: rateKey,
      p_max_requests: maxRequests,
      p_window_seconds: windowSeconds,
    });

    if (error || typeof data !== 'boolean') {
      console.error('[rate limit] Enforcement failed:', error?.message ?? 'Unexpected RPC response');
      return {
        allowed: false,
        response: Response.json(
          { error: 'This service is temporarily unavailable. Please try again shortly.' },
          { status: 503, headers: { 'Cache-Control': 'no-store' } },
        ),
      };
    }

    if (!data) {
      return {
        allowed: false,
        response: Response.json(
          { error: 'Too many requests. Please wait before trying again.' },
          { status: 429, headers: { 'Cache-Control': 'no-store', 'Retry-After': String(windowSeconds) } },
        ),
      };
    }

    return { allowed: true };
  } catch (error) {
    console.error('[rate limit] Enforcement unavailable:', error instanceof Error ? error.message : 'Unknown error');
    return {
      allowed: false,
      response: Response.json(
        { error: 'This service is temporarily unavailable. Please try again shortly.' },
        { status: 503, headers: { 'Cache-Control': 'no-store' } },
      ),
    };
  }
}
