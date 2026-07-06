'use client';

import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Suspense, useState } from 'react';
import { BookOpen, Search, ArrowRight } from 'lucide-react';
import { api } from '@backend/lib/api';
import { enrolmentKeys } from '@backend/lib/query-keys';
import { EnrolmentCard } from '@frontend/components/shared/enrolment-card';
import { EmptyState } from '@frontend/components/shared/empty-state';
import { ErrorState } from '@frontend/components/shared/error-state';
import { CardSkeleton } from '@frontend/components/shared/loading-skeleton';
import { OfflineBanner } from '@frontend/components/shared/offline-banner';
import { BackButton } from '@frontend/components/shared/back-button';

const TABS = [
  { label: 'All', value: '' },
  { label: 'Active', value: 'ACTIVE' },
  { label: 'Completed', value: 'COMPLETED' },
  { label: 'Cancelled', value: 'CANCELLED' },
];

function EnrolmentsList() {
  const searchParams = useSearchParams();
  const status = searchParams.get('status') || undefined;

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: enrolmentKeys.list({ status }),
    queryFn: () => api.get<any>('/enrolments', { status, page: 1, perPage: 50 }),
  });

  const enrolments = data?.data?.data || [];

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map(i => <CardSkeleton key={i} />)}
      </div>
    );
  }

  if (isError) {
    return <ErrorState message="Failed to load enrolments" onRetry={() => refetch()} />;
  }

  if (enrolments.length === 0) {
    const messages: Record<string, { title: string; subtitle: string }> = {
      ACTIVE: { title: 'No active enrolments', subtitle: 'Browse courses to start learning!' },
      COMPLETED: { title: 'No completed enrolments', subtitle: 'Keep learning to complete your courses.' },
      CANCELLED: { title: 'No cancelled enrolments', subtitle: 'You have no cancelled enrolments.' },
    };
    const msg = status ? messages[status] || { title: 'No enrolments found', subtitle: '' } : { title: 'No enrolments yet', subtitle: 'Start learning by browsing available trainers' };
    return (
      <EmptyState
        icon={BookOpen}
        title={msg.title}
        subtitle={msg.subtitle}
        action={{ label: 'Browse Trainers', href: '/trainers' }}
      />
    );
  }

  return (
    <div className="space-y-3">
      {enrolments.map((e: any) => (
        <EnrolmentCard key={e.id} enrolment={e} role="trainee" showPrice />
      ))}
    </div>
  );
}

export default function EnrolmentsPage() {
  const searchParams = useSearchParams();
  const currentStatus = searchParams.get('status') || '';

  return (
    <div className="space-y-4">
      <OfflineBanner />
      <BackButton href="/trainee" label="Back to Dashboard" />
      <h1 className="text-2xl font-bold text-dark">My Enrolments</h1>

      <div className="flex gap-2 overflow-x-auto pb-1">
        {TABS.map((tab) => (
          <Link
            key={tab.label}
            href={`/trainee/enrolments${tab.value ? `?status=${tab.value}` : ''}`}
            className={`px-4 py-1.5 text-sm font-medium rounded-btn whitespace-nowrap transition-colors ${
              currentStatus === tab.value
                ? 'bg-primary text-white'
                : 'bg-white text-body hover:bg-accent border border-border'
            }`}
          >
            {tab.label}
          </Link>
        ))}
      </div>

      <Suspense fallback={<div className="space-y-3">{[1, 2, 3].map(i => <CardSkeleton key={i} />)}</div>}>
        <EnrolmentsList />
      </Suspense>
    </div>
  );
}
