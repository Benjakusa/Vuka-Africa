'use client';

import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { useState } from 'react';
import { ArrowRight } from 'lucide-react';
import { BackButton } from '@frontend/components/shared/back-button';
import { api } from '@backend/lib/api';
import { EmptyState } from '@frontend/components/shared/empty-state';
import { CardSkeleton } from '@frontend/components/shared/loading-skeleton';
import { formatCurrency, formatDateTime } from '@backend/lib/utils';

const TABS = ['ALL', 'PENDING', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'] as const;

export default function TrainerEnrolmentsPage() {
  const [tab, setTab] = useState<string>('ALL');

  const { data, isLoading } = useQuery({
    queryKey: ['trainer-enrolments', tab],
    queryFn: () => api.get<any>('/enrolments', { status: tab !== 'ALL' ? tab : undefined, page: 1, perPage: 50 }),
  });

  const enrolments = data?.data?.data || [];

  return (
    <div className="space-y-6">
      <BackButton href="/dashboard/trainer" label="Back to Dashboard" />
      <h1 className="text-2xl font-bold text-dark">Enrolments</h1>

      <div className="flex gap-2 overflow-x-auto pb-2">
        {TABS.map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-4 py-1.5 text-sm font-medium rounded-btn whitespace-nowrap transition-colors ${
              tab === t ? 'bg-primary text-white' : 'bg-white text-body hover:bg-accent border border-border'
            }`}>
            {t === 'ALL' ? 'All' : t.split('_').map(w => w.charAt(0) + w.slice(1).toLowerCase()).join(' ')}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="space-y-3">{[1, 2, 3].map(i => <CardSkeleton key={i} />)}</div>
      ) : enrolments.length === 0 ? (
        <EmptyState title="No enrolments found" subtitle="Students will appear here when they enrol" />
      ) : (
        <div className="space-y-3">
          {enrolments.map((e: any) => (
            <Link key={e.id} href={`/dashboard/trainer/enrolments/${e.id}`}
              className="block bg-white rounded-card shadow-card p-4 hover:shadow-cardHover transition-shadow">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm">
                  {e.trainee?.fullName?.[0] || '?'}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-dark truncate">{e.trainee?.fullName}</p>
                  <p className="text-xs text-muted-foreground truncate">{e.course?.title}</p>
                  <p className="text-xs text-muted-foreground">{formatDateTime(e.createdAt)}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-dark">{formatCurrency(e.totalPaid || 0)}</p>
                  <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${
                    e.status === 'COMPLETED' ? 'bg-green-100 text-green-700' :
                    e.status === 'IN_PROGRESS' ? 'bg-blue-100 text-blue-700' :
                    e.status === 'PENDING' ? 'bg-yellow-100 text-yellow-700' :
                    'bg-accent text-muted-foreground'
                  }`}>
                    {e.status === 'IN_PROGRESS' ? 'In Progress' : e.status.charAt(0) + e.status.slice(1).toLowerCase()}
                  </span>
                </div>
                <ArrowRight size={16} className="text-muted-foreground flex-shrink-0" />
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
