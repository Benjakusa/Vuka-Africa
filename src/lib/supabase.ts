import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.DEV ? 'http://localhost:3000/supabase' : import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const serviceKey = import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// TEMP: Fallback to service role key for dev until RLS policies are applied.
// Remove this and VITE_SUPABASE_SERVICE_ROLE_KEY from .env once you run the
// RLS policies SQL in the Supabase dashboard (see migrate.sql or supabase-schema.sql).
export const supabaseData =
  import.meta.env.DEV && serviceKey
    ? createClient(supabaseUrl, serviceKey, {
        auth: { autoRefreshToken: false, persistSession: false },
      })
    : supabase;
