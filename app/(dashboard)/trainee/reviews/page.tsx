'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { Star, Edit3, CheckCircle, Clock } from 'lucide-react';
import { api } from '@backend/lib/api';
import { enrolmentKeys, reviewKeys } from '@backend/lib/query-keys';
import { useAuthStore } from '@frontend/stores/auth-store';
import { ReviewCard } from '@frontend/components/shared/review-card';
import { RatingStars } from '@frontend/components/shared/rating-stars';
import { ReviewModal } from '@frontend/components/shared/review-modal';
import { EmptyState } from '@frontend/components/shared/empty-state';
import { ErrorState } from '@frontend/components/shared/error-state';
import { CardSkeleton } from '@frontend/components/shared/loading-skeleton';
import { StatusBadge } from '@frontend/components/shared/status-badge';
import { OfflineBanner } from '@frontend/components/shared/offline-banner';
import { BackButton } from '@frontend/components/shared/back-button';
import { formatDate } from '@backend/lib/utils';
import { toast } from 'sonner';

export default function ReviewsPage() {
  const [tab, setTab] = useState<'pending' | 'written'>('pending');
  const [reviewTarget, setReviewTarget] = useState<{ enrolmentId: string; trainerName?: string; courseTitle?: string } | null>(null);
  const queryClient = useQueryClient();

  const { data: completedRes, isLoading: pendingLoading, isError: pendingError, refetch: refetchPending } = useQuery({
    queryKey: enrolmentKeys.list({ status: 'COMPLETED' }),
    queryFn: () => api.get<any>('/enrolments', { status: 'COMPLETED', page: 1, perPage: 50 }),
  });

  const { data: reviewsRes, isLoading: writtenLoading, isError: writtenError, refetch: refetchWritten } = useQuery({
    queryKey: reviewKeys.list(),
    queryFn: () => api.get<any>('/trainee/reviews'),
  });

  const completedEnrolments = completedRes?.data?.data || [];
  const pendingReviews = completedEnrolments.filter((e: any) => !e.reviews?.length);
  const writtenReviews = reviewsRes?.data || [];

  const reviewMutation = useMutation({
    mutationFn: ({ enrolmentId, rating, comment }: { enrolmentId: string; rating: number; comment: string }) =>
      api.post(`/enrolments/${enrolmentId}/review`, { rating, comment }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: enrolmentKeys.list({ status: 'COMPLETED' }) });
      queryClient.invalidateQueries({ queryKey: reviewKeys.list() });
      toast.success('Review submitted! Thank you for your feedback.');
      setReviewTarget(null);
    },
    onError: (err: any) => toast.error(err.message || 'Failed to submit review'),
  });

  return (
    <div className="space-y-6">
      <OfflineBanner />
      <BackButton href="/trainee" label="Back to Dashboard" />
      <h1 className="text-2xl font-bold text-dark">Reviews</h1>

      <div className="flex gap-2">
        <button
          onClick={() => setTab('pending')}
          className={`px-4 py-1.5 text-sm font-medium rounded-btn transition-colors ${
            tab === 'pending' ? 'bg-primary text-white' : 'bg-white text-body hover:bg-accent border border-border'
          }`}
        >
          Pending ({pendingReviews.length})
        </button>
        <button
          onClick={() => setTab('written')}
          className={`px-4 py-1.5 text-sm font-medium rounded-btn transition-colors ${
            tab === 'written' ? 'bg-primary text-white' : 'bg-white text-body hover:bg-accent border border-border'
          }`}
        >
          Written ({writtenReviews.length})
        </button>
      </div>

      {tab === 'pending' && (
        pendingLoading ? (
          <div className="space-y-3">{[1, 2].map(i => <CardSkeleton key={i} />)}</div>
        ) : pendingError ? (
          <ErrorState message="Failed to load pending reviews" onRetry={() => refetchPending()} />
        ) : pendingReviews.length === 0 ? (
          <EmptyState
            icon={CheckCircle}
            title="All reviewed!"
            subtitle="You've reviewed all your completed courses."
          />
        ) : (
          <div className="space-y-3">
            {pendingReviews.map((e: any) => {
              const trainer = e.course?.trainer;
              const trainerName = trainer?.user?.fullName || 'Trainer';
              return (
                <div key={e.id} className="bg-white rounded-card shadow-card p-4">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                      {trainerName[0]}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="font-medium text-sm text-dark">{trainerName}</h3>
                        <StatusBadge status="COMPLETED" />
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">{e.course?.title}</p>
                      <p className="text-xs text-muted-foreground">Completed {e.updatedAt ? formatDate(e.updatedAt) : ''}</p>
                    </div>
                    <button
                      onClick={() => setReviewTarget({ enrolmentId: e.id, trainerName, courseTitle: e.course?.title })}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-primary text-white text-xs font-medium rounded-btn hover:bg-primary/90 transition-colors"
                    >
                      <Edit3 size={14} /> Write Review
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )
      )}

      {tab === 'written' && (
        writtenLoading ? (
          <div className="space-y-3">{[1, 2].map(i => <CardSkeleton key={i} />)}</div>
        ) : writtenError ? (
          <ErrorState message="Failed to load reviews" onRetry={() => refetchWritten()} />
        ) : writtenReviews.length === 0 ? (
          <EmptyState
            icon={Star}
            title="No reviews yet"
            subtitle="You haven't written any reviews yet. Complete a course and share your experience!"
            action={{ label: 'Go to Enrolments', href: '/trainee/enrolments' }}
          />
        ) : (
          <div className="space-y-3">
            {writtenReviews.map((r: any, i: number) => (
              <div key={r.id || i} className="bg-white rounded-card shadow-card p-4">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm">
                    {r.trainerName?.[0] || r.course?.trainer?.user?.fullName?.[0] || 'T'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-medium text-sm text-dark">{r.trainerName || r.course?.trainer?.user?.fullName || 'Trainer'}</h3>
                          <RatingStars rating={r.rating} size={12} />
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5">{r.courseTitle || r.course?.title}</p>
                      </div>
                      <span className="text-xs text-muted-foreground whitespace-nowrap">{r.createdAt ? formatDate(r.createdAt) : ''}</span>
                    </div>
                    {r.comment && (
                      <p className="text-sm text-body mt-2">{r.comment}</p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )
      )}

      <ReviewModal
        isOpen={!!reviewTarget}
        onClose={() => setReviewTarget(null)}
        onSubmit={(rating, comment) => {
          if (reviewTarget) {
            reviewMutation.mutate({ enrolmentId: reviewTarget.enrolmentId, rating, comment });
          }
        }}
        isPending={reviewMutation.isPending}
        trainerName={reviewTarget?.trainerName}
        courseTitle={reviewTarget?.courseTitle}
      />
    </div>
  );
}
