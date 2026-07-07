import { supabaseData as supabase } from '@/lib/supabase';

export async function getEnrolments(filters?: Record<string, any>) {
  let query = supabase
    .from('Enrolment')
    .select(
      '*, trainee:User!traineeId(id, fullName, email, phone), trainer:User!trainerId(id, fullName), course:Course(id, title, slug, mode, duration, sessionCount), milestones:Milestone(*), reviews:Review(*)',
    );

  if (filters?.status) query = query.eq('status', filters.status);
  if (filters?.traineeId) query = query.eq('traineeId', filters.traineeId);
  if (filters?.trainerId) query = query.eq('trainerId', filters.trainerId);

  query = query.order('createdAt', { ascending: false });

  const { data, error } = await query;
  if (error) throw error;
  return data || [];
}

export async function getEnrolment(id: string) {
  const { data, error } = await supabase
    .from('Enrolment')
    .select(
      '*, trainee:User!traineeId(id, fullName, email, phone), trainer:User!trainerId(id, fullName), course:Course(id, title, slug, mode, duration, sessionCount, priceKes), milestones:Milestone(*), reviews:Review(*)',
    )
    .eq('id', id)
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function createEnrolment(data: Record<string, any>) {
  const { data: enrolment, error } = await supabase.from('Enrolment').insert(data).select().single();
  if (error) throw error;
  return enrolment;
}

export async function confirmMilestone(milestoneId: string, by: 'trainee' | 'trainer') {
  const updates: Record<string, any> = {};
  if (by === 'trainee') updates.traineeConfirmedAt = new Date().toISOString();
  else updates.trainerConfirmedAt = new Date().toISOString();

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
