import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

export const db = {
  user: () => supabaseAdmin.from('User'),
  trainer: () => supabaseAdmin.from('Trainer'),
  course: () => supabaseAdmin.from('Course'),
  enrolment: () => supabaseAdmin.from('Enrolment'),
  milestone: () => supabaseAdmin.from('Milestone'),
  transactionLedger: () => supabaseAdmin.from('TransactionLedger'),
  payout: () => supabaseAdmin.from('Payout'),
  review: () => supabaseAdmin.from('Review'),
  dispute: () => supabaseAdmin.from('Dispute'),
  sessionLog: () => supabaseAdmin.from('SessionLog'),
  notification: () => supabaseAdmin.from('Notification'),
  platformConfig: () => supabaseAdmin.from('PlatformConfig'),
};
