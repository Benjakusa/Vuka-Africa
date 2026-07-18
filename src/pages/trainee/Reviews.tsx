import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Star } from 'lucide-react';
import { toast } from 'sonner';
import { useAuthStore } from '@/stores/auth-store';
import { getEnrolments, createReview } from '@/services/enrolmentService';
import { enrolmentKeys } from '@/lib/query-keys';
import { ReviewModal } from '@/components/shared/review-modal';
import { CardSkeleton } from '@/components/shared/loading-skeleton';
import { ErrorState } from '@/components/shared/error-state';
import { EmptyState } from '@/components/shared/empty-state';
import { formatDate } from '@/lib/utils';

export default function Reviews() {
  const { user } = useAuthStore();
  const [reviewTarget, setReviewTarget] = useState<{ enrolmentId: string; trainerId: string; title: string } | null>(
    null,
  );

  const {
    data: enrolments,
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: enrolmentKeys.list({ traineeId: user?.id, status: 'COMPLETED' }),
    queryFn: () => getEnrolments({ traineeId: user?.id, status: 'COMPLETED' }),
    enabled: !!user?.id,
  });

  const pendingReviews = ((enrolments || []) as any[]).filter((e: any) => !e.reviews || e.reviews.length === 0);

  const handleSubmitReview = async (data: { rating: number; comment: string }) => {
    if (!reviewTarget || !user) return;
    await createReview({
      enrolmentId: reviewTarget.enrolmentId,
      traineeId: user.id,
      trainerId: reviewTarget.trainerId,
      rating: data.rating,
      comment: data.comment,
    });
    toast.success('Review submitted!');
    setReviewTarget(null);
    refetch();
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-dark">Pending Reviews</h1>
        <p className="text-body text-sm">Share your feedback on completed trainings</p>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <CardSkeleton key={i} />
          ))}
        </div>
      ) : isError ? (
        <ErrorState message="Failed to load completed enrolments" onRetry={() => refetch()} />
      ) : pendingReviews.length === 0 ? (
        <EmptyState icon={Star} title="No pending reviews" subtitle="You've reviewed all your completed trainings" />
      ) : (
        <div className="bg-white rounded-card shadow-card divide-y divide-border">
          {pendingReviews.map((enrolment: any) => (
            <div key={enrolment.id} className="p-4 flex items-center justify-between">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-dark">{enrolment.course?.title || 'Course'}</p>
                <p className="text-xs text-body-foreground">
                  Trainer: {enrolment.trainer?.fullName} • Completed {formatDate(enrolment.updatedAt)}
                </p>
              </div>
              <button
                onClick={() =>
                  setReviewTarget({
                    enrolmentId: enrolment.id,
                    trainerId: enrolment.trainerId || enrolment.trainer?.id,
                    title: enrolment.course?.title,
                  })
                }
                className="px-3 py-1.5 bg-primary text-white text-xs font-medium rounded-btn hover:bg-surface"
              >
                Write Review
              </button>
            </div>
          ))}
        </div>
      )}

      <ReviewModal open={!!reviewTarget} onClose={() => setReviewTarget(null)} onSubmit={handleSubmitReview} />
    </div>
  );
}
