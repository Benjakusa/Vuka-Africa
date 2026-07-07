import { supabaseData as supabase } from '@/lib/supabase';

export async function getCourseBySlug(slug: string) {
  const { data, error } = await supabase
    .from('Course')
    .select('*, trainer:Trainer!trainerId(id, isVerified, averageRating, totalReviews, user:User!userId(fullName))')
    .eq('slug', slug)
    .maybeSingle();
  if (error) throw error;
  if (data?.trainer) {
    (data.trainer as Record<string, unknown>).fullName =
      (data.trainer as Record<string, unknown>).user &&
      ((data.trainer as Record<string, unknown>).user as Record<string, unknown>).fullName;
    delete (data.trainer as Record<string, unknown>).user;
  }
  return data;
}

export async function getTrainerCourses(trainerId: string) {
  const { data, error } = await supabase.from('Course').select('*').eq('trainerId', trainerId);
  if (error) throw error;
  return data || [];
}

export async function createCourse(course: Record<string, any>) {
  const { data, error } = await supabase.from('Course').insert(course).select().single();
  if (error) throw error;
  return data;
}

export async function updateCourse(id: string, updates: Record<string, any>) {
  const { data, error } = await supabase.from('Course').update(updates).eq('id', id).select().single();
  if (error) throw error;
  return data;
}
