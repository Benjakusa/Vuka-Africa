'use client';

import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { Download, Search } from 'lucide-react';
import { BackButton } from '@frontend/components/shared/back-button';
import { api } from '@backend/lib/api';
import { EmptyState } from '@frontend/components/shared/empty-state';
import { CardSkeleton } from '@frontend/components/shared/loading-skeleton';
import { formatCurrency, formatDateTime } from '@backend/lib/utils';

const TYPES = ['ALL', 'ENROLMENT', 'MILESTONE_RELEASE', 'PAYOUT', 'COMMISSION', 'REFUND', 'VERIFICATION_FEE'];

export default function AdminLedgerPage() {
  const [page, setPage] = useState(1);
  const [type, setType] = useState('ALL');
  const [search, setSearch] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'ledger', page, type],
    queryFn: () => api.get<any>('/admin/ledger', {
      page, perPage: 50,
      type: type !== 'ALL' ? type : undefined,
    }),
  });

  const entries = data?.data?.data || [];
  const meta = data?.data?.meta;

  return (
    <div className="space-y-6">
      <BackButton href="/dashboard/admin" label="Back to Admin" />
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-dark">Transaction Ledger</h1>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search user..."
              className="pl-9 pr-3 py-1.5 border border-border rounded-btn text-sm w-52 focus:outline-none focus:ring-2 focus:ring-primary/20" />
          </div>
          <button className="flex items-center gap-1.5 px-3 py-1.5 border border-border rounded-btn text-sm hover:bg-accent">
            <Download size={14} /> Export
          </button>
        </div>
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
      ) : entries.length === 0 ? (
        <EmptyState title="No transactions" subtitle="Ledger entries will appear here" />
      ) : (
        <div className="bg-white rounded-card shadow-card overflow-hidden">
          <div className="-mx-4 sm:-mx-0 overflow-x-auto">
            <div className="inline-block min-w-full align-middle px-4 sm:px-0">
            <table className="w-full text-sm">
              <thead className="bg-accent">
                <tr>
                  <th className="text-left p-3 font-medium text-body whitespace-nowrap">Date</th>
                  <th className="text-left p-3 font-medium text-body whitespace-nowrap">Type</th>
                  <th className="text-left p-3 font-medium text-body whitespace-nowrap">User</th>
                  <th className="text-right p-3 font-medium text-body whitespace-nowrap">Debit (KES)</th>
                  <th className="text-right p-3 font-medium text-body whitespace-nowrap">Credit (KES)</th>
                  <th className="text-left p-3 font-medium text-body whitespace-nowrap">Reference</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {entries.map((e: any) => (
                  <tr key={e.id} className="hover:bg-accent/50">
                    <td className="p-3 text-muted-foreground whitespace-nowrap">{formatDateTime(e.createdAt)}</td>
                    <td className="p-3">
                      <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-700 whitespace-nowrap">
                        {e.type.split('_').map((w: string) => w.charAt(0) + w.slice(1).toLowerCase()).join(' ')}
                      </span>
                    </td>
                    <td className="p-3 text-dark whitespace-nowrap">{e.user?.fullName || 'System'}</td>
                    <td className="p-3 text-right text-red-600 font-medium whitespace-nowrap">{e.debitKes ? formatCurrency(e.debitKes) : '-'}</td>
                    <td className="p-3 text-right text-green-600 font-medium whitespace-nowrap">{e.creditKes ? formatCurrency(e.creditKes) : '-'}</td>
                    <td className="p-3 text-xs text-muted-foreground whitespace-nowrap">{e.reference || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            </div>
          </div>
          {meta && (
            <div className="flex items-center justify-between p-3 border-t border-border">
              <p className="text-xs text-muted-foreground">Page {meta.page} of {meta.totalPages} ({meta.total} entries)</p>
              <div className="flex gap-2">
                <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={meta.page <= 1}
                  className="px-3 py-1 text-xs font-medium border border-border rounded-btn hover:bg-accent disabled:opacity-50">Prev</button>
                <button onClick={() => setPage(p => p + 1)} disabled={meta.page >= meta.totalPages}
                  className="px-3 py-1 text-xs font-medium border border-border rounded-btn hover:bg-accent disabled:opacity-50">Next</button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
