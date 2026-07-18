import { useQuery } from '@tanstack/react-query';
import { useSearchParams } from 'react-router-dom';
import { Star } from 'lucide-react';
import { useAuthStore } from '@/stores/auth-store';
import { getTrainerReviews } from '@/services/trainerService';
import { reviewKeys } from '@/lib/query-keys';
import { ReviewCard } from '@/components/shared/review-card';
import { Pagination } from '@/components/shared/pagination';
import { ErrorState } from '@/components/shared/error-state';
import { CardSkeleton } from '@/components/shared/loading-skeleton';

const REVIEWS_PER_PAGE = 10;

export default function TrainerReviews() {
  const { user } = useAuthStore();
  const trainerId = user?.trainer?.id;
  const [searchParams] = useSearchParams();
  const page = Number(searchParams.get('page')) || 1;

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: reviewKeys.list(trainerId!, page),
    queryFn: () => getTrainerReviews(trainerId!, page, REVIEWS_PER_PAGE),
    enabled: !!trainerId,
  });

  const reviews = data?.data || [];
  const total = data?.total || 0;
  const totalPages = Math.ceil(total / REVIEWS_PER_PAGE);

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
      {/* Header */}
      <div className="mb-5 sm:mb-6">
        <h1 className="text-xl sm:text-2xl font-bold text-dark">Reviews</h1>
        <p className="text-sm text-body mt-1">See what your students say about your training</p>
      </div>

      {/* Loading */}
      {isLoading && (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <CardSkeleton key={i} />
          ))}
        </div>
      )}

      {/* Error */}
      {isError && <ErrorState message="Failed to load reviews" onRetry={() => refetch()} />}

      {/* Empty */}
      {!isLoading && !isError && reviews.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 px-4 text-center bg-white rounded-card shadow-card">
          <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
            <Star size={28} className="text-primary" aria-hidden="true" />
          </div>
          <h3 className="text-lg font-semibold text-dark mb-1">No reviews yet</h3>
          <p className="text-sm text-muted-foreground max-w-sm">
            Reviews from your students will appear here once they complete their training.
          </p>
        </div>
      )}

      {/* Reviews List */}
      {!isLoading && !isError && reviews.length > 0 && (
        <>
          <div className="space-y-3">
            {reviews.map((review: any) => (
              <ReviewCard
                key={review.id}
                traineeName={review.trainee?.fullName || 'Anonymous'}
                avatarUrl={review.trainee?.avatarUrl}
                rating={review.rating}
                comment={review.comment}
                createdAt={review.createdAt}
              />
            ))}
          </div>

          {totalPages > 1 && (
            <div className="mt-6">
              <Pagination page={page} totalPages={totalPages} total={total} />
            </div>
          )}
        </>
      )}
    </div>
  );
}
