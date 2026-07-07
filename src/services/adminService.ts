import { supabaseData as supabase } from '@/lib/supabase';

export async function getAdminStats() {
  const [users, trainers, courses, enrolments, disputes] = await Promise.all([
    supabase.from('User').select('*', { count: 'exact', head: true }),
    supabase.from('Trainer').select('*', { count: 'exact', head: true }),
    supabase.from('Course').select('*', { count: 'exact', head: true }),
    supabase.from('Enrolment').select('*', { count: 'exact', head: true }),
    supabase.from('Dispute').select('*', { count: 'exact', head: true }).eq('status', 'OPEN'),
  ]);

  return {
    totalUsers: users.count || 0,
    totalTrainers: trainers.count || 0,
    totalCourses: courses.count || 0,
    totalEnrolments: enrolments.count || 0,
    openDisputes: disputes.count || 0,
  };
}

export async function getUsers(search?: string, page = 1, perPage = 20) {
  let query = supabase
    .from('User')
    .select('*, trainer:Trainer(id, isVerified, verificationStatus)', { count: 'exact' });
  if (search) query = query.or(`fullName.ilike.%${search}%,email.ilike.%${search}%`);
  const from = (page - 1) * perPage;
  const to = from + perPage - 1;
  const { data, error, count } = await query.range(from, to).order('createdAt', { ascending: false });
  if (error) throw error;
  return { data: data || [], total: count || 0, page, perPage };
}

export async function activateUser(userId: string) {
  const { error } = await supabase.from('User').update({ isActive: true }).eq('id', userId);
  if (error) throw error;
}

export async function suspendUser(userId: string) {
  const { error } = await supabase.from('User').update({ isActive: false }).eq('id', userId);
  if (error) throw error;
}

export async function getDisputes(status?: string, page = 1, perPage = 20) {
  let query = supabase
    .from('Dispute')
    .select(
      '*, enrolment:Enrolment(id, trainee:User!traineeId(fullName), trainer:User!trainerId(fullName), course:Course(title))',
      { count: 'exact' },
    );
  if (status) query = query.eq('status', status);
  const from = (page - 1) * perPage;
  const to = from + perPage - 1;
  const { data, error, count } = await query.range(from, to).order('createdAt', { ascending: false });
  if (error) throw error;
  return { data: data || [], total: count || 0, page, perPage };
}

export async function resolveDispute(disputeId: string, resolution: string, adminId: string) {
  const { error } = await supabase
    .from('Dispute')
    .update({
      status: 'RESOLVED',
      resolvedBy: adminId,
      resolvedAt: new Date().toISOString(),
      resolution,
    })
    .eq('id', disputeId);
  if (error) throw error;
}

export async function getVerifications(status?: string, page = 1, perPage = 20) {
  let query = supabase.from('Trainer').select('*, user:User!userId(id, fullName, email, phone)', { count: 'exact' });
  if (status) query = query.eq('verificationStatus', status);
  else query = query.neq('verificationStatus', 'NONE');
  const from = (page - 1) * perPage;
  const to = from + perPage - 1;
  const { data, error, count } = await query.range(from, to).order('updatedAt', { ascending: false });
  if (error) throw error;
  return { data: data || [], total: count || 0, page, perPage };
}

export async function approveVerification(trainerId: string) {
  const { error } = await supabase
    .from('Trainer')
    .update({
      isVerified: true,
      verificationStatus: 'APPROVED',
      commissionRate: 12,
    })
    .eq('id', trainerId);
  if (error) throw error;
}

export async function rejectVerification(trainerId: string) {
  const { error } = await supabase
    .from('Trainer')
    .update({
      isVerified: false,
      verificationStatus: 'REJECTED',
    })
    .eq('id', trainerId);
  if (error) throw error;
}

export async function getTransactions(filters?: Record<string, any>, page = 1, perPage = 20) {
  let query = supabase.from('TransactionLedger').select('*', { count: 'exact' });
  if (filters?.type) query = query.eq('entryType', filters.type);
  const from = (page - 1) * perPage;
  const to = from + perPage - 1;
  const { data, error, count } = await query.range(from, to).order('createdAt', { ascending: false });
  if (error) throw error;
  return { data: data || [], total: count || 0, page, perPage };
}

export async function getPlatformConfig() {
  const { data, error } = await supabase.from('PlatformConfig').select('*').maybeSingle();
  if (error) throw error;
  return data;
}

export async function updatePlatformConfig(updates: Record<string, any>) {
  const { data, error } = await supabase.from('PlatformConfig').update(updates).eq('id', 1).select().single();
  if (error) throw error;
  return data;
}
