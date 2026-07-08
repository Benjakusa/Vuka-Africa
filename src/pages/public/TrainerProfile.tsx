import { useQuery } from '@tanstack/react-query';
import { useParams } from 'react-router-dom';
import { useState } from 'react';
import { Share2, Users, BookOpen, Star } from 'lucide-react';
import { BackButton } from '@/components/shared/back-button';
import { getTrainer } from '@/services/trainerService';
import { getTrainerReviews } from '@/services/trainerService';
import { trainerKeys, reviewKeys } from '@/lib/query-keys';
import { VerifiedBadge } from '@/components/shared/verified-badge';
import { RatingStars } from '@/components/shared/rating-stars';
import { ReviewCard } from '@/components/shared/review-card';
import { CourseCard } from '@/components/shared/course-card';
import { EmptyState } from '@/components/shared/empty-state';
import { ErrorState } from '@/components/shared/error-state';
import { ProfileSkeleton, CardSkeleton } from '@/components/shared/loading-skeleton';
import { Pagination } from '@/components/shared/pagination';
import { toast } from 'sonner';

export default function TrainerProfile() {
  const { slug: trainerId } = useParams<{ slug: string }>();
  const [reviewPage, setReviewPage] = useState(1);

  const {
    data: trainerRes,
    isLoading,
    isError,
  } = useQuery({
    queryKey: trainerKeys.detail(trainerId!),
    queryFn: () => getTrainer(trainerId!),
    enabled: !!trainerId,
  });

  const { data: reviewsData } = useQuery({
    queryKey: reviewKeys.list(trainerId!, reviewPage),
    queryFn: () => getTrainerReviews(trainerId!, reviewPage, 10),
    enabled: !!trainerId,
  });

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    toast.success('Profile link copied to clipboard');
  };

  if (isLoading)
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <ProfileSkeleton />
      </div>
    );
  if (isError || !trainerRes)
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <ErrorState message="Trainer not found" />
      </div>
    );

  const t = trainerRes;

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <BackButton href="/trainers" label="Back to Trainers" />
      <div className="bg-white rounded-card shadow-card overflow-hidden">
        <div className="h-48 bg-surface">
          {t.coverPhoto && <img src={t.coverPhoto} alt="Cover" className="w-full h-full object-cover" />}
        </div>
        <div className="px-6 pb-6 -mt-16">
          <div className="flex items-end gap-4">
            <div className="w-24 h-24 rounded-full border-4 border-white bg-primary/10 flex items-center justify-center text-primary text-3xl font-bold flex-shrink-0 overflow-hidden">
              {t.user?.avatarUrl ? (
                <img src={t.user.avatarUrl} alt={t.fullName} className="w-full h-full object-cover" />
              ) : (
                t.fullName?.[0]
              )}
            </div>
            <div className="flex-1 pb-1">
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold text-dark">{t.fullName}</h1>
                <VerifiedBadge isVerified={t.isVerified} size="md" />
              </div>
            </div>
            <button
              onClick={handleShare}
              className="p-2 text-muted-foreground hover:text-dark border border-border rounded-btn"
            >
              <Share2 size={18} />
            </button>
          </div>
          <div className="flex flex-wrap items-center gap-x-6 gap-y-2 mt-4 text-sm text-body">
            <span className="flex items-center gap-1.5">
              <Users size={16} /> {t.totalStudents || 0} students
            </span>
            <span className="flex items-center gap-1.5">
              <BookOpen size={16} /> {t.courses?.length || 0} courses
            </span>
            <span className="flex items-center gap-1.5">
              <Star size={16} /> {t.averageRating?.toFixed(1)} ({t.totalReviews})
            </span>
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
              <span key={s} className="px-3 py-1 bg-primary/10 text-primary text-sm rounded-full font-medium">
                {s}
              </span>
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
          <EmptyState
            icon={BookOpen}
            title="No courses yet"
            subtitle="This trainer hasn't published any courses yet."
          />
        )}
      </section>

      <section className="mt-8">
        <h2 className="text-lg md:text-xl font-semibold text-dark mb-4">Reviews</h2>
        {reviewsData?.data && reviewsData.data.length > 0 ? (
          <>
            <div className="flex items-center gap-4 mb-6 p-4 bg-accent rounded-card">
              <div className="text-center">
                <p className="text-3xl font-bold text-dark">{t.averageRating?.toFixed(1)}</p>
                <RatingStars rating={t.averageRating} size={16} />
                <p className="text-xs text-muted-foreground mt-1">{t.totalReviews} reviews</p>
              </div>
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
            <Pagination
              page={reviewPage}
              totalPages={Math.ceil((reviewsData.total || 0) / 10)}
              total={reviewsData.total || 0}
            />
          </>
        ) : (
          <EmptyState icon={Star} title="No reviews yet" subtitle="Be the first to leave a review!" />
        )}
      </section>
    </div>
  );
}
