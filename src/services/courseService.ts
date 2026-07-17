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
    .select('*, trainer:Trainer!trainerId(id, isVerified, averageRating, totalReviews, user:User!userId(fullName))', { count: 'exact' });
  if (filters?.['isPublished']) query = query.eq('isPublished', true);
  if (filters?.['category']) query = query.eq('category', filters['category']);
  if (filters?.['mode']) query = query.eq('mode', filters['mode']);
  if (filters?.['search']) {
    query = query.or(`title.ilike.%${filters['search']}%,trainer.user.fullName.ilike.%${filters['search']}%`);
  }
  const page = filters?.['page'] ? Number(filters['page']) : 1;
  const perPage = filters?.['perPage'] ? Number(filters['perPage']) : (filters?.['limit'] ? Number(filters['limit']) : 12);
  const from = (page - 1) * perPage;
  const to = from + perPage - 1;
  query = query.range(from, to);
  const orderCol = filters?.['order'] || 'createdAt';
  const orderAsc = filters?.['orderAsc'] === true;
  query = query.order(orderCol, { ascending: orderAsc });
  const { data, error, count } = await query;
  if (error) throw error;
  const mapped = (data || []).map((course: any) => {
    if (course.trainer) {
      (course.trainer as Record<string, unknown>)['fullName'] = (course.trainer as any).user?.fullName;
      delete (course.trainer as any).user;
    }
    return course;
  });
  if (filters?.['includeTotal']) {
    return { data: mapped, total: count || 0 };
  }
  return mapped;
}

export async function getTrainerCourses(trainerId: string) {
  const { data, error } = await supabase
    .from('Course')
    .select(
      'id, title, slug, description, mode, duration, sessionCount, priceKes, isPublished, imageUrl, category, maxStudents, location, createdAt, updatedAt',
    )
    .eq('trainerId', trainerId);
  if (error) throw error;
  return data || [];
}

export async function createCourse(course: Record<string, any>) {
  const now = new Date().toISOString();
  const { data, error } = await supabase
    .from('Course')
    .insert({ ...course, createdAt: now, updatedAt: now })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function updateCourse(id: string, updates: Record<string, any>) {
  const { data, error } = await supabase
    .from('Course')
    .update({ ...updates, updatedAt: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data;
}
