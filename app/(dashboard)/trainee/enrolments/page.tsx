'use client';

import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import { api } from '@backend/lib/api';
import { enrolmentKeys } from '@backend/lib/query-keys';
import { EmptyState } from '@frontend/components/shared/empty-state';
import { CardSkeleton } from '@frontend/components/shared/loading-skeleton';
import { formatCurrency } from '@backend/lib/utils';
import { BookOpen } from 'lucide-react';
import { BackButton } from '@frontend/components/shared/back-button';

function EnrolmentsList() {
  const searchParams = useSearchParams();
  const status = searchParams.get('status') || undefined;

  const { data, isLoading } = useQuery({
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

  if (enrolments.length === 0) {
    return (
      <EmptyState
        icon={BookOpen}
        title="No enrolments found"
        subtitle={status ? `No ${status.toLowerCase()} enrolments` : 'Start learning by browsing trainers'}
        action={{ label: 'Browse Trainers', href: '/trainers' }}
      />
    );
  }

  return (
    <div className="space-y-3">
      {enrolments.map((e: any) => {
        const released = e.milestones?.filter((m: any) => m.status === 'RELEASED').length || 0;
        return (
          <Link key={e.id} href={`/dashboard/trainee/enrolments/${e.id}`} className="block bg-white rounded-card shadow-card p-4 hover:shadow-cardHover transition-shadow">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                  {e.course?.title?.[0]}
                </div>
                <div>
                  <h3 className="font-medium text-sm text-dark">{e.course?.title}</h3>
                  <p className="text-xs text-muted-foreground">
                    {e.status === 'ACTIVE' ? `Milestone ${released}/3 released` :
                     e.status === 'COMPLETED' ? 'Completed' :
                     e.status === 'CANCELLED' ? 'Cancelled' : e.status}
                  </p>
                </div>
              </div>
              <span className="text-sm font-semibold text-dark">{formatCurrency(e.pricePaidKes)}</span>
            </div>
          </Link>
        );
      })}
    </div>
  );
}

export default function EnrolmentsPage() {
  return (
    <div className="space-y-4">
      <BackButton href="/dashboard/trainee" label="Back to Dashboard" />
      <h1 className="text-2xl font-bold text-dark">My Enrolments</h1>
      <div className="flex gap-2">
        {[
          { label: 'All', value: '' },
          { label: 'Active', value: 'ACTIVE' },
          { label: 'Completed', value: 'COMPLETED' },
          { label: 'Cancelled', value: 'CANCELLED' },
        ].map((tab) => (
          <Link
            key={tab.value}
            href={`/dashboard/trainee/enrolments${tab.value ? `?status=${tab.value}` : ''}`}
            className={`px-3 py-1.5 text-sm font-medium rounded-btn transition-colors ${
              (typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('status') === tab.value) ||
              (!tab.value && !new URLSearchParams(window.location.search).get('status'))
                ? 'bg-primary text-white'
                : 'bg-accent text-body hover:bg-accent/80'
            }`}
          >
            {tab.label}
          </Link>
        ))}
      </div>
      <Suspense fallback={<div className="space-y-3">{[1,2,3].map(i => <CardSkeleton key={i} />)}</div>}>
        <EnrolmentsList />
      </Suspense>
    </div>
  );
}
