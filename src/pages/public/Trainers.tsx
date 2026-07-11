import { useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Suspense } from 'react';
import { getTrainers } from '@/services/trainerService';
import { trainerKeys } from '@/lib/query-keys';
import { FilterBar } from '@/components/shared/filter-bar';
import { TrainerCard } from '@/components/shared/trainer-card';
import { EmptyState } from '@/components/shared/empty-state';
import { ErrorState } from '@/components/shared/error-state';
import { CardSkeleton } from '@/components/shared/loading-skeleton';
import { Pagination } from '@/components/shared/pagination';
import { Search } from 'lucide-react';
import { BackButton } from '@/components/shared/back-button';

const PER_PAGE = 12;

function TrainerListing() {
  const [searchParams] = useSearchParams();

  const filters = {
    search: searchParams.get('search') || undefined,
    category: searchParams.get('category') || undefined,
    mode: searchParams.get('mode') || undefined,
    verifiedOnly: searchParams.get('verifiedOnly') === 'true' ? true : undefined,
    sortBy: searchParams.get('sortBy') || 'averageRating',
  };
  const page = Math.max(1, Number(searchParams.get('page')) || 1);

  const {
    data: result,
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: [...trainerKeys.list(filters as any), page],
    queryFn: () => getTrainers(filters as any, page, PER_PAGE),
  });

  const trainers = result?.data;
  const totalPages = Math.ceil((result?.total || 0) / PER_PAGE);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <BackButton href="/" />
      <h1 className="text-2xl md:text-3xl font-bold text-dark mb-2">Find Your Trainer</h1>
      <p className="text-body mb-6">Browse vetted trainers and learn practical skills.</p>

      <FilterBar />

      <div className="mt-8">
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <CardSkeleton key={i} />
            ))}
          </div>
        ) : isError ? (
          <ErrorState message="Failed to load trainers" onRetry={() => refetch()} />
        ) : !trainers || trainers.length === 0 ? (
          <EmptyState
            icon={Search}
            title="No trainers found"
            subtitle="Try adjusting your search filters"
            action={{ label: 'Clear Filters', onClick: () => window.history.pushState({}, '', '/trainers') }}
          />
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {trainers.map((trainer: any) => {
                const user = trainer.user || {};
                return (
                  <TrainerCard
                    key={trainer.id}
                    id={trainer.id}
                    fullName={user.fullName || 'Trainer'}
                    isVerified={trainer.isVerified}
                    averageRating={trainer.averageRating}
                    totalReviews={trainer.totalReviews}
                    bio={trainer.bio}
                    skills={trainer.skills}
                    courses={trainer.courses}
                    user={user}
                  />
                );
              })}
            </div>
            <Pagination page={page} totalPages={totalPages} total={result?.total || 0} />
          </>
        )}
      </div>
    </div>
  );
}

export default function TrainersPage() {
  return (
    <Suspense
      fallback={
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <CardSkeleton key={i} />
            ))}
          </div>
        </div>
      }
    >
      <TrainerListing />
    </Suspense>
  );
}
