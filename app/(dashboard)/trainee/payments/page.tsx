'use client';

import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { Wallet, Search, Download } from 'lucide-react';
import { api } from '@backend/lib/api';
import { BackButton } from '@frontend/components/shared/back-button';
import { StatusBadge } from '@frontend/components/shared/status-badge';
import { EmptyState } from '@frontend/components/shared/empty-state';
import { ErrorState } from '@frontend/components/shared/error-state';
import { CardSkeleton } from '@frontend/components/shared/loading-skeleton';
import { Pagination } from '@frontend/components/shared/pagination';
import { OfflineBanner } from '@frontend/components/shared/offline-banner';
import { formatCurrency, formatDateTime } from '@backend/lib/utils';

export default function PaymentsPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['trainee-payments', page],
    queryFn: () => api.get<any>('/trainee/payments', { page, perPage: 20 }),
  });

  const payments = data?.data?.data || [];
  const meta = data?.data?.meta;
  const totalSpent = data?.data?.totalSpent || 0;

  return (
    <div className="space-y-6">
      <OfflineBanner />
      <BackButton href="/trainee" label="Back to Dashboard" />
      <h1 className="text-2xl font-bold text-dark">Payments</h1>

      <div className="bg-white rounded-card shadow-card p-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
            <Wallet size={24} className="text-primary" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Total Spent</p>
            <p className="text-2xl font-bold text-dark">{formatCurrency(totalSpent)}</p>
          </div>
        </div>
      </div>

      <div className="relative">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by course or trainer..."
          className="w-full pl-9 pr-3 py-2 border border-border rounded-btn text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
        />
      </div>

      {isLoading ? (
        <div className="space-y-3">{[1, 2, 3].map(i => <CardSkeleton key={i} />)}</div>
      ) : isError ? (
        <ErrorState message="Failed to load payments" onRetry={() => refetch()} />
      ) : payments.length === 0 ? (
        <EmptyState
          icon={Wallet}
          title="No payments yet"
          subtitle="Payments for your enrolments will appear here once you start learning."
          action={{ label: 'Browse Trainers', href: '/trainers' }}
        />
      ) : (
        <div className="bg-white rounded-card shadow-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Date</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Description</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Trainer</th>
                  <th className="text-right px-4 py-3 font-medium text-muted-foreground">Amount</th>
                  <th className="text-center px-4 py-3 font-medium text-muted-foreground">Status</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Receipt</th>
                </tr>
              </thead>
              <tbody>
                {payments.map((p: any, i: number) => (
                  <tr key={p.id || i} className="border-b border-border last:border-0 hover:bg-accent/30 transition-colors">
                    <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">{formatDateTime(p.createdAt)}</td>
                    <td className="px-4 py-3 font-medium text-dark">{p.description || `Enrolment: ${p.course?.title || ''}`}</td>
                    <td className="px-4 py-3 text-body">{p.trainerName || p.course?.trainer?.user?.fullName || '-'}</td>
                    <td className="px-4 py-3 text-right font-semibold text-dark whitespace-nowrap">{formatCurrency(p.amount || p.pricePaidKes || 0)}</td>
                    <td className="px-4 py-3 text-center">
                      <StatusBadge status={p.status || 'COMPLETED'} />
                    </td>
                    <td className="px-4 py-3">
                      {p.mpesaReceiptNumber ? (
                        <span className="font-mono text-xs text-muted-foreground cursor-help hover:text-dark" title={p.mpesaReceiptNumber}>
                          {p.mpesaReceiptNumber.slice(0, 8)}...
                        </span>
                      ) : (
                        <span className="text-xs text-muted-foreground">-</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {meta && (
        <Pagination page={meta.page || page} totalPages={meta.totalPages || 1} total={meta.total || 0} />
      )}
    </div>
  );
}
