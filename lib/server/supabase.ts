import { createClient } from '@supabase/supabase-js';

let client: ReturnType<typeof createClient> | undefined;

/** Server-only database client. The secret key bypasses RLS and must never reach browser code. */
export function getSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const secretKey = process.env.SUPABASE_SECRET_KEY;

  if (!url || !secretKey) {
    throw new Error('Supabase server configuration is missing');
  }

  client ??= createClient(url, secretKey, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  });

  return client;
}
