import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Wallet, Download, RefreshCw, ArrowDownLeft, ArrowUpRight } from 'lucide-react';
import { toast } from 'sonner';
import { useAuthStore } from '@/stores/auth-store';
import { getTrainerEarnings } from '@/services/trainerService';
import { getTransactionHistory } from '@/services/paymentService';
import { getPayoutHistory, requestPayout } from '@/services/payoutService';
import { WithdrawModal } from '@/components/payment/withdraw-modal';
import { CardSkeleton } from '@/components/shared/loading-skeleton';
import { ErrorState } from '@/components/shared/error-state';
import { EmptyState } from '@/components/shared/empty-state';
import { StatusBadge } from '@/components/shared/status-badge';
import { StatCard } from '@/components/shared/stat-card';
import { formatCurrency, formatDate } from '@/lib/utils';

export default function Earnings() {
  const { user } = useAuthStore();
  const trainerId = user?.trainer?.id;
  const [withdrawOpen, setWithdrawOpen] = useState(false);

  const { data: payouts } = useQuery({
    queryKey: ['trainer', 'payouts', trainerId],
    queryFn: () => getPayoutHistory(trainerId!),
    enabled: !!trainerId,
  });

  const { data: transactions } = useQuery({
    queryKey: ['transactions', user?.id, 'trainer'],
    queryFn: () => getTransactionHistory(user!.id, 'trainer'),
    enabled: !!user?.id,
  });

  const totalEarnings =
    transactions?.reduce((sum: number, tx: any) => {
      if (tx.entryType === 'CREDIT') return sum + (tx.amountKes || 0);
      return sum;
    }, 0) || 0;

  const availableBalance = user?.trainer?.availableBalance || 0;
  const pendingPayouts = payouts?.filter((p: any) => p.status === 'PENDING') || [];

  const handleWithdraw = async (data: { amount: number; phone: string }) => {
    await requestPayout({ trainerId: trainerId!, amount: data.amount, phone: data.phone });
    toast.success('Withdrawal request submitted');
    setWithdrawOpen(false);
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-dark">Earnings</h1>
          <p className="text-body text-sm">Track your revenue and payouts</p>
        </div>
        <button
          onClick={() => setWithdrawOpen(true)}
          disabled={availableBalance <= 0}
          className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-white text-sm font-medium rounded-btn hover:bg-primary/90 disabled:opacity-50 transition-colors"
        >
          <Download size={16} /> Withdraw
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <StatCard
          icon={Wallet}
          label="Available Balance"
          value={formatCurrency(availableBalance)}
          iconBg="bg-green-50"
          iconColor="text-green-600"
        />
        <StatCard
          icon={Wallet}
          label="Total Earned"
          value={formatCurrency(totalEarnings)}
          iconBg="bg-blue-50"
          iconColor="text-blue-600"
        />
        <StatCard
          icon={RefreshCw}
          label="Pending Payouts"
          value={pendingPayouts.length}
          iconBg="bg-yellow-50"
          iconColor="text-yellow-600"
        />
      </div>

      {transactions && transactions.length > 0 && (
        <section className="mb-8">
          <h2 className="text-lg font-bold text-dark mb-4">Transaction History</h2>
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
                  <p className="text-xs text-muted-foreground">{formatDate(tx.createdAt)}</p>
                </div>
                <p className={`text-sm font-bold ${tx.entryType === 'DEBIT' ? 'text-red-500' : 'text-green-500'}`}>
                  {tx.entryType === 'DEBIT' ? '-' : '+'}
                  {formatCurrency(tx.amountKes)}
                </p>
              </div>
            ))}
          </div>
        </section>
      )}

      {payouts && payouts.length > 0 && (
        <section>
          <h2 className="text-lg font-bold text-dark mb-4">Payout History</h2>
          <div className="bg-white rounded-card shadow-card divide-y divide-border">
            {payouts.map((payout: any) => (
              <div key={payout.id} className="flex items-center justify-between p-4">
                <div>
                  <p className="text-sm font-medium text-dark">{formatCurrency(payout.amount)}</p>
                  <p className="text-xs text-muted-foreground">{formatDate(payout.createdAt)}</p>
                </div>
                <StatusBadge status={payout.status} />
              </div>
            ))}
          </div>
        </section>
      )}

      {!payouts && !transactions && (
        <EmptyState icon={Wallet} title="No earnings data yet" subtitle="Earnings will appear once students enrol" />
      )}

      <WithdrawModal
        open={withdrawOpen}
        onClose={() => setWithdrawOpen(false)}
        balance={availableBalance}
        onWithdraw={handleWithdraw}
      />
    </div>
  );
}
