import { supabase } from '@/lib/supabase';

export async function getCourseBySlug(slug: string) {
  const { data, error } = await supabase
    .from('Course')
    .select('*, trainer:Trainer!trainerId(id, isVerified, averageRating, totalReviews, user:User!userId(fullName))')
    .eq('slug', slug)
    .maybeSingle();
  if (error) throw error;
  if (data?.trainer) {
    (data.trainer as Record<string, unknown>)['fullName'] =
      (data.trainer as Record<string, unknown>)['user'] &&
      ((data.trainer as Record<string, unknown>)['user'] as Record<string, unknown>)['fullName'];
    delete (data.trainer as Record<string, unknown>)['user'];
  }
  return data;
}

export async function getCourses(filters?: Record<string, any>) {
  let query = supabase
    .from('Course')
    .select('*, trainer:Trainer!trainerId(id, isVerified, averageRating, totalReviews, user:User!userId(fullName))');
  if (filters?.['isPublished']) query = query.eq('isPublished', true);
  if (filters?.['limit']) {
    const from = 0;
    query = query.range(from, (filters['limit'] as number) - 1);
  }
  query = query.order('createdAt', { ascending: false });
  const { data, error } = await query;
  if (error) throw error;
  return (data || []).map((course: any) => {
    if (course.trainer) {
      (course.trainer as Record<string, unknown>)['fullName'] = (course.trainer as any).user?.fullName;
      delete (course.trainer as any).user;
    }
    return course;
  });
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
