import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Wallet, TrendingUp, Clock, ArrowDownLeft, Search, DollarSign } from 'lucide-react';
import { getAdminEarnings, getAdminPayouts, getAdminStats } from '@/services/adminService';
import { getPlatformConfig } from '@/services/adminService';
import { adminKeys } from '@/lib/query-keys';
import { StatCard } from '@/components/shared/stat-card';
import { CardSkeleton } from '@/components/shared/loading-skeleton';
import { ErrorState } from '@/components/shared/error-state';
import { EmptyState } from '@/components/shared/empty-state';
import { StatusBadge } from '@/components/shared/status-badge';
import { Pagination } from '@/components/shared/pagination';
import { ProcessPaymentModal } from '@/components/admin/process-payment-modal';
import { supabase } from '@/lib/supabase';
import { formatCurrency, formatDate, formatNumber } from '@/lib/utils';

type Tab = 'overview' | 'payouts' | 'commissions';

export default function AdminEarnings() {
  const [activeTab, setActiveTab] = useState<Tab>('overview');
  const [payoutStatusFilter, setPayoutStatusFilter] = useState<string>('');
  const [payoutSearch, setPayoutSearch] = useState('');
  const [payoutPage, setPayoutPage] = useState(1);
  const [selectedPayout, setSelectedPayout] = useState<any>(null);
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);

  const {
    data: earnings,
    isLoading: earningsLoading,
    isError: earningsError,
    refetch: refetchEarnings,
  } = useQuery({
    queryKey: adminKeys.earnings,
    queryFn: getAdminEarnings,
  });

  const { data: config } = useQuery({
    queryKey: adminKeys.config,
    queryFn: getPlatformConfig,
  });

  const {
    data: payouts,
    isLoading: payoutsLoading,
    refetch: refetchPayouts,
  } = useQuery({
    queryKey: adminKeys.payouts(payoutStatusFilter, payoutPage),
    queryFn: () =>
      getAdminPayouts({ status: payoutStatusFilter || undefined, search: payoutSearch || undefined, page: payoutPage }),
  });

  const { data: stats } = useQuery({
    queryKey: adminKeys.stats,
    queryFn: getAdminStats,
  });

  const tabs: { key: Tab; label: string }[] = [
    { key: 'overview', label: 'Overview' },
    { key: 'payouts', label: 'Trainer Payouts' },
    { key: 'commissions', label: 'Commissions' },
  ];

  const totalPages = payouts ? Math.ceil(payouts.total / 20) : 0;

  if (earningsLoading) {
    return (
      <div className="max-w-5xl mx-auto">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {Array.from({ length: 4 }).map((_, i) => (
            <CardSkeleton key={i} />
          ))}
        </div>
      </div>
    );
  }

  if (earningsError) {
    return <ErrorState message="Failed to load earnings data" onRetry={() => refetchEarnings()} />;
  }

  return (
    <div className="max-w-5xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-dark">Earnings</h1>
        <p className="text-body text-sm">Platform financial management</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard
          icon={TrendingUp}
          label="Total Commissions"
          value={formatCurrency(earnings?.totalCommissions || 0)}
          iconBg="bg-surface"
          iconColor="text-foreground"
        />
        <StatCard
          icon={ArrowDownLeft}
          label="Total Disbursed"
          value={formatCurrency(earnings?.totalDisbursed || 0)}
          iconBg="bg-primary"
          iconColor="text-primary"
        />
        <StatCard
          icon={Clock}
          label="Pending Payouts"
          value={formatCurrency(earnings?.pendingPayouts || 0)}
          iconBg="bg-surface"
          iconColor="text-body"
        />
        <StatCard
          icon={DollarSign}
          label="Commission Rate"
          value={`${config?.commissionRate || 12}%`}
          iconBg="bg-surface"
          iconColor="text-foreground"
        />
      </div>

      <div className="bg-white rounded-card shadow-card mb-6">
        <div className="border-b border-border">
          <div className="flex">
            {tabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`px-6 py-3 text-sm font-medium transition-colors relative ${
                  activeTab === tab.key
                    ? 'text-primary border-b-2 border-primary'
                    : 'text-body-foreground hover:text-dark'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        <div className="p-6">
          {activeTab === 'overview' && (
            <div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
                <div className="bg-surface rounded-card p-4">
                  <p className="text-xs text-body-foreground mb-1">This Month Commissions</p>
                  <p className="text-xl font-bold text-dark">
                    {formatCurrency(earnings?.monthlyEarnings?.slice(-1)?.[0]?.commissions || 0)}
                  </p>
                </div>
                <div className="bg-surface rounded-card p-4">
                  <p className="text-xs text-body-foreground mb-1">This Month Disbursements</p>
                  <p className="text-xl font-bold text-dark">
                    {formatCurrency(earnings?.monthlyEarnings?.slice(-1)?.[0]?.disbursements || 0)}
                  </p>
                </div>
                <div className="bg-surface rounded-card p-4">
                  <p className="text-xs text-body-foreground mb-1">Total Trainees</p>
                  <p className="text-xl font-bold text-dark">
                    {formatNumber((stats?.totalUsers || 0) - (stats?.totalTrainers || 0))}
                  </p>
                </div>
              </div>

              {earnings?.monthlyEarnings && earnings.monthlyEarnings.length > 0 ? (
                <div>
                  <h3 className="text-sm font-bold text-dark mb-3">Monthly Earnings</h3>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-border">
                          <th className="text-left py-2 px-3 text-body-foreground font-medium">Month</th>
                          <th className="text-right py-2 px-3 text-body-foreground font-medium">Commissions</th>
                          <th className="text-right py-2 px-3 text-body-foreground font-medium">Disbursements</th>
                          <th className="text-right py-2 px-3 text-body-foreground font-medium">Net</th>
                        </tr>
                      </thead>
                      <tbody>
                        {earnings.monthlyEarnings.map((m: any) => (
                          <tr key={m.month} className="border-b border-border/50">
                            <td className="py-2 px-3 text-dark font-medium">
                              {new Date(m.month + '-01').toLocaleDateString('en-KE', {
                                month: 'long',
                                year: 'numeric',
                              })}
                            </td>
                            <td className="py-2 px-3 text-right text-foreground">{formatCurrency(m.commissions)}</td>
                            <td className="py-2 px-3 text-right text-primary">{formatCurrency(m.disbursements)}</td>
                            <td className="py-2 px-3 text-right font-medium text-dark">
                              {formatCurrency(m.commissions - m.disbursements)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ) : (
                <EmptyState
                  icon={TrendingUp}
                  title="No earnings data yet"
                  subtitle="Earnings will appear once enrolments are made"
                />
              )}
            </div>
          )}

          {activeTab === 'payouts' && (
            <div>
              <div className="flex flex-wrap items-center gap-3 mb-4">
                <div className="relative flex-1 min-w-[200px]">
                  <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-body-foreground" />
                  <input
                    type="text"
                    placeholder="Search by trainer..."
                    value={payoutSearch}
                    onChange={(e) => {
                      setPayoutSearch(e.target.value);
                      setPayoutPage(1);
                    }}
                    className="w-full pl-9 pr-3 py-2 text-sm border border-input rounded-btn"
                  />
                </div>
                <select
                  value={payoutStatusFilter}
                  onChange={(e) => {
                    setPayoutStatusFilter(e.target.value);
                    setPayoutPage(1);
                  }}
                  className="px-3 py-2 text-sm border border-input rounded-btn bg-white"
                  aria-label="Filter by status"
                >
                  <option value="">All Statuses</option>
                  <option value="PENDING">Pending</option>
                  <option value="COMPLETED">Completed</option>
                  <option value="FAILED">Failed</option>
                </select>
              </div>

              {payoutsLoading ? (
                <div className="space-y-3">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <CardSkeleton key={i} />
                  ))}
                </div>
              ) : payouts?.data?.length ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border">
                        <th className="text-left py-2 px-3 text-body-foreground font-medium">Trainer</th>
                        <th className="text-right py-2 px-3 text-body-foreground font-medium">Amount</th>
                        <th className="text-right py-2 px-3 text-body-foreground font-medium">Phone</th>
                        <th className="text-right py-2 px-3 text-body-foreground font-medium">Date</th>
                        <th className="text-center py-2 px-3 text-body-foreground font-medium">Status</th>
                        <th className="text-right py-2 px-3 text-body-foreground font-medium">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {payouts.data.map((p: any) => (
                        <tr key={p.id} className="border-b border-border/50 hover:bg-surface/50 transition-colors">
                          <td className="py-2 px-3">
                            <p className="text-dark font-medium">{p.trainerName}</p>
                            <p className="text-xs text-body-foreground">{p.trainerEmail}</p>
                          </td>
                          <td className="py-2 px-3 text-right text-dark font-medium">{formatCurrency(p.amount)}</td>
                          <td className="py-2 px-3 text-right text-body">{p.phone || '-'}</td>
                          <td className="py-2 px-3 text-right text-body text-xs">{formatDate(p.createdAt)}</td>
                          <td className="py-2 px-3 text-center">
                            <StatusBadge status={p.status} />
                          </td>
                          <td className="py-2 px-3 text-right">
                            {p.status === 'PENDING' && (
                              <button
                                onClick={() => {
                                  setSelectedPayout(p);
                                  setPaymentModalOpen(true);
                                }}
                                className="px-3 py-1.5 text-xs font-medium bg-primary text-white rounded-btn hover:bg-surface transition-colors"
                              >
                                Process
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <EmptyState
                  icon={Wallet}
                  title="No payout requests"
                  subtitle="Payout requests from trainers will appear here"
                />
              )}

              {totalPages > 1 && <Pagination page={payoutPage} totalPages={totalPages} total={payouts?.total || 0} />}
            </div>
          )}

          {activeTab === 'commissions' && <CommissionsTab />}
        </div>
      </div>

      {selectedPayout && (
        <ProcessPaymentModal
          open={paymentModalOpen}
          onClose={() => {
            setPaymentModalOpen(false);
            setSelectedPayout(null);
          }}
          payout={{
            id: selectedPayout.id,
            trainerId: selectedPayout.trainerId,
            trainerName: selectedPayout.trainerName,
            trainerEmail: selectedPayout.trainerEmail,
            amountKes: Number(selectedPayout.amount),
            mpesaPhone: selectedPayout.phone || '',
            availableBalance: Number(selectedPayout.amount),
            requestDate: selectedPayout.createdAt,
          }}
          onProcessed={() => {
            refetchPayouts();
            refetchEarnings();
            setPaymentModalOpen(false);
            setSelectedPayout(null);
          }}
        />
      )}
    </div>
  );
}

function CommissionsTab() {
  const { data: commissions, isLoading } = useQuery({
    queryKey: adminKeys.commissions,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('TransactionLedger')
        .select('*, user:User!userId(id, fullName, email)')
        .eq('entryType', 'COMMISSION')
        .order('createdAt', { ascending: false })
        .limit(200);
      if (error) throw error;
      return data || [];
    },
  });

  if (isLoading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <CardSkeleton key={i} />
        ))}
      </div>
    );
  }

  if (!commissions?.length) {
    return (
      <EmptyState
        icon={TrendingUp}
        title="No commissions yet"
        subtitle="Commissions will appear once enrolments are completed"
      />
    );
  }

  const totalCommissions = commissions.reduce((sum: number, tx: any) => sum + (Number(tx.amountKes) || 0), 0);

  return (
    <div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border">
              <th className="text-left py-2 px-3 text-body-foreground font-medium">Date</th>
              <th className="text-left py-2 px-3 text-body-foreground font-medium">User</th>
              <th className="text-left py-2 px-3 text-body-foreground font-medium">Description</th>
              <th className="text-right py-2 px-3 text-body-foreground font-medium">Amount</th>
              <th className="text-center py-2 px-3 text-body-foreground font-medium">Type</th>
            </tr>
          </thead>
          <tbody>
            {commissions.map((tx: any) => (
              <tr key={tx.id} className="border-b border-border/50">
                <td className="py-2 px-3 text-body text-xs">{formatDate(tx.createdAt)}</td>
                <td className="py-2 px-3 text-dark font-medium">{tx.user?.fullName || 'Unknown'}</td>
                <td className="py-2 px-3 text-body">{tx.description || '-'}</td>
                <td className="py-2 px-3 text-right text-dark font-medium">{formatCurrency(tx.amountKes)}</td>
                <td className="py-2 px-3 text-center">{tx.direction === 'CREDIT' ? 'Credit' : 'Debit'}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="border-t border-border">
              <td colSpan={3} className="py-3 px-3 text-right font-bold text-dark">
                Total Commissions
              </td>
              <td className="py-3 px-3 text-right font-bold text-dark">{formatCurrency(totalCommissions)}</td>
              <td />
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}
