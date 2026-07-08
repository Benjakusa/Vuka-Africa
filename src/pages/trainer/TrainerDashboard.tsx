import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { BookOpen, Users, Wallet, Star, ArrowRight, AlertTriangle } from 'lucide-react';
import { useAuthStore } from '@/stores/auth-store';
import { getTrainerCourses } from '@/services/courseService';
import { getEnrolments } from '@/services/enrolmentService';
import { getTrainerEarnings, getTrainerReviews } from '@/services/trainerService';
import { courseKeys, enrolmentKeys } from '@/lib/query-keys';
import { OfflineBanner } from '@/components/shared/offline-banner';
import { StatCard } from '@/components/shared/stat-card';
import { CardSkeleton } from '@/components/shared/loading-skeleton';
import { ReviewCard } from '@/components/shared/review-card';
import { formatCurrency, formatDate } from '@/lib/utils';

export default function TrainerDashboard() {
  const { user } = useAuthStore();
  const trainerId = user?.trainer?.id;

  const { data: courses } = useQuery({
    queryKey: courseKeys.list({ trainerId }),
    queryFn: () => getTrainerCourses(trainerId!),
    enabled: !!trainerId,
  });

  const { data: enrolments } = useQuery({
    queryKey: enrolmentKeys.list({ trainerId }),
    queryFn: () => getEnrolments({ trainerId }),
    enabled: !!trainerId,
  });

  const { data: earnings } = useQuery({
    queryKey: ['trainer', 'earnings', trainerId],
    queryFn: () => getTrainerEarnings(trainerId!),
    enabled: !!trainerId,
  });

  const { data: reviewsData } = useQuery({
    queryKey: ['trainer', 'reviews', trainerId],
    queryFn: () => getTrainerReviews(trainerId!, 1, 5),
    enabled: !!trainerId,
  });

  const activeEnrolments = enrolments?.filter((e: any) => e.status === 'ACTIVE') || [];

  const totalEarnings = earnings?.reduce((sum: number, p: any) => sum + (p.amount || 0), 0) || 0;
  const recentReviews = reviewsData?.data || [];
  const needsVerification = user?.trainer && !user.trainer.isVerified && user.trainer.verificationStatus !== 'PENDING';

  return (
    <div className="max-w-5xl mx-auto">
      <OfflineBanner />

      {needsVerification && (
        <div className="flex items-center gap-3 px-4 py-3 bg-yellow-50 border border-yellow-200 rounded-card mb-4">
          <AlertTriangle size={18} className="text-yellow-600" />
          <p className="text-sm text-yellow-700 flex-1">Complete your verification to get more students.</p>
          <Link to="/trainer/verification" className="text-sm font-medium text-primary hover:underline">
            Verify Now
          </Link>
        </div>
      )}

      <div className="mb-6">
        <h1 className="text-2xl font-bold text-dark">Welcome, {user?.fullName || 'Trainer'}</h1>
        <p className="text-body text-sm">Manage your training business</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard
          icon={BookOpen}
          label="Courses"
          value={courses?.length || 0}
          iconBg="bg-blue-50"
          iconColor="text-blue-600"
        />
        <StatCard
          icon={Users}
          label="Active Students"
          value={activeEnrolments.length}
          iconBg="bg-green-50"
          iconColor="text-green-600"
        />
        <StatCard
          icon={Wallet}
          label="Earnings"
          value={formatCurrency(totalEarnings)}
          iconBg="bg-purple-50"
          iconColor="text-purple-600"
        />
        <StatCard
          icon={Star}
          label="Rating"
          value={user?.trainer?.averageRating?.toFixed(1) || '0.0'}
          iconBg="bg-yellow-50"
          iconColor="text-yellow-600"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-dark">Recent Enrolments</h2>
            <Link to="/trainer/enrolments" className="text-sm text-primary hover:underline flex items-center gap-1">
              View all <ArrowRight size={14} />
            </Link>
          </div>
          {!enrolments ? (
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <CardSkeleton key={i} />
              ))}
            </div>
          ) : activeEnrolments.length === 0 ? (
            <p className="text-sm text-muted-foreground py-8 text-center">No active enrolments yet</p>
          ) : (
            <div className="bg-white rounded-card shadow-card divide-y divide-border">
              {activeEnrolments.slice(0, 5).map((enrolment: any) => (
                <Link
                  key={enrolment.id}
                  to={`/trainer/enrolments/${enrolment.id}`}
                  className="flex items-center justify-between p-3 hover:bg-accent transition-colors"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-dark truncate">{enrolment.course?.title}</p>
                    <p className="text-xs text-muted-foreground">{enrolment.trainee?.fullName}</p>
                  </div>
                  <span className="text-xs text-muted-foreground">{formatDate(enrolment.createdAt)}</span>
                </Link>
              ))}
            </div>
          )}
        </section>

        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-dark">Recent Reviews</h2>
            <Link to="/trainer/reviews" className="text-sm text-primary hover:underline flex items-center gap-1">
              View all <ArrowRight size={14} />
            </Link>
          </div>
          {!reviewsData ? (
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <CardSkeleton key={i} />
              ))}
            </div>
          ) : recentReviews.length === 0 ? (
            <p className="text-sm text-muted-foreground py-8 text-center">No reviews yet</p>
          ) : (
            <div className="space-y-3">
              {recentReviews.map((review: any) => (
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
          )}
        </section>
      </div>
    </div>
  );
}
