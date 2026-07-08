import { useQuery } from '@tanstack/react-query';
import { useNavigate, Link } from 'react-router-dom';
import { BookOpen, CheckCircle, Wallet, Star, ArrowRight } from 'lucide-react';
import { useAuthStore } from '@/stores/auth-store';
import { getEnrolments } from '@/services/enrolmentService';
import { enrolmentKeys } from '@/lib/query-keys';
import { OfflineBanner } from '@/components/shared/offline-banner';
import { StatCard } from '@/components/shared/stat-card';
import { EnrolmentCard } from '@/components/shared/enrolment-card';
import { CardSkeleton } from '@/components/shared/loading-skeleton';
import { formatCurrency } from '@/lib/utils';

export default function TraineeDashboard() {
  const { user } = useAuthStore();
  const navigate = useNavigate();

  const { data: enrolments, isLoading } = useQuery({
    queryKey: enrolmentKeys.list({ traineeId: user?.id }),
    queryFn: () => getEnrolments({ traineeId: user?.id }),
    enabled: !!user?.id,
  });

  const activeEnrolments = enrolments?.filter((e: any) => e.status === 'ACTIVE') || [];
  const completedEnrolments = enrolments?.filter((e: any) => e.status === 'COMPLETED') || [];
  const totalSpent = enrolments?.reduce((sum: number, e: any) => sum + (e.pricePaidKes || 0), 0) || 0;
  const pendingReviews =
    enrolments?.filter((e: any) => e.status === 'COMPLETED' && (!e.reviews || e.reviews.length === 0)) || [];

  return (
    <div className="max-w-5xl mx-auto">
      <OfflineBanner />

      <div className="mb-6">
        <h1 className="text-2xl font-bold text-dark">Welcome, {user?.fullName || 'Trainee'}</h1>
        <p className="text-body text-sm">Track your learning progress</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard
          icon={BookOpen}
          label="Active Trainings"
          value={activeEnrolments.length}
          iconBg="bg-blue-50"
          iconColor="text-blue-600"
        />
        <StatCard
          icon={CheckCircle}
          label="Completed"
          value={completedEnrolments.length}
          iconBg="bg-green-50"
          iconColor="text-green-600"
        />
        <StatCard
          icon={Wallet}
          label="Total Spent"
          value={formatCurrency(totalSpent)}
          iconBg="bg-purple-50"
          iconColor="text-purple-600"
        />
        <StatCard
          icon={Star}
          label="Pending Reviews"
          value={pendingReviews.length}
          iconBg="bg-yellow-50"
          iconColor="text-yellow-600"
        />
      </div>

      {activeEnrolments.length > 0 && (
        <section className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-dark">Continue Learning</h2>
            <Link to="/trainee/enrolments" className="text-sm text-primary hover:underline flex items-center gap-1">
              View all <ArrowRight size={14} />
            </Link>
          </div>
          {isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {Array.from({ length: 2 }).map((_, i) => (
                <CardSkeleton key={i} />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {activeEnrolments.slice(0, 4).map((enrolment: any) => (
                <EnrolmentCard key={enrolment.id} enrolment={enrolment} role="trainee" />
              ))}
            </div>
          )}
        </section>
      )}

      {pendingReviews.length > 0 && (
        <section className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-dark">Pending Reviews</h2>
            <Link to="/trainee/reviews" className="text-sm text-primary hover:underline flex items-center gap-1">
              Review now <ArrowRight size={14} />
            </Link>
          </div>
          <div className="bg-white rounded-card shadow-card divide-y divide-border">
            {pendingReviews.slice(0, 3).map((enrolment: any) => (
              <div key={enrolment.id} className="p-4 flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-dark">{enrolment.course?.title}</p>
                  <p className="text-xs text-muted-foreground">Trainer: {enrolment.trainer?.fullName}</p>
                </div>
                <button
                  onClick={() => navigate(`/trainee/enrolments/${enrolment.id}`)}
                  className="px-3 py-1.5 bg-primary text-white text-xs font-medium rounded-btn hover:bg-primary/90"
                >
                  Write Review
                </button>
              </div>
            ))}
          </div>
        </section>
      )}

      <div className="text-center py-8">
        <Link
          to="/trainers"
          className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-white font-medium rounded-btn hover:bg-primary/90 transition-colors"
        >
          Browse Trainers <ArrowRight size={18} />
        </Link>
      </div>
    </div>
  );
}
