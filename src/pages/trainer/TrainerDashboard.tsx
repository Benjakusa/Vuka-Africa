import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { BookOpen, Users, Wallet, Star, ArrowRight, AlertTriangle, Bell, UserPlus, Play } from 'lucide-react';
import { useAuthStore } from '@/stores/auth-store';
import { getTrainerCourses } from '@/services/courseService';
import { getEnrolments } from '@/services/enrolmentService';
import { getTrainerDashboardStats, getTrainerReviews } from '@/services/trainerService';
import { courseKeys, enrolmentKeys, trainerKeys } from '@/lib/query-keys';
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

  const { data: enrolmentsRaw } = useQuery({
    queryKey: enrolmentKeys.list({ trainerId, limit: 50 }),
    queryFn: () => getEnrolments({ trainerId, limit: 50 }),
    enabled: !!trainerId,
  });
  const enrolments = (enrolmentsRaw || []) as any[];

  const { data: stats } = useQuery({
    queryKey: trainerKeys.stats(trainerId),
    queryFn: () => getTrainerDashboardStats(trainerId!),
    enabled: !!trainerId,
  });

  const { data: reviewsData } = useQuery({
    queryKey: trainerKeys.trainerReviews(trainerId),
    queryFn: () => getTrainerReviews(trainerId!, 1, 5),
    enabled: !!trainerId,
  });

  const pendingEnrolments = enrolments.filter((e: any) => e.status === 'PENDING_ACCEPTANCE');
  const activeEnrolments = enrolments.filter((e: any) => e.status === 'ACTIVE');
  const activeSessions = Number(stats?.active_sessions_count) || 0;
  const settledEarnings = Number(stats?.settled_earnings) || 0;
  const pendingEarnings = Number(stats?.pending_earnings) || 0;
  const totalEarnings = settledEarnings + pendingEarnings;

  const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  const newEnrolments = enrolments.filter((e: any) => e.status === 'PENDING_ACCEPTANCE' && e.createdAt >= oneDayAgo);
  const recentReviews = reviewsData?.data || [];
  const needsVerification = user?.trainer && !user.trainer.isVerified && user.trainer.verificationStatus !== 'PENDING';

  return (
    <div className="max-w-5xl mx-auto">
      <OfflineBanner />

      {needsVerification && (
        <div className="flex items-center gap-3 px-4 py-3 bg-surface border border-border rounded-card mb-4">
          <AlertTriangle size={18} className="text-body" />
          <p className="text-sm text-body flex-1">Complete your verification to get more students.</p>
          <Link to="/trainer/verification" className="text-sm font-medium text-primary hover:underline">
            Verify Now
          </Link>
        </div>
      )}

      <div className="mb-6">
        <h1 className="text-2xl font-bold text-dark">Welcome, {user?.fullName || 'Trainer'}</h1>
        <p className="text-body text-sm">Manage your training business</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
        <StatCard
          icon={BookOpen}
          label="Courses"
          value={courses?.length || 0}
          iconBg="bg-surface"
          iconColor="text-foreground"
        />
        <StatCard
          icon={Users}
          label="Active Students"
          value={activeEnrolments.length}
          iconBg="bg-surface"
          iconColor="text-foreground"
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
          iconBg="bg-surface"
          iconColor="text-body"
        />
        <StatCard
          icon={Play}
          label="Active Sessions"
          value={activeSessions}
          iconBg="bg-surface"
          iconColor="text-foreground"
        />
      </div>

      {pendingEnrolments.length > 0 && (
        <section className="mb-6">
          <div className="flex items-center gap-2 mb-3">
            <Bell size={16} className="text-primary" />
            <h2 className="text-lg font-bold text-dark">Pending Review</h2>
            <span className="px-2 py-0.5 bg-surface text-body text-xs font-semibold rounded-full">
              {pendingEnrolments.length} pending
            </span>
          </div>
          <div className="bg-white rounded-card shadow-card divide-y divide-border">
            {pendingEnrolments.slice(0, 10).map((enrolment: any) => (
              <Link
                key={enrolment.id}
                to={`/trainer/enrolments/${enrolment.id}`}
                className="flex items-center gap-3 p-3 hover:bg-accent transition-colors"
              >
                <div className="w-9 h-9 rounded-full bg-surface flex items-center justify-center flex-shrink-0">
                  <UserPlus size={16} className="text-body" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-dark">
                    <span className="font-semibold">{enrolment.trainee?.fullName}</span> wants to join{' '}
                    <span className="font-semibold">{enrolment.course?.title}</span>
                  </p>
                  <p className="text-xs text-body-foreground">{formatDate(enrolment.createdAt)}</p>
                </div>
                <span className="px-2.5 py-0.5 bg-surface text-body text-xs font-medium rounded-full">REVIEW</span>
              </Link>
            ))}
          </div>
        </section>
      )}

      {newEnrolments.length > 0 && (
        <section className="mb-6">
          <div className="flex items-center gap-2 mb-3">
            <Bell size={16} className="text-primary" />
            <h2 className="text-lg font-bold text-dark">New Enrolments</h2>
            <span className="px-2 py-0.5 bg-surface text-primary text-xs font-semibold rounded-full">
              {newEnrolments.length} new
            </span>
          </div>
          <div className="bg-white rounded-card shadow-card divide-y divide-border">
            {newEnrolments.slice(0, 5).map((enrolment: any) => (
              <Link
                key={enrolment.id}
                to={`/trainer/enrolments/${enrolment.id}`}
                className="flex items-center gap-3 p-3 hover:bg-accent transition-colors"
              >
                <div className="w-9 h-9 rounded-full bg-surface flex items-center justify-center flex-shrink-0">
                  <UserPlus size={16} className="text-foreground" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-dark">
                    <span className="font-semibold">{enrolment.trainee?.fullName}</span> enrolled in{' '}
                    <span className="font-semibold">{enrolment.course?.title}</span>
                  </p>
                  <p className="text-xs text-body-foreground">{formatDate(enrolment.createdAt)}</p>
                </div>
                <span className="px-2 py-0.5 bg-surface text-foreground text-xs font-medium rounded-full">NEW</span>
              </Link>
            ))}
          </div>
        </section>
      )}

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
            <p className="text-sm text-body-foreground py-8 text-center">No active enrolments yet</p>
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
                    <p className="text-xs text-body-foreground">{enrolment.trainee?.fullName}</p>
                  </div>
                  <span className="text-xs text-body-foreground">{formatDate(enrolment.createdAt)}</span>
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
            <p className="text-sm text-body-foreground py-8 text-center">No reviews yet</p>
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
