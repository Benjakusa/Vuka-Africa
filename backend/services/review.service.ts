import { supabaseDb } from '@backend/lib/db';
import { NotFoundError, ValidationError, ForbiddenError } from '@backend/lib/errors';

interface CreateReviewInput {
  enrolmentId: string;
  userId: string;
  rating: number;
  comment?: string;
}

export async function createReview(input: CreateReviewInput) {
  const enrolment = await supabaseDb.enrolment.findUnique({
    where: { id: input.enrolmentId },
  });
  if (!enrolment) throw new NotFoundError('Enrolment');
  if (enrolment.traineeId !== input.userId) throw new ForbiddenError('Not your enrolment');
  if (enrolment.status !== 'COMPLETED') {
    throw new ValidationError('Can only review completed enrolments');
  }

  const existing = await supabaseDb.review.findUnique({
    where: { enrolmentId: input.enrolmentId },
  });
  if (existing) throw new ValidationError('Already reviewed this enrolment');

  const review = await supabaseDb.review.create({
    data: {
      enrolmentId: input.enrolmentId,
      trainerId: enrolment.trainerId,
      traineeId: input.userId,
      rating: input.rating,
      comment: input.comment,
    },
  });

  return review;
}

export async function getTrainerReviews(trainerId: string, page = 1, perPage = 10) {
  const trainer = await supabaseDb.trainer.findUnique({ where: { id: trainerId } });
  if (!trainer) throw new NotFoundError('Trainer');

  const [reviews, total] = await Promise.all([
    supabaseDb.review.findMany({
      where: { trainerId, isPublic: true },
      include: {
        trainee: {
          select: { fullName: true, avatarUrl: true },
        },
      },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * perPage,
      take: perPage,
    }),
    supabaseDb.review.count({ where: { trainerId, isPublic: true } }),
  ]);

  const ratingBreakdown = await supabaseDb.review.groupBy({
    by: ['rating'],
    where: { trainerId },
    _count: { rating: true },
  });

  const breakdown: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  ratingBreakdown.forEach((r) => {
    breakdown[r.rating] = r._count.rating;
  });

  return {
    data: reviews,
    meta: { page, perPage, total, totalPages: Math.ceil(total / perPage) },
    averageRating: trainer.averageRating,
    totalReviews: trainer.totalReviews,
    ratingBreakdown: breakdown,
  };
}
