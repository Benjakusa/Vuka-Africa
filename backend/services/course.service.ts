import { createAdminClient } from '@/lib/supabase/admin';
import { generateSlug } from '@frontend/utils/slug';
import { setCached, getCached, invalidateCache } from '@backend/lib/cache';
import { NotFoundError, ValidationError, ForbiddenError } from '@backend/lib/errors';
import { CACHE } from '@backend/lib/config';

interface CreateCourseInput {
  trainerId: string;
  title: string;
  description: string;
  learningOutcomes: string[];
  category: string;
  mode: 'PHYSICAL' | 'VIRTUAL' | 'HYBRID';
  duration: string;
  sessionCount: number;
  priceKes: number;
  maxStudents?: number;
  location?: string;
  prerequisites?: string;
  imageUrl?: string;
}

const db = () => createAdminClient();

export async function createCourse(input: CreateCourseInput) {
  const { data: trainer } = await db()
    .from('Trainer')
    .select('id')
    .eq('id', input.trainerId)
    .single();
  if (!trainer) throw new NotFoundError('Trainer');

  const slug = generateSlug(input.title);

  const { data: course, error } = await db()
    .from('Course')
    .insert({
      trainerId: input.trainerId,
      title: input.title,
      slug,
      description: input.description,
      learningOutcomes: input.learningOutcomes,
      category: input.category,
      mode: input.mode,
      duration: input.duration,
      sessionCount: input.sessionCount,
      priceKes: input.priceKes,
      maxStudents: input.maxStudents,
      location: input.location,
      prerequisites: input.prerequisites,
      imageUrl: input.imageUrl,
    })
    .select()
    .single();

  if (error || !course) throw new Error('Failed to create course');

  await invalidateCache('courses:list:*');
  await invalidateCache(`trainer:${trainer.id}:*`);

  return course;
}

export async function getCourseBySlug(slug: string) {
  const cacheKey = `courses:slug:${slug}`;
  const cached = await getCached<any>(cacheKey);
  if (cached) return cached;

  const { data: course, error } = await db()
    .from('Course')
    .select(`
      *,
      trainer:Trainer(
        id,
        isVerified,
        averageRating,
        totalReviews,
        user:User(fullName, avatarUrl)
      )
    `)
    .eq('slug', slug)
    .is('deletedAt', null)
    .single();

  if (error || !course) throw new NotFoundError('Course');

  const result = {
    ...course,
    trainer: {
      id: course.trainer.id,
      fullName: course.trainer.user?.fullName,
      avatarUrl: course.trainer.user?.avatarUrl,
      isVerified: course.trainer.isVerified,
      averageRating: course.trainer.averageRating,
      totalReviews: course.trainer.totalReviews,
    },
  };

  await setCached(cacheKey, result, CACHE.COURSE_DETAIL_TTL);
  return result;
}

export async function updateCourse(courseId: string, userId: string, data: Partial<CreateCourseInput>) {
  const { data: course, error: findError } = await db()
    .from('Course')
    .select('*, trainer:Trainer(userId)')
    .eq('id', courseId)
    .single();

  if (findError || !course) throw new NotFoundError('Course');
  if (course.trainer.userId !== userId) throw new ForbiddenError('Not your course');
  if (course.deletedAt) throw new NotFoundError('Course');

  const updateData: any = { ...data };
  if (data.priceKes !== undefined) updateData.priceKes = data.priceKes;

  const { data: updated, error: updateError } = await db()
    .from('Course')
    .update(updateData)
    .eq('id', courseId)
    .select()
    .single();

  if (updateError || !updated) throw new Error('Failed to update course');

  await invalidateCache(`courses:slug:${course.slug}`);
  await invalidateCache('courses:list:*');

  return updated;
}

export async function softDeleteCourse(courseId: string, userId: string) {
  const { data: course, error: findError } = await db()
    .from('Course')
    .select('*, trainer:Trainer(userId), slug, deletedAt')
    .eq('id', courseId)
    .single();

  if (findError || !course) throw new NotFoundError('Course');
  if (course.trainer.userId !== userId) throw new ForbiddenError('Not your course');

  const { count } = await db()
    .from('Enrolment')
    .select('*', { count: 'exact', head: true })
    .eq('courseId', courseId);

  if (count && count > 0) {
    throw new ValidationError('Cannot delete course with active enrolments');
  }

  const { error: deleteError } = await db()
    .from('Course')
    .update({ deletedAt: new Date().toISOString() })
    .eq('id', courseId);

  if (deleteError) throw new Error('Failed to delete course');

  await invalidateCache(`courses:slug:${course.slug}`);
  await invalidateCache('courses:list:*');
}

interface CourseListFilters {
  search?: string;
  category?: string;
  mode?: string;
  minPrice?: number;
  maxPrice?: number;
  sortBy?: string;
  page: number;
  perPage: number;
}

export async function listCourses(filters: CourseListFilters) {
  const cacheKey = `courses:list:${JSON.stringify(filters)}`;
  const cached = await getCached<any>(cacheKey);
  if (cached) return cached;

  let query = db()
    .from('Course')
    .select(`
      *,
      trainer:Trainer(
        id,
        isVerified,
        averageRating,
        totalReviews,
        user:User(fullName, avatarUrl)
      )
    `, { count: 'exact' })
    .eq('isPublished', true)
    .is('deletedAt', null);

  if (filters.search) {
    query = query.or(`title.ilike.%${filters.search}%,description.ilike.%${filters.search}%`);
  }
  if (filters.category) {
    query = query.eq('category', filters.category);
  }
  if (filters.mode) {
    query = query.eq('mode', filters.mode);
  }
  if (filters.minPrice) {
    query = query.gte('priceKes', filters.minPrice);
  }
  if (filters.maxPrice) {
    query = query.lte('priceKes', filters.maxPrice);
  }

  switch (filters.sortBy) {
    case 'price_asc': query = query.order('priceKes', { ascending: true }); break;
    case 'price_desc': query = query.order('priceKes', { ascending: false }); break;
    case 'rating': query = query.order('averageRating', { ascending: false, foreignTable: 'trainer' }); break;
    default: query = query.order('createdAt', { ascending: false });
  }

  const from = (filters.page - 1) * filters.perPage;
  const to = from + filters.perPage - 1;
  query = query.range(from, to);

  const { data: courses, count: total, error } = await query;

  if (error) throw new Error('Failed to list courses');

  const result = {
    data: (courses || []).map((c: any) => ({
      id: c.id,
      title: c.title,
      slug: c.slug,
      mode: c.mode,
      category: c.category,
      priceKes: c.priceKes,
      duration: c.duration,
      sessionCount: c.sessionCount,
      imageUrl: c.imageUrl,
      trainerName: c.trainer?.user?.fullName,
      trainerAvatar: c.trainer?.user?.avatarUrl,
      trainerId: c.trainer?.id,
      isVerified: c.trainer?.isVerified,
      averageRating: c.trainer?.averageRating,
      totalReviews: c.trainer?.totalReviews,
      enrolmentCount: 0,
    })),
    meta: {
      page: filters.page,
      perPage: filters.perPage,
      total: total || 0,
      totalPages: Math.ceil((total || 0) / filters.perPage),
    },
  };

  await setCached(cacheKey, result, CACHE.COURSE_LIST_TTL);
  return result;
}

export async function getTrainerCourses(trainerId: string, includeUnpublished = false) {
  let query = db()
    .from('Course')
    .select('*')
    .eq('trainerId', trainerId)
    .order('createdAt', { ascending: false });

  if (!includeUnpublished) {
    query = query.is('deletedAt', null);
  }

  const { data: courses, error } = await query;

  if (error) throw new Error('Failed to get trainer courses');

  return courses || [];
}
