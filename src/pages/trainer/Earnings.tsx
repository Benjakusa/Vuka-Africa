import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Wallet, Download, RefreshCw, ArrowDownLeft, ArrowUpRight } from 'lucide-react';
import { toast } from 'sonner';
import { useAuthStore } from '@/stores/auth-store';

import { getTransactionHistory } from '@/services/paymentService';
import { getPayoutHistory, requestPayout } from '@/services/payoutService';
import { getTrainerDashboardStats } from '@/services/trainerService';
import { WithdrawModal } from '@/components/payment/withdraw-modal';

import { EmptyState } from '@/components/shared/empty-state';
import { StatusBadge } from '@/components/shared/status-badge';
import { StatCard } from '@/components/shared/stat-card';
import { formatCurrency, formatDate } from '@/lib/utils';
import { trainerKeys, miscKeys } from '@/lib/query-keys';

export default function Earnings() {
  const { user } = useAuthStore();
  const trainerId = user?.trainer?.id;
  const [withdrawOpen, setWithdrawOpen] = useState(false);

  const { data: payoutsRaw } = useQuery({
    queryKey: trainerKeys.trainerPayouts(trainerId),
    queryFn: () => getPayoutHistory(trainerId!),
    enabled: !!trainerId,
  });
  const payouts = (payoutsRaw || []) as any[];

  const { data: txRaw } = useQuery({
    queryKey: miscKeys.userTransactions(user?.id, 'trainer'),
    queryFn: () => getTransactionHistory(user!.id),
    enabled: !!user?.id,
  });
  const transactions = (txRaw || []) as any[];

  const { data: stats } = useQuery({
    queryKey: trainerKeys.stats(trainerId),
    queryFn: () => getTrainerDashboardStats(trainerId!),
    enabled: !!trainerId,
  });

  const pendingEarnings = Number(stats?.pending_earnings) || 0;
  const settledEarnings = (Array.isArray(transactions) ? transactions : []).reduce((sum: number, tx: any) => {
    if (tx.direction === 'CREDIT') return sum + (Number(tx.amountKes) || 0);
    return sum;
  }, 0);

  const totalEarnings = settledEarnings + pendingEarnings;
  const availableBalance = user?.trainer?.availableBalance || 0;
  const pendingPayouts = payouts.filter((p: any) => p.status === 'PENDING');

  const handleWithdraw = async (data: { amount: number; phone: string }) => {
    await requestPayout({ trainerId: trainerId!, amount: data.amount, phone: data.phone });
    toast.success('Withdrawal request submitted', {
      description:
        'Your withdrawal request has been submitted for review. An admin will process your payment within 24 hours. You will receive an M-Pesa notification when payment is sent.',
      duration: 6000,
    });
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
          className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-white text-sm font-medium rounded-btn hover:bg-surface disabled:opacity-50 transition-colors"
        >
          <Download size={16} /> Withdraw
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <StatCard
          icon={Wallet}
          label="Available Balance"
          value={formatCurrency(availableBalance)}
          iconBg="bg-surface"
          iconColor="text-foreground"
        />
        <StatCard
          icon={Wallet}
          label="Total Earned"
          value={formatCurrency(totalEarnings)}
          iconBg="bg-surface"
          iconColor="text-foreground"
        />
        <StatCard
          icon={RefreshCw}
          label="Pending Payouts"
          value={pendingPayouts.length}
          iconBg="bg-surface"
          iconColor="text-body"
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
                    tx.direction === 'DEBIT' ? 'bg-primary' : 'bg-surface'
                  }`}
                >
                  {tx.direction === 'DEBIT' ? (
                    <ArrowUpRight size={18} className="text-primary" />
                  ) : (
                    <ArrowDownLeft size={18} className="text-foreground" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-dark">{tx.description || tx.direction}</p>
                  <p className="text-xs text-body-foreground">{formatDate(tx.createdAt)}</p>
                </div>
                <p className={`text-sm font-bold ${tx.direction === 'DEBIT' ? 'text-primary' : 'text-foreground'}`}>
                  {tx.direction === 'DEBIT' ? '-' : '+'}
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
                  <p className="text-xs text-body-foreground">{formatDate(payout.createdAt)}</p>
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
