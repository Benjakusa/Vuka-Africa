'use client';

import { useQuery } from '@tanstack/react-query';
import { useParams } from 'next/navigation';
import { useState } from 'react';
import { Share2, Users, BookOpen, Star, MapPin, Monitor, Globe } from 'lucide-react';
import { BackButton } from '@frontend/components/shared/back-button';
import { api } from '@backend/lib/api';
import { trainerKeys, reviewKeys } from '@backend/lib/query-keys';
import { VerifiedBadge } from '@frontend/components/shared/verified-badge';
import { RatingStars } from '@frontend/components/shared/rating-stars';
import { ReviewCard } from '@frontend/components/shared/review-card';
import { CourseCard } from '@frontend/components/shared/course-card';
import { EmptyState } from '@frontend/components/shared/empty-state';
import { ErrorState } from '@frontend/components/shared/error-state';
import { ProfileSkeleton, CardSkeleton } from '@frontend/components/shared/loading-skeleton';
import { Pagination } from '@frontend/components/shared/pagination';
import { formatNumber } from '@backend/lib/utils';
import { toast } from 'sonner';

export default function TrainerProfilePage() {
  const params = useParams();
  const trainerId = params.slug as string;
  const [reviewPage, setReviewPage] = useState(1);

  const { data: trainer, isLoading, isError } = useQuery({
    queryKey: trainerKeys.detail(trainerId),
    queryFn: () => api.get<any>(`/trainers/${trainerId}`),
    enabled: !!trainerId,
  });

  const { data: reviewsData } = useQuery({
    queryKey: reviewKeys.list(trainerId, reviewPage),
    queryFn: () => api.get<any>(`/trainers/${trainerId}/reviews`, { page: reviewPage, perPage: 10 }),
    enabled: !!trainerId,
  });

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    toast.success('Profile link copied to clipboard');
  };

  if (isLoading) return <div className="max-w-4xl mx-auto px-4 py-8"><ProfileSkeleton /></div>;
  if (isError || !trainer?.data) return <div className="max-w-4xl mx-auto px-4 py-8"><ErrorState message="Trainer not found" /></div>;

  const t = trainer.data;

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <BackButton href="/trainers" label="Back to Trainers" />
      <div className="bg-white rounded-card shadow-card overflow-hidden">
        <div className="h-48 bg-gradient-to-br from-primary/10 to-primary/30" />
        <div className="px-6 pb-6 -mt-16">
          <div className="flex items-end gap-4">
            <div className="w-24 h-24 rounded-full border-4 border-white bg-primary/10 flex items-center justify-center text-primary text-3xl font-bold flex-shrink-0">
              {t.fullName?.[0]}
            </div>
            <div className="flex-1 pb-1">
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold text-dark">{t.fullName}</h1>
                <VerifiedBadge isVerified={t.isVerified} size="md" />
              </div>
            </div>
            <button onClick={handleShare} className="p-2 text-muted-foreground hover:text-dark border border-border rounded-btn">
              <Share2 size={18} />
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-x-6 gap-y-2 mt-4 text-sm text-body">
            <span className="flex items-center gap-1.5"><Users size={16} /> {t.totalStudents || 0} students</span>
            <span className="flex items-center gap-1.5"><BookOpen size={16} /> {t.courses?.length || 0} courses</span>
            <span className="flex items-center gap-1.5"><Star size={16} /> {t.averageRating?.toFixed(1)} ({t.totalReviews})</span>
          </div>
        </div>
      </div>

      {t.bio && (
        <section className="mt-6 bg-white rounded-card shadow-card p-6">
          <h2 className="text-lg font-semibold text-dark mb-2">About {t.fullName}</h2>
          <p className="text-body text-sm leading-relaxed">{t.bio}</p>
        </section>
      )}

      {t.skills && t.skills.length > 0 && (
        <section className="mt-4">
          <div className="flex flex-wrap gap-2">
            {t.skills.map((s: string) => (
              <span key={s} className="px-3 py-1 bg-primary/10 text-primary text-sm rounded-full font-medium">{s}</span>
            ))}
          </div>
        </section>
      )}

      <section className="mt-8">
        <h2 className="text-lg md:text-xl font-semibold text-dark mb-4">Courses</h2>
        {t.courses?.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {t.courses.map((c: any) => (
              <CourseCard
                key={c.id}
                id={c.id}
                title={c.title}
                slug={c.slug}
                mode={c.mode}
                duration={c.duration}
                sessionCount={c.sessionCount}
                priceKes={Number(c.priceKes)}
                imageUrl={c.imageUrl}
              />
            ))}
          </div>
        ) : (
          <EmptyState icon={BookOpen} title="No courses yet" subtitle="This trainer hasn't published any courses yet." />
        )}
      </section>

      <section className="mt-8">
        <h2 className="text-lg md:text-xl font-semibold text-dark mb-4">Reviews</h2>
        {reviewsData?.data?.length > 0 ? (
          <>
            <div className="flex items-center gap-4 mb-6 p-4 bg-accent rounded-card">
              <div className="text-center">
                <p className="text-3xl font-bold text-dark">{t.averageRating?.toFixed(1)}</p>
                <RatingStars rating={t.averageRating} size={16} />
                <p className="text-xs text-muted-foreground mt-1">{t.totalReviews} reviews</p>
              </div>
              {reviewsData.ratingBreakdown && (
                <div className="flex-1 space-y-1">
                  {[5, 4, 3, 2, 1].map((star) => {
                    const count = reviewsData.ratingBreakdown[star] || 0;
                    const pct = t.totalReviews > 0 ? (count / t.totalReviews) * 100 : 0;
                    return (
                      <div key={star} className="flex items-center gap-2 text-xs">
                        <span className="w-8 text-right">{star}★</span>
                        <div className="flex-1 h-2 bg-gray-200 rounded-full">
                          <div className="h-2 bg-yellow-400 rounded-full" style={{ width: `${pct}%` }} />
                        </div>
                        <span className="w-8 text-muted-foreground">{count}</span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
            <div className="space-y-3">
              {reviewsData.data.map((r: any) => (
                <ReviewCard
                  key={r.id}
                  traineeName={r.trainee?.fullName || 'Anonymous'}
                  avatarUrl={r.trainee?.avatarUrl}
                  rating={r.rating}
                  comment={r.comment}
                  createdAt={r.createdAt}
                />
              ))}
            </div>
            {reviewsData.meta && (
              <Pagination
                page={reviewsData.meta.page}
                totalPages={reviewsData.meta.totalPages}
                total={reviewsData.meta.total}
              />
            )}
          </>
        ) : (
          <EmptyState icon={Star} title="No reviews yet" subtitle="Be the first to leave a review!" />
        )}
      </section>
    </div>
  );
}
