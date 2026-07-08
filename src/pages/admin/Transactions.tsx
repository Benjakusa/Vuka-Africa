import { useQuery } from '@tanstack/react-query';
import { useSearchParams } from 'react-router-dom';
import { Wallet, ArrowDownLeft, ArrowUpRight, Search } from 'lucide-react';
import { getTransactions } from '@/services/adminService';
import { adminKeys } from '@/lib/query-keys';
import { Pagination } from '@/components/shared/pagination';
import { EmptyState } from '@/components/shared/empty-state';
import { ErrorState } from '@/components/shared/error-state';
import { TableSkeleton } from '@/components/shared/loading-skeleton';
import { formatCurrency, formatDateTime } from '@/lib/utils';

const FILTERS = [
  { label: 'All', value: '' },
  { label: 'Credit', value: 'CREDIT' },
  { label: 'Debit', value: 'DEBIT' },
];

export default function Transactions() {
  const [searchParams, setSearchParams] = useSearchParams();
  const type = searchParams.get('type') || '';
  const page = Number(searchParams.get('page')) || 1;

  const filters: Record<string, unknown> = {};
  if (type) filters.type = type;

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: adminKeys.transactions(filters),
    queryFn: () => getTransactions(filters, page),
  });

  const transactions = data?.data || [];
  const total = data?.total || 0;
  const totalPages = Math.ceil(total / 20);

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <Wallet size={24} className="text-primary" />
        <div>
          <h1 className="text-2xl font-bold text-dark">Transactions</h1>
          <p className="text-body text-sm">Platform transaction ledger</p>
        </div>
      </div>

      <div className="flex gap-1 mb-6 bg-white rounded-card p-1 shadow-card overflow-x-auto">
        {FILTERS.map((f) => (
          <button
            key={f.value}
            onClick={() => {
              const params = new URLSearchParams();
              if (f.value) params.set('type', f.value);
              params.set('page', '1');
              setSearchParams(params, { replace: true });
            }}
            className={`flex-1 py-2 text-sm font-medium rounded-btn transition-colors whitespace-nowrap ${
              type === f.value ? 'bg-primary text-white' : 'text-muted-foreground hover:text-dark'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {isLoading ? (
        <TableSkeleton rows={8} />
      ) : isError ? (
        <ErrorState message="Failed to load transactions" onRetry={() => refetch()} />
      ) : transactions.length === 0 ? (
        <EmptyState icon={Search} title="No transactions found" subtitle="No transactions match your filter criteria" />
      ) : (
        <div className="bg-white rounded-card shadow-card overflow-hidden">
          <div className="overflow-x-auto hidden md:block">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-surface">
                  <th className="text-left p-3 font-medium text-dark">Date</th>
                  <th className="text-left p-3 font-medium text-dark">Description</th>
                  <th className="text-left p-3 font-medium text-dark">Reference</th>
                  <th className="text-left p-3 font-medium text-dark">Type</th>
                  <th className="text-right p-3 font-medium text-dark">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {transactions.map((tx: any) => (
                  <tr key={tx.id}>
                    <td className="p-3 text-muted-foreground whitespace-nowrap">{formatDateTime(tx.createdAt)}</td>
                    <td className="p-3 text-dark">{tx.description || 'N/A'}</td>
                    <td className="p-3 text-muted-foreground">{tx.reference || 'N/A'}</td>
                    <td className="p-3">
                      <span
                        className={`inline-flex items-center gap-1 text-xs font-medium ${
                          tx.entryType === 'CREDIT' ? 'text-green-600' : 'text-red-600'
                        }`}
                      >
                        {tx.entryType === 'CREDIT' ? <ArrowDownLeft size={12} /> : <ArrowUpRight size={12} />}
                        {tx.entryType}
                      </span>
                    </td>
                    <td
                      className={`p-3 text-right font-medium ${
                        tx.entryType === 'CREDIT' ? 'text-green-600' : 'text-red-600'
                      }`}
                    >
                      {tx.entryType === 'CREDIT' ? '+' : '-'}
                      {formatCurrency(tx.amountKes)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="divide-y divide-border md:hidden">
            {transactions.map((tx: any) => (
              <div key={tx.id} className="p-4 space-y-1.5">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-dark truncate flex-1">{tx.description || 'Transaction'}</p>
                  <span
                    className={`text-sm font-bold ml-2 ${tx.entryType === 'CREDIT' ? 'text-green-600' : 'text-red-600'}`}
                  >
                    {tx.entryType === 'CREDIT' ? '+' : '-'}
                    {formatCurrency(tx.amountKes)}
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    {tx.entryType === 'CREDIT' ? <ArrowDownLeft size={12} /> : <ArrowUpRight size={12} />}
                    {tx.entryType}
                  </span>
                  <span>{formatDateTime(tx.createdAt)}</span>
                </div>
                {tx.reference && <p className="text-xs text-muted-foreground">Ref: {tx.reference}</p>}
              </div>
            ))}
          </div>
        </div>
      )}

      <Pagination page={page} totalPages={totalPages} total={total} />
    </div>
  );
}
