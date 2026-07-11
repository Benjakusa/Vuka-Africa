import { supabase } from '@/lib/supabase';

// Public-safe column list: excludes financial/internal fields
// (commissionRate, availableBalance, verificationFeePaid, verificationFeeAmount,
// idDocumentUrl, verificationVideoUrl) that should never reach the browser
// on a public listing.
const TRAINER_PUBLIC_COLUMNS =
  'id, userId, bio, skills, isVerified, coverPhoto, averageRating, totalReviews, totalStudents, createdAt, ' +
  'user:User!userId(id, fullName, avatarUrl), ' +
  'courses:Course(id, title, slug, mode, duration, sessionCount, priceKes, imageUrl)';

export async function getTrainers(filters?: Record<string, any>, page = 1, perPage = 12) {
  let query = supabase
    .from('Trainer')
    .select(TRAINER_PUBLIC_COLUMNS, { count: 'exact' })
    .eq('courses.isPublished', true)
    .is('courses.deletedAt', null);

  if (filters?.['verifiedOnly']) query = query.eq('isVerified', true);
  if (filters?.['category']) query = query.contains('skills', [filters['category'] as string]);
  if (filters?.['search']) {
    query = query.or(`user.fullName.ilike.%${filters['search']}%,bio.ilike.%${filters['search']}%`);
  }

  const sortBy = (filters?.['sortBy'] as string) || 'averageRating';
  query = query.order(sortBy, { ascending: false });

  const from = (page - 1) * perPage;
  const to = from + perPage - 1;
  const { data, error, count } = await query.range(from, to);
  if (error) throw error;
  return { data: data || [], total: count || 0, page, perPage };
}

export async function getTrainer(id: string) {
  const { data, error } = await supabase
    .from('Trainer')
    .select(TRAINER_PUBLIC_COLUMNS)
    .eq('id', id)
    .eq('courses.isPublished', true)
    .is('courses.deletedAt', null)
    .maybeSingle();
  if (error) throw error;
  if (!data) return data;
  // Flatten user.fullName onto the trainer object to match what
  // TrainerProfile.tsx / TrainerCard already expect (t.fullName, t.user.avatarUrl).
  const trainer = data as any;
  const user = trainer.user || {};
  return { ...trainer, fullName: user.fullName };
}

// Private column list for a trainer's own profile (includes sensitive financial/internal fields)
const TRAINER_PRIVATE_COLUMNS =
  'id, userId, bio, skills, isVerified, verificationStatus, verificationFeePaid, coverPhoto, ' +
  'averageRating, totalReviews, totalStudents, availableBalance, commissionRate, createdAt, updatedAt, ' +
  'idDocumentUrl, kraPinUrl, passportPhotoUrl, verificationVideoUrl, verificationFeeAmount';

export async function getMyTrainerProfile(userId: string) {
  const { data, error } = await supabase
    .from('Trainer')
    .select(TRAINER_PRIVATE_COLUMNS)
    .eq('userId', userId)
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function applyAsTrainer(data: Record<string, any>) {
  const { data: trainer, error } = await supabase.from('Trainer').insert(data).select().single();
  if (error) throw error;
  return trainer;
}

export async function updateTrainerProfile(id: string, updates: Record<string, any>) {
  const { data, error } = await supabase
    .from('Trainer')
    .update({ ...updates, updatedAt: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

// getTrainerEarnings removed — was dead code with no callers.
// Use getPayoutHistory (payoutService.ts) + getTrainerDashboardStats RPC instead.

export async function getTrainerReviews(trainerId: string, page = 1, perPage = 10) {
  const from = (page - 1) * perPage;
  const to = from + perPage - 1;
  const { data, error, count } = await supabase
    .from('Review')
    .select('*, trainee:User!traineeId(id, fullName, avatarUrl)', { count: 'exact' })
    .eq('trainerId', trainerId)
    .order('createdAt', { ascending: false })
    .range(from, to);
  if (error) throw error;
  return { data: data || [], total: count || 0, page, perPage };
}

export async function getVerificationStatus(trainerId: string) {
  const { data, error } = await supabase
    .from('Trainer')
    .select('verificationStatus, isVerified')
    .eq('id', trainerId)
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function getTrainerDashboardStats(trainerId: string) {
  const { data, error } = await supabase.rpc('get_trainer_dashboard_stats', { p_trainer_id: trainerId });
  if (error) throw error;
  return data?.[0] || { settled_earnings: 0, pending_earnings: 0, active_sessions_count: 0 };
}
