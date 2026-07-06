'use client';

import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { Star, ThumbsUp, Flag, ArrowUp, ArrowDown } from 'lucide-react';
import { BackButton } from '@frontend/components/shared/back-button';
import { api } from '@backend/lib/api';
import { RatingStars } from '@frontend/components/shared/rating-stars';
import { EmptyState } from '@frontend/components/shared/empty-state';
import { ErrorState } from '@frontend/components/shared/error-state';
import { CardSkeleton } from '@frontend/components/shared/loading-skeleton';
import { Pagination } from '@frontend/components/shared/pagination';
import { OfflineBanner } from '@frontend/components/shared/offline-banner';
import { formatDate } from '@backend/lib/utils';
import { toast } from 'sonner';

export default function TrainerReviewsPage() {
  const [page, setPage] = useState(1);
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'highest' | 'lowest'>('newest');

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['trainer-reviews', page, sortBy],
    queryFn: () => api.get<any>('/trainers/me/reviews', { page, perPage: 20, sort: sortBy }),
  });

  const reviews = data?.data?.data || [];
  const meta = data?.data?.meta;
  const ratingSummary = data?.data?.summary;

  const breakdownTotal = ratingSummary?.total || reviews.length;
  const breakdowns = [
    { stars: 5, count: ratingSummary?.['5'] || 0, color: 'bg-primary' },
    { stars: 4, count: ratingSummary?.['4'] || 0, color: 'bg-primary/80' },
    { stars: 3, count: ratingSummary?.['3'] || 0, color: 'bg-primary/60' },
    { stars: 2, count: ratingSummary?.['2'] || 0, color: 'bg-warning' },
    { stars: 1, count: ratingSummary?.['1'] || 0, color: 'bg-destructive/60' },
  ];

  return (
    <div className="space-y-6">
      <OfflineBanner />
      <BackButton href="/trainer" label="Back to Dashboard" />
      <h1 className="text-2xl font-bold text-dark">Reviews</h1>

      <div className="bg-white rounded-card shadow-card p-6">
        <div className="flex flex-col sm:flex-row items-center gap-6">
          <div className="text-center">
            <div className="flex items-center gap-1 justify-center">
              <Star size={32} className="text-primary fill-primary" />
              <span className="text-4xl font-bold text-dark">{ratingSummary?.average?.toFixed(1) || '0.0'}</span>
            </div>
            <p className="text-sm text-muted-foreground mt-1">{ratingSummary?.total || 0} reviews</p>
          </div>
          <div className="flex-1 w-full space-y-1.5">
            {breakdowns.map((b) => {
              const pct = breakdownTotal > 0 ? Math.round((b.count / breakdownTotal) * 100) : 0;
              return (
                <div key={b.stars} className="flex items-center gap-2 text-sm">
                  <span className="text-muted-foreground w-4 text-right">{b.stars}</span>
                  <Star size={12} className="text-primary fill-primary" />
                  <div className="flex-1 h-2.5 bg-accent rounded-full overflow-hidden">
                    <div className={`h-full ${b.color} rounded-full transition-all`} style={{ width: `${pct}%` }} />
                  </div>
                  <span className="text-xs text-muted-foreground w-8 text-right">{b.count}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">{meta?.total || reviews.length} reviews</p>
        <div className="flex items-center gap-1">
          {[ 
            { value: 'newest', label: 'Newest' },
            { value: 'oldest', label: 'Oldest' },
            { value: 'highest', label: 'Highest' },
            { value: 'lowest', label: 'Lowest' },
          ].map((opt) => (
            <button
              key={opt.value}
              onClick={() => setSortBy(opt.value as any)}
              className={`px-2.5 py-1 text-xs font-medium rounded-btn transition-colors ${
                sortBy === opt.value ? 'bg-primary text-white' : 'bg-white text-body border border-border hover:bg-accent'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-3">{[1, 2, 3].map(i => <CardSkeleton key={i} />)}</div>
      ) : isError ? (
        <ErrorState message="Failed to load reviews" onRetry={() => refetch()} />
      ) : reviews.length === 0 ? (
        <EmptyState
          icon={Star}
          title="No reviews yet"
          subtitle="Complete some trainings and your trainees can leave feedback!"
        />
      ) : (
        <div className="space-y-3">
          {reviews.map((r: any, i: number) => (
            <div key={r.id || i} className="bg-white rounded-card shadow-card p-4">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm">
                  {r.traineeName?.[0] || r.trainee?.fullName?.[0] || '?'}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-medium text-sm text-dark">{r.traineeName || r.trainee?.fullName || 'Trainee'}</h3>
                        <RatingStars rating={r.rating} size={12} />
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">{r.courseTitle || r.course?.title}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground whitespace-nowrap">{r.createdAt ? formatDate(r.createdAt) : ''}</span>
                      <button
                        onClick={() => toast.success('Review reported. Our team will review it.')}
                        className="p-1 text-muted-foreground hover:text-destructive transition-colors"
                        title="Report this review"
                      >
                        <Flag size={14} />
                      </button>
                    </div>
                  </div>
                  {r.comment && (
                    <p className="text-sm text-body mt-2">{r.comment}</p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {meta && (
        <Pagination page={meta.page || page} totalPages={meta.totalPages || 1} total={meta.total || 0} />
      )}
    </div>
  );
}
