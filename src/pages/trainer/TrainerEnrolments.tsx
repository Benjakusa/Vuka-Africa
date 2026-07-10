import { useQuery } from '@tanstack/react-query';
import { useSearchParams } from 'react-router-dom';
import { BookOpen } from 'lucide-react';
import { useAuthStore } from '@/stores/auth-store';
import { getEnrolments } from '@/services/enrolmentService';
import { enrolmentKeys } from '@/lib/query-keys';
import { EnrolmentCard } from '@/components/shared/enrolment-card';
import { EmptyState } from '@/components/shared/empty-state';
import { ErrorState } from '@/components/shared/error-state';
import { CardSkeleton } from '@/components/shared/loading-skeleton';

const TABS = [
  { label: 'All', value: '' },
  { label: 'Active', value: 'ACTIVE' },
  { label: 'Completed', value: 'COMPLETED' },
  { label: 'Cancelled', value: 'CANCELLED' },
];

export default function TrainerEnrolments() {
  const { user } = useAuthStore();
  const trainerId = user?.trainer?.id;
  const [searchParams, setSearchParams] = useSearchParams();
  const status = searchParams.get('status') || '';

  const {
    data: enrolments,
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: enrolmentKeys.list({ trainerId, status: status || undefined }),
    queryFn: () => getEnrolments({ trainerId, status: status || undefined }),
    enabled: !!trainerId,
  });

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-dark">Student Enrolments</h1>
        <p className="text-body text-sm">Manage your students and their progress</p>
      </div>

      <div className="flex gap-1 mb-6 bg-white rounded-card p-1 shadow-card">
        {TABS.map((tab) => (
          <button
            key={tab.value}
            onClick={() => {
              const params = new URLSearchParams(searchParams);
              if (tab.value) params.set('status', tab.value);
              else params.delete('status');
              params.delete('page');
              setSearchParams(params, { replace: true });
            }}
            className={`flex-1 py-2 text-sm font-medium rounded-btn transition-colors ${
              status === tab.value ? 'bg-primary text-white' : 'text-body-foreground hover:text-dark'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <CardSkeleton key={i} />
          ))}
        </div>
      ) : isError ? (
        <ErrorState message="Failed to load enrolments" onRetry={() => refetch()} />
      ) : !enrolments || enrolments.length === 0 ? (
        <EmptyState
          icon={BookOpen}
          title="No enrolments yet"
          subtitle={status ? `No ${status.toLowerCase()} enrolments` : 'Students will appear once they enrol'}
          action={{ label: 'My Courses', href: '/trainer/courses' }}
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {enrolments.map((enrolment: any) => (
            <EnrolmentCard key={enrolment.id} enrolment={enrolment} role="trainer" showPrice />
          ))}
        </div>
      )}
    </div>
  );
}
