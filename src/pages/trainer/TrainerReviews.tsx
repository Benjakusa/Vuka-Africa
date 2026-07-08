import { useQuery } from '@tanstack/react-query';
import { useSearchParams } from 'react-router-dom';
import { Star } from 'lucide-react';
import { useAuthStore } from '@/stores/auth-store';
import { getTrainerReviews } from '@/services/trainerService';
import { reviewKeys } from '@/lib/query-keys';
import { ReviewCard } from '@/components/shared/review-card';
import { Pagination } from '@/components/shared/pagination';
import { EmptyState } from '@/components/shared/empty-state';
import { ErrorState } from '@/components/shared/error-state';
import { CardSkeleton } from '@/components/shared/loading-skeleton';

export default function TrainerReviews() {
  const { user } = useAuthStore();
  const trainerId = user?.trainer?.id;
  const [searchParams] = useSearchParams();
  const page = Number(searchParams.get('page')) || 1;

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: reviewKeys.list(trainerId!, page),
    queryFn: () => getTrainerReviews(trainerId!, page),
    enabled: !!trainerId,
  });

  const reviews = data?.data || [];
  const total = data?.total || 0;
  const totalPages = Math.ceil(total / 10);

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-dark">Reviews</h1>
        <p className="text-body text-sm">What students say about your training</p>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <CardSkeleton key={i} />
          ))}
        </div>
      ) : isError ? (
        <ErrorState message="Failed to load reviews" onRetry={() => refetch()} />
      ) : reviews.length === 0 ? (
        <EmptyState icon={Star} title="No reviews yet" subtitle="Reviews from students will appear here" />
      ) : (
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
          <Pagination page={page} totalPages={totalPages} total={total} />
        </>
      )}
    </div>
  );
}
