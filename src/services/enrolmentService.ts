import { supabase } from '@/lib/supabase';

function flattenTrainer(enrolment: any) {
  if (!enrolment) return enrolment;
  if (enrolment.trainer?.user?.fullName) {
    enrolment.trainer.fullName = enrolment.trainer.user.fullName;
    delete enrolment.trainer.user;
  }
  return enrolment;
}

export async function getEnrolments(filters?: Record<string, any>) {
  let query = supabase
    .from('Enrolment')
    .select(
      '*, trainee:User!traineeId(id, fullName, email, phone), trainer:Trainer!trainerId(id, user:User!userId(fullName)), course:Course(id, title, slug, mode, duration, sessionCount), milestones:Milestone(*), reviews:Review(*)',
    );

  if (filters?.['status']) query = query.eq('status', filters['status'] as string);
  if (filters?.['traineeId']) query = query.eq('traineeId', filters['traineeId'] as string);
  if (filters?.['trainerId']) query = query.eq('trainerId', filters['trainerId'] as string);
  if (filters?.['limit']) query = query.limit(filters['limit'] as number);

  query = query.order('createdAt', { ascending: false });

  const { data, error } = await query;
  if (error) throw error;
  return (data || []).map(flattenTrainer);
}

export async function getEnrolment(id: string) {
  const { data, error } = await supabase
    .from('Enrolment')
    .select(
      '*, trainee:User!traineeId(id, fullName, email, phone), trainer:Trainer!trainerId(id, user:User!userId(fullName)), course:Course(id, title, slug, mode, duration, sessionCount, priceKes), milestones:Milestone(*), reviews:Review(*)',
    )
    .eq('id', id)
    .maybeSingle();
  if (error) throw error;
  return flattenTrainer(data);
}

export async function createEnrolment(data: Record<string, any>) {
  const { data: enrolment, error } = await supabase.from('Enrolment').insert(data).select().single();
  if (error) throw error;
  return enrolment;
}

export async function confirmMilestone(milestoneId: string, by: 'trainee' | 'trainer') {
  const updates: Record<string, any> = {};
  if (by === 'trainee') updates['traineeConfirmedAt'] = new Date().toISOString();
  else updates['trainerConfirmedAt'] = new Date().toISOString();

  const { data, error } = await supabase.from('Milestone').update(updates).eq('id', milestoneId).select().single();
  if (error) throw error;
  return data;
}

export async function createDispute(
  enrolmentId: string,
  data: { raisedBy: string; reason: string; description: string },
) {
  const { data: dispute, error } = await supabase
    .from('Dispute')
    .insert({
      enrolmentId,
      raisedBy: data.raisedBy,
      reason: data.reason,
      description: data.description,
      status: 'OPEN',
    })
    .select()
    .single();
  if (error) throw error;
  return dispute;
}

export async function createReview(data: {
  enrolmentId: string;
  traineeId: string;
  trainerId: string;
  rating: number;
  comment: string;
}) {
  const { data: review, error } = await supabase.from('Review').insert(data).select().single();
  if (error) throw error;
  return review;
}

export async function acceptEnrolment(enrolmentId: string) {
  const now = new Date().toISOString();
  const { error } = await supabase
    .from('Enrolment')
    .update({ status: 'ACTIVE', acceptedAt: now, updatedAt: now })
    .eq('id', enrolmentId);
  if (error) throw error;
}

export async function rejectEnrolment(enrolmentId: string, reason: string) {
  const now = new Date().toISOString();
  const { error } = await supabase
    .from('Enrolment')
    .update({ status: 'REJECTED', rejectedAt: now, rejectionReason: reason, updatedAt: now })
    .eq('id', enrolmentId);
  if (error) throw error;
}

export async function getCourseMaterials(enrolmentId: string) {
  const { data, error } = await supabase
    .from('CourseMaterial')
    .select('*')
    .eq('enrolmentId', enrolmentId)
    .order('createdAt', { ascending: false });
  if (error) throw error;
  return data || [];
}

export async function addCourseMaterial(data: {
  enrolmentId: string;
  title: string;
  description?: string;
  fileUrl?: string;
  fileType: string;
  uploadedBy: string;
}) {
  const now = new Date().toISOString();
  const { data: material, error } = await supabase
    .from('CourseMaterial')
    .insert({ ...data, createdAt: now, updatedAt: now })
    .select()
    .single();
  if (error) throw error;
  return material;
}

export async function deleteCourseMaterial(id: string) {
  const { error } = await supabase.from('CourseMaterial').delete().eq('id', id);
  if (error) throw error;
}

export async function createMilestone(data: {
  enrolmentId: string;
  sequence: number;
  label: string;
  notes?: string;
}) {
  const now = new Date().toISOString();
  const { data: milestone, error } = await supabase
    .from('Milestone')
    .insert({
      enrolmentId: data.enrolmentId,
      sequence: data.sequence,
      label: data.label,
      notes: data.notes || null,
      status: 'NOT_STARTED',
      percentage: 0,
      amountKes: 0,
      createdAt: now,
      updatedAt: now,
    })
    .select()
    .single();
  if (error) throw error;
  return milestone;
}

export async function startMilestone(milestoneId: string, userId: string) {
  const now = new Date().toISOString();
  const { data, error } = await supabase
    .from('Milestone')
    .update({ status: 'IN_PROGRESS', startedAt: now, startedBy: userId, updatedAt: now })
    .eq('id', milestoneId)
    .eq('status', 'NOT_STARTED')
    .select()
    .single();
  if (error) throw error;
  if (!data) throw new Error('Milestone not found or already started');
  return data;
}

export async function completeMilestone(milestoneId: string, userId: string, notes?: string) {
  const now = new Date().toISOString();
  const updates: Record<string, any> = { status: 'COMPLETED', completedAt: now, completedBy: userId, updatedAt: now };
  if (notes) updates['notes'] = notes;

  const { data, error } = await supabase
    .from('Milestone')
    .update(updates)
    .eq('id', milestoneId)
    .eq('status', 'IN_PROGRESS')
    .select()
    .single();
  if (error) throw error;
  if (!data) throw new Error('Milestone not found or not in progress');
  return data;
}

export async function deleteMilestone(milestoneId: string) {
  const { error } = await supabase.from('Milestone').delete().eq('id', milestoneId).eq('status', 'NOT_STARTED');
  if (error) throw error;
}

export async function updateMilestone(milestoneId: string, updates: { label?: string; notes?: string }) {
  const now = new Date().toISOString();
  const { data, error } = await supabase
    .from('Milestone')
    .update({ ...updates, updatedAt: now })
    .eq('id', milestoneId)
    .eq('status', 'NOT_STARTED')
    .select()
    .single();
  if (error) throw error;
  if (!data) throw new Error('Milestone not found or already started');
  return data;
}

export async function markMaterialReviewed(materialId: string) {
  const { data, error } = await supabase
    .from('CourseMaterial')
    .update({ updatedAt: new Date().toISOString() })
    .eq('id', materialId)
    .select()
    .single();
  if (error) throw error;
  return data;
}
