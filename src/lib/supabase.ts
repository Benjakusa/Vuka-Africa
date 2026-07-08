import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env['VITE_SUPABASE_URL'];
const supabaseAnonKey = import.meta.env['VITE_SUPABASE_ANON_KEY'];

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY environment variables. ' +
    'Check your .env file or deployment configuration.'
  );
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    storageKey: 'vuka-auth-token',
  },
});

/**
 * Privileged Supabase client — ONLY for backend workers (Node.js).
 * Never import this in frontend code. The service role key must
 * NEVER be exposed to the browser.
 *
 * Frontend code must use RLS policies with the standard `supabase` client.
 *
 * @deprecated Remove once all RLS policies are applied and verified.
 *             See migrate.sql or supabase-schema.sql for the policy definitions.
 */