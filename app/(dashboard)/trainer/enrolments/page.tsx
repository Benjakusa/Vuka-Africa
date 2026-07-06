'use client';

import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { useState } from 'react';
import { ArrowRight, Users } from 'lucide-react';
import { BackButton } from '@frontend/components/shared/back-button';
import { api } from '@backend/lib/api';
import { StatusBadge } from '@frontend/components/shared/status-badge';
import { ProgressBar } from '@frontend/components/shared/progress-bar';
import { EmptyState } from '@frontend/components/shared/empty-state';
import { ErrorState } from '@frontend/components/shared/error-state';
import { CardSkeleton } from '@frontend/components/shared/loading-skeleton';
import { OfflineBanner } from '@frontend/components/shared/offline-banner';
import { formatCurrency, formatDate } from '@backend/lib/utils';

const TABS = ['ALL', 'ACTIVE', 'COMPLETED', 'CANCELLED'] as const;

export default function TrainerEnrolmentsPage() {
  const [tab, setTab] = useState<string>('ALL');

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['trainer-enrolments', tab],
    queryFn: () => api.get<any>('/enrolments', { status: tab !== 'ALL' ? tab : undefined, page: 1, perPage: 50 }),
  });

  const enrolments = data?.data?.data || [];

  const nextMilestoneLabel = (e: any) => {
    const milestones = e.milestones || [];
    const released = milestones.filter((m: any) => m.status === 'RELEASED').length;
    if (released < milestones.length) {
      const next = milestones[released];
      return next ? `Next: ${next.label}` : null;
    }
    return null;
  };

  return (
    <div className="space-y-6">
      <OfflineBanner />
      <BackButton href="/trainer" label="Back to Dashboard" />
      <h1 className="text-2xl font-bold text-dark">Enrolments</h1>

      <div className="flex gap-2 overflow-x-auto pb-2">
        {TABS.map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-4 py-1.5 text-sm font-medium rounded-btn whitespace-nowrap transition-colors ${
              tab === t ? 'bg-primary text-white' : 'bg-white text-body hover:bg-accent border border-border'
            }`}>
            {t === 'ALL' ? 'All' : t.charAt(0) + t.slice(1).toLowerCase()}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="space-y-3">{[1, 2, 3].map(i => <CardSkeleton key={i} />)}</div>
      ) : isError ? (
        <ErrorState message="Failed to load enrolments" onRetry={() => refetch()} />
      ) : enrolments.length === 0 ? (
        <EmptyState
          icon={Users}
          title="No enrolments yet"
          subtitle="Share your courses to attract students! They will appear here when someone enrols."
          action={{ label: 'View My Courses', href: '/trainer/courses' }}
        />
      ) : (
        <div className="space-y-3">
          {enrolments.map((e: any) => {
            const released = e.milestones?.filter((m: any) => m.status === 'RELEASED').length || 0;
            const total = e.milestones?.length || 3;
            const nextLabel = nextMilestoneLabel(e);
            return (
              <Link key={e.id} href={`/trainer/enrolments/${e.id}`}
                className="block bg-white rounded-card shadow-card p-4 hover:shadow-cardHover transition-shadow">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm">
                    {e.trainee?.fullName?.[0] || '?'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <h3 className="font-medium text-sm text-dark truncate">{e.trainee?.fullName || 'Trainee'}</h3>
                      <StatusBadge status={e.status} />
                    </div>
                    <p className="text-xs text-muted-foreground truncate mt-0.5">{e.course?.title}</p>
                    <div className="mt-2">
                      <ProgressBar value={released} max={total} showLabel />
                    </div>
                    {nextLabel && (
                      <p className="text-xs text-primary mt-1">{nextLabel}</p>
                    )}
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs text-muted-foreground">{formatDate(e.createdAt)}</span>
                      {e.pricePaidKes && (
                        <span className="text-xs font-medium text-dark">{formatCurrency(e.pricePaidKes)}</span>
                      )}
                    </div>
                  </div>
                  <ArrowRight size={16} className="text-muted-foreground flex-shrink-0 mt-2" />
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
