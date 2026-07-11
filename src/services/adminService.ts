import { supabase } from '@/lib/supabase';

export async function getAdminStats() {
  const { data, error } = await supabase.rpc('get_admin_stats');
  if (error) throw error;
  const stats = data?.[0] || {
    total_users: 0,
    total_trainers: 0,
    total_courses: 0,
    total_enrolments: 0,
    open_disputes: 0,
  };
  return {
    totalUsers: Number(stats.total_users),
    totalTrainers: Number(stats.total_trainers),
    totalCourses: Number(stats.total_courses),
    totalEnrolments: Number(stats.total_enrolments),
    openDisputes: Number(stats.open_disputes),
  };
}

export async function getAdminEarnings() {
  const [financialsRes, monthlyRes] = await Promise.all([
    supabase.rpc('get_admin_financials'),
    supabase.rpc('get_admin_monthly_earnings'),
  ]);

  if (financialsRes.error) throw financialsRes.error;
  if (monthlyRes.error) throw monthlyRes.error;

  const fin = financialsRes.data?.[0] || {
    total_commissions: 0,
    total_disbursed: 0,
    pending_payouts: 0,
    pending_payouts_count: 0,
  };

  const monthlyEarnings = (monthlyRes.data || []).map((row: any) => ({
    month: row.month,
    commissions: Number(row.commissions),
    disbursements: Number(row.disbursements),
  }));

  return {
    totalCommissions: Number(fin.total_commissions),
    totalDisbursed: Number(fin.total_disbursed),
    pendingPayouts: Number(fin.pending_payouts),
    pendingPayoutsCount: Number(fin.pending_payouts_count),
    monthlyEarnings,
  };
}

export async function getAdminPayouts(filters?: { status?: string; search?: string; page?: number; perPage?: number }) {
  const page = filters?.page || 1;
  const perPage = filters?.perPage || 20;
  let query = supabase
    .from('Payout')
    .select('*, trainer:Trainer!trainerId(user:User!userId(id, fullName, email, phone))', { count: 'exact' });

  if (filters?.status) query = query.eq('status', filters.status);
  if (filters?.search) query = query.or(`trainer.user.fullName.ilike.%${filters.search}%`);

  const from = (page - 1) * perPage;
  const to = from + perPage - 1;
  const { data, error, count } = await query.range(from, to).order('createdAt', { ascending: false });
  if (error) throw error;

  const flattened = (data || []).map((p: any) => ({
    ...p,
    trainerName: p.trainer?.user?.fullName || 'Unknown',
    trainerEmail: p.trainer?.user?.email || '',
    trainerPhone: p.trainer?.user?.phone || '',
  }));

  return { data: flattened, total: count || 0, page, perPage };
}

export async function processTrainerPayment(data: {
  payoutId: string;
  amountPaid: number;
  mpesaTransactionId: string;
  paymentMethod: 'mpesa' | 'bank' | 'other';
  notes?: string;
  adminId: string;
}) {
  const { error } = await supabase.rpc('process_trainer_payout', {
    p_payout_id: data.payoutId,
    p_amount_paid: data.amountPaid,
    p_payment_method: data.paymentMethod,
    p_admin_notes: data.notes || null,
    p_admin_id: data.adminId,
    p_reference: data.mpesaTransactionId || data.paymentMethod,
  });
  if (error) throw error;
}

export async function getAllCourses(filters?: {
  search?: string;
  category?: string;
  mode?: string;
  isPublished?: boolean;
  page?: number;
  perPage?: number;
}) {
  const page = filters?.page || 1;
  const perPage = filters?.perPage || 20;
  let query = supabase
    .from('Course')
    .select('*, trainer:Trainer!trainerId(user:User!userId(fullName)), _enrolmentCount:Enrolment(id)', {
      count: 'exact',
    });

  if (filters?.search) {
    query = query.or(`title.ilike.%${filters.search}%,trainer.user.fullName.ilike.%${filters.search}%`);
  }
  if (filters?.category) query = query.eq('category', filters.category);
  if (filters?.mode) query = query.eq('mode', filters.mode);
  if (filters?.isPublished !== undefined) query = query.eq('isPublished', filters.isPublished);

  query = query.is('deletedAt', null);

  const from = (page - 1) * perPage;
  const to = from + perPage - 1;
  const { data, error, count } = await query.range(from, to).order('createdAt', { ascending: false });
  if (error) throw error;

  const flattened = (data || []).map((c: any) => ({
    ...c,
    trainerName: c.trainer?.user?.fullName || 'Unknown',
    enrolmentCount: c._enrolmentCount?.length || 0,
  }));

  return { data: flattened, total: count || 0, page, perPage };
}

export async function getAdminCourseDetail(courseId: string) {
  const [courseRes, enrolRes, revenueRes] = await Promise.all([
    supabase
      .from('Course')
      .select('*, trainer:Trainer!trainerId(user:User!userId(fullName, email))')
      .eq('id', courseId)
      .single(),
    supabase
      .from('Enrolment')
      .select(
        'id, status, pricePaidKes, createdAt, trainee:User!traineeId(id, fullName, email), milestones:Milestone(status)',
      )
      .eq('courseId', courseId)
      .order('createdAt', { ascending: false }),
    supabase.from('Enrolment').select('pricePaidKes').eq('courseId', courseId),
  ]);

  if (courseRes.error) throw courseRes.error;
  if (enrolRes.error) throw enrolRes.error;

  const totalRevenue = (revenueRes.data || []).reduce((sum: number, e: any) => sum + (Number(e.pricePaidKes) || 0), 0);

  return {
    ...courseRes.data,
    trainerName: courseRes.data.trainer?.user?.fullName || 'Unknown',
    enrolments: enrolRes.data || [],
    totalRevenue,
  };
}

export async function unpublishCourse(courseId: string) {
  const { error } = await supabase.from('Course').update({ isPublished: false }).eq('id', courseId);
  if (error) throw error;
}

export async function publishCourse(courseId: string) {
  const { error } = await supabase.from('Course').update({ isPublished: true }).eq('id', courseId);
  if (error) throw error;
}

export async function softDeleteCourse(courseId: string) {
  const { error } = await supabase.from('Course').update({ deletedAt: new Date().toISOString() }).eq('id', courseId);
  if (error) throw error;
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
      '*, enrolment:Enrolment(id, trainee:User!traineeId(fullName), trainer:Trainer!trainerId(user:User!userId(fullName)), course:Course(title))',
      { count: 'exact' },
    );
  if (status) query = query.eq('status', status);
  const from = (page - 1) * perPage;
  const to = from + perPage - 1;
  const { data, error, count } = await query.range(from, to).order('createdAt', { ascending: false });
  if (error) throw error;
  const flattened = (data || []).map((d: any) => {
    if (d.enrolment?.trainer?.user?.fullName) {
      d.enrolment.trainer.fullName = d.enrolment.trainer.user.fullName;
      delete d.enrolment.trainer.user;
    }
    return d;
  });
  return { data: flattened, total: count || 0, page, perPage };
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
  if (filters?.['type']) query = query.eq('entryType', filters['type'] as string);
  const from = (page - 1) * perPage;
  const to = from + perPage - 1;
  const { data, error, count } = await query.range(from, to).order('createdAt', { ascending: false });
  if (error) throw error;
  return { data: data || [], total: count || 0, page, perPage };
}

export async function getPlatformConfig() {
  const { data, error } = await supabase
    .from('PlatformConfig')
    .select('id, commissionRate, minimumWithdrawalKes, supportEmail, supportPhone, termsUrl, privacyUrl, updatedAt')
    .maybeSingle();
  if (error) throw error;
  return (
    data || {
      commissionRate: 12,
      verificationFee: 5000,
      minPayoutAmount: 100,
      maxPayoutAmount: 50000,
      freeTrainerLimit: 100,
    }
  );
}

export async function updatePlatformConfig(updates: Record<string, any>) {
  const { data, error } = await supabase
    .from('PlatformConfig')
    .upsert({ id: 1, ...updates })
    .select()
    .single();
  if (error) throw error;
  return data;
}
