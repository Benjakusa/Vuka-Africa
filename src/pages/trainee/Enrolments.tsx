import { useQuery } from '@tanstack/react-query';
import { useSearchParams } from 'react-router-dom';
import { BookOpen, ChevronLeft, ChevronRight } from 'lucide-react';
import { useAuthStore } from '@/stores/auth-store';
import { getEnrolments } from '@/services/enrolmentService';
import { enrolmentKeys } from '@/lib/query-keys';
import { EnrolmentCard } from '@/components/shared/enrolment-card';
import { EmptyState } from '@/components/shared/empty-state';
import { ErrorState } from '@/components/shared/error-state';
import { CardSkeleton } from '@/components/shared/loading-skeleton';

const PER_PAGE = 20;

const TABS = [
  { label: 'All', value: '' },
  { label: 'Active', value: 'ACTIVE' },
  { label: 'Completed', value: 'COMPLETED' },
  { label: 'Cancelled', value: 'CANCELLED' },
];

export default function Enrolments() {
  const { user } = useAuthStore();
  const [searchParams, setSearchParams] = useSearchParams();
  const status = searchParams.get('status') || '';
  const page = Number(searchParams.get('page') || '1');

  const {
    data: result,
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: enrolmentKeys.list({ traineeId: user?.id, status: status || undefined, page }),
    queryFn: () => getEnrolments({ traineeId: user?.id, status: status || undefined, page, perPage: PER_PAGE }),
    enabled: !!user?.id,
  });

  const enrolments = (result as any)?.data ?? (Array.isArray(result) ? result : []);
  const total = (result as any)?.total ?? enrolments.length;
  const totalPages = Math.ceil(total / PER_PAGE);

  const setPage = (p: number) => {
    const params = new URLSearchParams(searchParams);
    params.set('page', String(p));
    setSearchParams(params, { replace: true });
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-dark">My Enrolments</h1>
        <p className="text-body text-sm">Track your learning journey</p>
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
          title="No enrolments found"
          subtitle={status ? `No ${status.toLowerCase()} enrolments yet` : 'Start learning by browsing trainers'}
          action={{ label: 'Browse Trainers', href: '/trainers' }}
        />
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {enrolments.map((enrolment: any) => (
              <EnrolmentCard key={enrolment.id} enrolment={enrolment} role="trainee" showPrice />
            ))}
          </div>
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-3 mt-6">
              <button
                onClick={() => setPage(page - 1)}
                disabled={page <= 1}
                className="p-2 rounded-btn border border-border text-body-foreground hover:bg-accent disabled:opacity-40"
                aria-label="Previous page"
              >
                <ChevronLeft size={16} />
              </button>
              <span className="text-sm text-body">
                Page {page} of {totalPages}
              </span>
              <button
                onClick={() => setPage(page + 1)}
                disabled={page >= totalPages}
                className="p-2 rounded-btn border border-border text-body-foreground hover:bg-accent disabled:opacity-40"
                aria-label="Next page"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
