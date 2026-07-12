import { supabaseDb } from '@backend/lib/db';
import { generateSlug } from '@backend/lib/utils';
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

export async function createCourse(input: CreateCourseInput) {
  const trainer = await supabaseDb.trainer.findUnique({ where: { id: input.trainerId } });
  if (!trainer) throw new NotFoundError('Trainer');

  const slug = generateSlug(input.title);

  const course = await supabaseDb.course.create({
    data: {
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
    },
  });

  await invalidateCache('courses:list:*');
  await invalidateCache(`trainer:${trainer.id}:*`);

  return course;
}

export async function getCourseBySlug(slug: string) {
  const cacheKey = `courses:slug:${slug}`;
  const cached = await getCached<any>(cacheKey);
  if (cached) return cached;

  const course = await supabaseDb.course.findUnique({
    where: { slug, deletedAt: null },
    include: {
      trainer: {
        include: {
          user: {
            select: { fullName: true, avatarUrl: true },
          },
        },
      },
      _count: { select: { enrolments: true } },
    },
  });

  if (!course) throw new NotFoundError('Course');

  const result = {
    ...course,
    trainer: {
      id: course.trainer.id,
      fullName: course.trainer.user.fullName,
      avatarUrl: course.trainer.user.avatarUrl,
      isVerified: course.trainer.isVerified,
      averageRating: course.trainer.averageRating,
      totalReviews: course.trainer.totalReviews,
    },
  };

  await setCached(cacheKey, result, CACHE.COURSE_DETAIL_TTL);
  return result;
}

export async function updateCourse(courseId: string, userId: string, data: Partial<CreateCourseInput>) {
  const course = await supabaseDb.course.findUnique({
    where: { id: courseId },
    include: { trainer: true },
  });
  if (!course) throw new NotFoundError('Course');
  if (course.trainer.userId !== userId) throw new ForbiddenError('Not your course');
  if (course.deletedAt) throw new NotFoundError('Course');

  const updated = await supabaseDb.course.update({
    where: { id: courseId },
    data: {
      ...data,
      priceKes: data.priceKes ? data.priceKes : undefined,
      maxStudents: data.maxStudents,
    },
  });

  await invalidateCache(`courses:slug:${course.slug}`);
  await invalidateCache('courses:list:*');

  return updated;
}

export async function softDeleteCourse(courseId: string, userId: string) {
  const course = await supabaseDb.course.findUnique({
    where: { id: courseId },
    include: { trainer: true, _count: { select: { enrolments: true } } },
  });
  if (!course) throw new NotFoundError('Course');
  if (course.trainer.userId !== userId) throw new ForbiddenError('Not your course');

  if (course._count.enrolments > 0) {
    throw new ValidationError('Cannot delete course with active enrolments');
  }

  await supabaseDb.course.update({
    where: { id: courseId },
    data: { deletedAt: new Date() },
  });

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

  const where: any = {
    isPublished: true,
    deletedAt: null,
  };

  if (filters.search) {
    where.OR = [
      { title: { contains: filters.search, mode: 'insensitive' } },
      { description: { contains: filters.search, mode: 'insensitive' } },
    ];
  }
  if (filters.category) where.category = filters.category;
  if (filters.mode) where.mode = filters.mode;
  if (filters.minPrice) where.priceKes = { ...where.priceKes, gte: filters.minPrice };
  if (filters.maxPrice) where.priceKes = { ...where.priceKes, lte: filters.maxPrice };

  let orderBy: any = { createdAt: 'desc' };
  switch (filters.sortBy) {
    case 'price_asc':
      orderBy = { priceKes: 'asc' };
      break;
    case 'price_desc':
      orderBy = { priceKes: 'desc' };
      break;
    case 'newest':
      orderBy = { createdAt: 'desc' };
      break;
    case 'rating':
      orderBy = { trainer: { averageRating: 'desc' } };
      break;
  }

  const [courses, total] = await Promise.all([
    supabaseDb.course.findMany({
      where,
      include: {
        trainer: {
          include: {
            user: { select: { fullName: true, avatarUrl: true } },
          },
        },
        _count: { select: { enrolments: true } },
      },
      orderBy,
      skip: (filters.page - 1) * filters.perPage,
      take: filters.perPage,
    }),
    supabaseDb.course.count({ where }),
  ]);

  const result = {
    data: courses.map((c) => ({
      id: c.id,
      title: c.title,
      slug: c.slug,
      mode: c.mode,
      category: c.category,
      priceKes: c.priceKes,
      duration: c.duration,
      sessionCount: c.sessionCount,
      imageUrl: c.imageUrl,
      trainerName: c.trainer.user.fullName,
      trainerAvatar: c.trainer.user.avatarUrl,
      trainerId: c.trainer.id,
      isVerified: c.trainer.isVerified,
      averageRating: c.trainer.averageRating,
      totalReviews: c.trainer.totalReviews,
      enrolmentCount: c._count.enrolments,
    })),
    meta: {
      page: filters.page,
      perPage: filters.perPage,
      total,
      totalPages: Math.ceil(total / filters.perPage),
    },
  };

  await setCached(cacheKey, result, CACHE.COURSE_LIST_TTL);
  return result;
}

export async function getTrainerCourses(trainerId: string, includeUnpublished = false) {
  const where: any = { trainerId };
  if (!includeUnpublished) {
    where.deletedAt = null;
  }

  return supabaseDb.course.findMany({
    where,
    include: {
      _count: { select: { enrolments: true } },
    },
    orderBy: { createdAt: 'desc' },
  });
}
