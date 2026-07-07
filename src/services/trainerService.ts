import { supabaseData as supabase } from '@/lib/supabase';

export async function getTrainers(filters?: Record<string, any>) {
  let query = supabase.from('Trainer').select('*, user:User!userId(id, fullName, email, avatarUrl), courses:Course(*)');

  if (filters?.verifiedOnly) query = query.eq('isVerified', true);
  if (filters?.category) query = query.contains('skills', [filters.category]);
  if (filters?.search) {
    query = query.or(`user.fullName.ilike.%${filters.search}%,bio.ilike.%${filters.search}%`);
  }

  const sortBy = filters?.sortBy || 'averageRating';
  query = query.order(sortBy, { ascending: false });

  const { data, error } = await query;
  if (error) throw error;
  return data || [];
}

export async function getTrainer(id: string) {
  const { data, error } = await supabase
    .from('Trainer')
    .select('*, user:User!userId(id, fullName, email, avatarUrl), courses:Course(*)')
    .eq('id', id)
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function getMyTrainerProfile(userId: string) {
  const { data, error } = await supabase.from('Trainer').select('*').eq('userId', userId).maybeSingle();
  if (error) throw error;
  return data;
}

export async function applyAsTrainer(data: Record<string, any>) {
  const { data: trainer, error } = await supabase.from('Trainer').insert(data).select().single();
  if (error) throw error;
  return trainer;
}

export async function updateTrainerProfile(id: string, updates: Record<string, any>) {
  const { data, error } = await supabase.from('Trainer').update(updates).eq('id', id).select().single();
  if (error) throw error;
  return data;
}

export async function getTrainerEarnings(trainerId: string) {
  const { data, error } = await supabase
    .from('Payout')
    .select('*')
    .eq('trainerId', trainerId)
    .order('createdAt', { ascending: false });
  if (error) throw error;
  return data || [];
}

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
