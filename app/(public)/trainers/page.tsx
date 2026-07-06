'use client';

import { useSearchParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { Suspense } from 'react';
import { api } from '@backend/lib/api';
import { trainerKeys } from '@backend/lib/query-keys';
import { FilterBar } from '@frontend/components/shared/filter-bar';
import { TrainerCard } from '@frontend/components/shared/trainer-card';
import { Pagination } from '@frontend/components/shared/pagination';
import { EmptyState } from '@frontend/components/shared/empty-state';
import { ErrorState } from '@frontend/components/shared/error-state';
import { CardSkeleton } from '@frontend/components/shared/loading-skeleton';
import { Search } from 'lucide-react';
import { BackButton } from '@frontend/components/shared/back-button';

function TrainerListing() {
  const searchParams = useSearchParams();

  const filters = {
    search: searchParams.get('search') || undefined,
    category: searchParams.get('category') || undefined,
    mode: searchParams.get('mode') || undefined,
    minPrice: searchParams.get('minPrice') ? Number(searchParams.get('minPrice')) : undefined,
    maxPrice: searchParams.get('maxPrice') ? Number(searchParams.get('maxPrice')) : undefined,
    verifiedOnly: searchParams.get('verifiedOnly') === 'true' ? true : undefined,
    sortBy: searchParams.get('sortBy') || 'rating',
    page: Number(searchParams.get('page')) || 1,
    perPage: 20,
  };

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: trainerKeys.list(filters as any),
    queryFn: () => api.get<any>('/trainers', filters as any),
  });

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
        ) : data?.data?.length === 0 ? (
          <EmptyState
            icon={Search}
            title="No trainers found"
            subtitle="Try adjusting your search filters"
            action={{ label: 'Clear Filters', onClick: () => window.history.pushState({}, '', '/trainers') }}
          />
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {data?.data?.map((trainer: any) => (
                <TrainerCard key={trainer.id} {...trainer} />
              ))}
            </div>
            {data?.meta && (
              <Pagination
                page={data.meta.page}
                totalPages={data.meta.totalPages}
                total={data.meta.total}
              />
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default function TrainersPage() {
  return (
    <Suspense fallback={
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => <CardSkeleton key={i} />)}
        </div>
      </div>
    }>
      <TrainerListing />
    </Suspense>
  );
}
