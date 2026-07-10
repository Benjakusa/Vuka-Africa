import { supabase } from '@/lib/supabase';

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

export async function getAdminEarnings() {
  const [commissions, disbursements, pendingPayouts, monthlyData] = await Promise.all([
    supabase.from('TransactionLedger').select('amountKes').eq('entryType', 'COMMISSION'),
    supabase.from('TransactionLedger').select('amountKes').eq('entryType', 'PAYOUT'),
    supabase
      .from('Payout')
      .select('amount')
      .eq('status', 'PENDING'),
    supabase
      .from('TransactionLedger')
      .select('amountKes, createdAt, entryType')
      .order('createdAt', { ascending: false }),
  ]);

  const totalCommissions = (commissions.data || []).reduce((sum: number, t: any) => sum + (Number(t.amountKes) || 0), 0);
  const totalDisbursed = (disbursements.data || []).reduce((sum: number, t: any) => sum + (Number(t.amountKes) || 0), 0);
  const pendingAmount = (pendingPayouts.data || []).reduce((sum: number, p: any) => sum + (Number(p.amount) || 0), 0);

  const monthlyMap: Record<string, { commissions: number; disbursements: number }> = {};
  (monthlyData.data || []).forEach((t: any) => {
    const month = new Date(t.createdAt).toISOString().slice(0, 7);
    if (!monthlyMap[month]) monthlyMap[month] = { commissions: 0, disbursements: 0 };
    if (t.entryType === 'COMMISSION') monthlyMap[month].commissions += Number(t.amountKes) || 0;
    if (t.entryType === 'PAYOUT') monthlyMap[month].disbursements += Number(t.amountKes) || 0;
  });

  const monthlyEarnings = Object.entries(monthlyMap)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([month, data]) => ({ month, ...data }));

  return {
    totalCommissions,
    totalDisbursed,
    pendingPayouts: pendingAmount,
    pendingPayoutsCount: pendingPayouts.count || 0,
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
  const { error: payoutError } = await supabase
    .from('Payout')
    .update({
      status: 'COMPLETED',
      amountPaid: data.amountPaid,
      paymentMethod: data.paymentMethod,
      adminNotes: data.notes || null,
      processedBy: data.adminId,
      processedAt: new Date().toISOString(),
    })
    .eq('id', data.payoutId);
  if (payoutError) throw payoutError;

  const { error: ledgerError } = await supabase.from('TransactionLedger').insert({
    userId: data.adminId,
    amountKes: data.amountPaid,
    entryType: 'PAYOUT',
    direction: 'DEBIT',
    description: `Payout processed — ${data.mpesaTransactionId || data.paymentMethod}`,
    metadata: { payoutId: data.payoutId },
  });
  if (ledgerError) throw ledgerError;
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
    query = query.or(
      `title.ilike.%${filters.search}%,trainer.user.fullName.ilike.%${filters.search}%`,
    );
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
  const { data: course, error: courseError } = await supabase
    .from('Course')
    .select('*, trainer:Trainer!trainerId(user:User!userId(fullName, email))')
    .eq('id', courseId)
    .single();
  if (courseError) throw courseError;

  const { data: enrolments, error: enrolError } = await supabase
    .from('Enrolment')
    .select('*, trainee:User!traineeId(id, fullName, email), milestones:Milestone(*)')
    .eq('courseId', courseId)
    .order('createdAt', { ascending: false });
  if (enrolError) throw enrolError;

  const totalRevenue = (enrolments || []).reduce(
    (sum: number, e: any) => sum + (Number(e.pricePaidKes) || 0),
    0,
  );

  return {
    ...course,
    trainerName: course.trainer?.user?.fullName || 'Unknown',
    enrolments: enrolments || [],
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
  const { error } = await supabase
    .from('Course')
    .update({ deletedAt: new Date().toISOString() })
    .eq('id', courseId);
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
  const { data, error } = await supabase.from('PlatformConfig').select('*').maybeSingle();
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
