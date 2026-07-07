import { useQuery } from '@tanstack/react-query';
import { Wallet, ArrowDownLeft, ArrowUpRight } from 'lucide-react';
import { useAuthStore } from '@/stores/auth-store';
import { getTransactionHistory } from '@/services/paymentService';
import { CardSkeleton } from '@/components/shared/loading-skeleton';
import { ErrorState } from '@/components/shared/error-state';
import { EmptyState } from '@/components/shared/empty-state';
import { formatCurrency, formatDateTime, timeAgo } from '@/lib/utils';

export default function Payments() {
  const { user } = useAuthStore();

  const {
    data: transactions,
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: ['transactions', user?.id, 'trainee'],
    queryFn: () => getTransactionHistory(user!.id, 'trainee'),
    enabled: !!user?.id,
  });

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-dark">Payments</h1>
        <p className="text-body text-sm">Your payment history</p>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <CardSkeleton key={i} />
          ))}
        </div>
      ) : isError ? (
        <ErrorState message="Failed to load transactions" onRetry={() => refetch()} />
      ) : !transactions || transactions.length === 0 ? (
        <EmptyState icon={Wallet} title="No transactions yet" subtitle="Your payment history will appear here" />
      ) : (
        <div className="bg-white rounded-card shadow-card divide-y divide-border">
          {transactions.map((tx: any) => (
            <div key={tx.id} className="flex items-center gap-4 p-4">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center ${
                  tx.entryType === 'DEBIT' ? 'bg-red-50' : 'bg-green-50'
                }`}
              >
                {tx.entryType === 'DEBIT' ? (
                  <ArrowUpRight size={18} className="text-red-500" />
                ) : (
                  <ArrowDownLeft size={18} className="text-green-500" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-dark">{tx.description || tx.entryType}</p>
                <p className="text-xs text-muted-foreground">{formatDateTime(tx.createdAt)}</p>
              </div>
              <div className="text-right">
                <p className={`text-sm font-bold ${tx.entryType === 'DEBIT' ? 'text-red-500' : 'text-green-500'}`}>
                  {tx.entryType === 'DEBIT' ? '-' : '+'}
                  {formatCurrency(tx.amountKes)}
                </p>
                <p className="text-xs text-muted-foreground">{timeAgo(tx.createdAt)}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
