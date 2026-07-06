'use client';

import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { TrendingUp, Clock, Wallet } from 'lucide-react';
import { BackButton } from '@frontend/components/shared/back-button';
import { api } from '@backend/lib/api';
import { formatCurrency, formatDateTime } from '@backend/lib/utils';
import { WithdrawModal } from '@frontend/components/payment/withdraw-modal';
import { useAuthStore } from '@frontend/stores/auth-store';

export default function EarningsPage() {
  const { user } = useAuthStore();
  const [showWithdraw, setShowWithdraw] = useState(false);

  const { data: earnings, isLoading } = useQuery({
    queryKey: ['earnings', 'summary'],
    queryFn: () => api.get<any>('/trainers/me/earnings'),
  });

  const { data: payoutsRes } = useQuery({
    queryKey: ['payouts', 'list', 1],
    queryFn: () => api.get<any>('/payouts', { page: 1, perPage: 50 }),
  });

  const e = earnings?.data;
  const payouts = payoutsRes?.data?.data || [];

  return (
    <div className="space-y-6 max-w-3xl">
      <BackButton href="/dashboard/trainer" label="Back to Dashboard" />
      <h1 className="text-2xl font-bold text-dark">Earnings & Payouts</h1>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-card shadow-card p-4 text-center">
          <div className="flex flex-col items-center gap-1 mb-2">
            <Wallet size={20} className="text-primary" />
            <span className="text-sm text-muted-foreground">Available</span>
          </div>
          <p className="text-2xl font-bold text-dark">{formatCurrency(e?.availableBalance || 0)}</p>
        </div>
        <div className="bg-white rounded-card shadow-card p-4 text-center">
          <div className="flex flex-col items-center gap-1 mb-2">
            <Clock size={20} className="text-warning" />
            <span className="text-sm text-muted-foreground">Pending Release</span>
          </div>
          <p className="text-2xl font-bold text-dark">{formatCurrency(e?.pendingRelease || 0)}</p>
        </div>
        <div className="bg-white rounded-card shadow-card p-4 text-center">
          <div className="flex flex-col items-center gap-1 mb-2">
            <TrendingUp size={20} className="text-primary" />
            <span className="text-sm text-muted-foreground">Total Earned</span>
          </div>
          <p className="text-2xl font-bold text-dark">{formatCurrency(e?.totalEarned || 0)}</p>
        </div>
      </div>

      <button
        onClick={() => setShowWithdraw(true)}
        disabled={!e?.availableBalance || Number(e.availableBalance) <= 0}
        className="w-full py-3 bg-primary text-white font-medium rounded-btn hover:bg-primary/90 disabled:opacity-50 transition-colors"
      >
        Withdraw Funds
      </button>

      <section>
        <h2 className="text-lg font-semibold text-dark mb-4">Transaction History</h2>
        {payouts.length === 0 ? (
          <div className="bg-white rounded-card shadow-card p-8 text-center">
            <p className="text-sm text-muted-foreground">No transactions yet</p>
          </div>
        ) : (
          <div className="bg-white rounded-card shadow-card overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-accent">
                <tr>
                  <th className="text-left p-3 font-medium text-body">Date</th>
                  <th className="text-left p-3 font-medium text-body">Description</th>
                  <th className="text-right p-3 font-medium text-body">Amount</th>
                  <th className="text-right p-3 font-medium text-body">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {payouts.map((p: any) => (
                  <tr key={p.id} className="hover:bg-accent/50">
                    <td className="p-3 text-muted-foreground">{formatDateTime(p.createdAt)}</td>
                    <td className="p-3 text-dark">Withdrawal to {p.mpesaPhone}</td>
                    <td className="p-3 text-right font-medium text-dark">{formatCurrency(p.amountKes)}</td>
                    <td className="p-3 text-right">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                        p.status === 'COMPLETED' ? 'bg-accent text-body' :
                        p.status === 'FAILED' ? 'bg-destructive/10 text-destructive' :
                        'bg-warning/10 text-warning'
                      }`}>{p.status}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {showWithdraw && (
        <WithdrawModal
          open={showWithdraw}
          onClose={() => setShowWithdraw(false)}
          maxAmount={Number(e?.availableBalance || 0)}
          defaultPhone={user?.phone}
        />
      )}
    </div>
  );
}
