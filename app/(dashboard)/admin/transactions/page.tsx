'use client';

import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { Download, Search, FileText, Filter } from 'lucide-react';
import { BackButton } from '@frontend/components/shared/back-button';
import { api } from '@backend/lib/api';
import { StatusBadge } from '@frontend/components/shared/status-badge';
import { EmptyState } from '@frontend/components/shared/empty-state';
import { ErrorState } from '@frontend/components/shared/error-state';
import { CardSkeleton } from '@frontend/components/shared/loading-skeleton';
import { Pagination } from '@frontend/components/shared/pagination';
import { RawJsonModal } from '@frontend/components/shared/raw-json-modal';
import { OfflineBanner } from '@frontend/components/shared/offline-banner';
import { formatCurrency, formatDateTime } from '@backend/lib/utils';
import { toast } from 'sonner';

const TYPES = ['ALL', 'ENROLMENT', 'MILESTONE_RELEASE', 'PAYOUT', 'COMMISSION', 'REFUND', 'VERIFICATION_FEE'];

export default function AdminTransactionsPage() {
  const [page, setPage] = useState(1);
  const [type, setType] = useState('ALL');
  const [search, setSearch] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [rawJson, setRawJson] = useState<{ data: unknown; title: string } | null>(null);

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['admin', 'transactions', page, type, dateFrom, dateTo],
    queryFn: () => api.get<any>('/admin/transactions', {
      page, perPage: 50,
      type: type !== 'ALL' ? type : undefined,
      from: dateFrom || undefined,
      to: dateTo || undefined,
      q: search || undefined,
    }),
  });

  const entries = data?.data?.data || [];
  const meta = data?.data?.meta;
  const summary = data?.data?.summary;

  const handleExport = () => {
    const params = new URLSearchParams();
    if (type !== 'ALL') params.set('type', type);
    if (dateFrom) params.set('from', dateFrom);
    if (dateTo) params.set('to', dateTo);
    if (search) params.set('q', search);
    window.open(`/api/admin/transactions/export?${params.toString()}`, '_blank');
    toast.success('Downloading CSV...');
  };

  return (
    <div className="space-y-6">
      <OfflineBanner />
      <BackButton href="/admin" label="Back to Admin" />
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-dark">Transactions</h1>
        <button onClick={handleExport}
          className="flex items-center gap-1.5 px-3 py-1.5 border border-border rounded-btn text-sm hover:bg-accent transition-colors">
          <Download size={14} /> Export CSV
        </button>
      </div>

      {summary && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="bg-white rounded-card shadow-card p-3">
            <p className="text-xs text-muted-foreground">Total Revenue</p>
            <p className="text-lg font-bold text-dark">{formatCurrency(summary.totalRevenue || 0)}</p>
          </div>
          <div className="bg-white rounded-card shadow-card p-3">
            <p className="text-xs text-muted-foreground">Total Payouts</p>
            <p className="text-lg font-bold text-dark">{formatCurrency(summary.totalPayouts || 0)}</p>
          </div>
          <div className="bg-white rounded-card shadow-card p-3">
            <p className="text-xs text-muted-foreground">Trainee Payments</p>
            <p className="text-lg font-bold text-dark">{formatCurrency(summary.traineePayments || 0)}</p>
          </div>
          <div className="bg-white rounded-card shadow-card p-3">
            <p className="text-xs text-muted-foreground">Net Revenue</p>
            <p className="text-lg font-bold text-primary">{formatCurrency(summary.netRevenue || 0)}</p>
          </div>
        </div>
      )}

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px] max-w-xs">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search M-Pesa ref or email..."
            className="w-full pl-9 pr-3 py-1.5 border border-border rounded-btn text-sm focus:outline-none focus:ring-2 focus:ring-primary/20" />
        </div>
        <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)}
          className="px-3 py-1.5 border border-border rounded-btn text-sm focus:outline-none focus:ring-2 focus:ring-primary/20" />
        <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)}
          className="px-3 py-1.5 border border-border rounded-btn text-sm focus:outline-none focus:ring-2 focus:ring-primary/20" />
      </div>

      <div className="flex gap-2 overflow-x-auto pb-2">
        {TYPES.map(t => (
          <button key={t} onClick={() => { setType(t); setPage(1); }}
            className={`px-3 py-1.5 text-xs font-medium rounded-btn whitespace-nowrap transition-colors ${
              type === t ? 'bg-primary text-white' : 'bg-white text-body border border-border hover:bg-accent'
            }`}>
            {t === 'ALL' ? 'All' : t.split('_').map(w => w.charAt(0) + w.slice(1).toLowerCase()).join(' ')}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="space-y-2">{[1,2,3,4,5].map(i => <CardSkeleton key={i} />)}</div>
      ) : isError ? (
        <ErrorState message="Failed to load transactions" onRetry={() => refetch()} />
      ) : entries.length === 0 ? (
        <EmptyState title="No transactions" subtitle="No transactions found for this period." />
      ) : (
        <div className="bg-white rounded-card shadow-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-accent">
                <tr>
                  <th className="text-left p-3 font-medium text-body whitespace-nowrap">Date</th>
                  <th className="text-left p-3 font-medium text-body whitespace-nowrap">Type</th>
                  <th className="text-left p-3 font-medium text-body whitespace-nowrap">User</th>
                  <th className="text-left p-3 font-medium text-body whitespace-nowrap">Description</th>
                  <th className="text-right p-3 font-medium text-body whitespace-nowrap">Amount (KES)</th>
                  <th className="text-right p-3 font-medium text-body whitespace-nowrap">Balance</th>
                  <th className="text-left p-3 font-medium text-body whitespace-nowrap">M-Pesa Ref</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {entries.map((e: any) => (
                  <tr key={e.id} className="hover:bg-accent/50">
                    <td className="p-3 text-muted-foreground whitespace-nowrap">{e.createdAt ? formatDateTime(e.createdAt) : '-'}</td>
                    <td className="p-3">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium whitespace-nowrap ${
                        e.type === 'ENROLMENT' ? 'bg-blue-100 text-blue-700' :
                        e.type === 'PAYOUT' ? 'bg-green-100 text-green-700' :
                        e.type === 'COMMISSION' ? 'bg-orange-100 text-orange-700' :
                        e.type === 'VERIFICATION_FEE' ? 'bg-purple-100 text-purple-700' :
                        e.type === 'REFUND' ? 'bg-red-100 text-red-700' :
                        'bg-accent text-body'
                      }`}>
                        {e.type?.split('_').map((w: string) => w.charAt(0) + w.slice(1).toLowerCase()).join(' ') || 'N/A'}
                      </span>
                    </td>
                    <td className="p-3">
                      <span className="text-dark whitespace-nowrap">{e.user?.fullName || e.user?.email || 'System'}</span>
                    </td>
                    <td className="p-3 text-body max-w-[200px] truncate">{e.description || e.type || '-'}</td>
                    <td className={`p-3 text-right font-medium whitespace-nowrap ${(e.creditKes || e.type === 'ENROLMENT' || e.type === 'VERIFICATION_FEE') ? 'text-primary' : 'text-destructive'}`}>
                      {(e.creditKes || e.type === 'ENROLMENT' || e.type === 'VERIFICATION_FEE' || e.type === 'COMMISSION')
                        ? `+${formatCurrency(e.creditKes || e.amountKes || 0)}`
                        : `-${formatCurrency(e.debitKes || e.amountKes || 0)}`}
                    </td>
                    <td className="p-3 text-right text-muted-foreground whitespace-nowrap">
                      {e.balanceAfter ? formatCurrency(e.balanceAfter) : '-'}
                    </td>
                    <td className="p-3">
                      {e.mpesaReceiptNumber ? (
                        <button
                          onClick={() => setRawJson({ data: e.mpesaCallback || { receipt: e.mpesaReceiptNumber }, title: `M-Pesa ${e.mpesaReceiptNumber}` })}
                          className="font-mono text-xs text-muted-foreground hover:text-primary cursor-pointer"
                        >
                          {e.mpesaReceiptNumber.slice(0, 8)}...
                        </button>
                      ) : (
                        <span className="text-xs text-muted-foreground">-</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {meta && (
            <Pagination page={meta.page || page} totalPages={meta.totalPages || 1} total={meta.total || 0} />
          )}
        </div>
      )}

      {rawJson && (
        <RawJsonModal
          isOpen={!!rawJson}
          onClose={() => setRawJson(null)}
          data={rawJson.data}
          title={rawJson.title}
        />
      )}
    </div>
  );
}
