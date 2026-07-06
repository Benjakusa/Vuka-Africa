'use client';

import { useQuery } from '@tanstack/react-query';
import { Users, UserCheck, BookOpen, DollarSign, AlertTriangle, ShieldCheck, TrendingUp, ArrowRight, UserPlus, CreditCard, FileCheck, MessageCircle } from 'lucide-react';
import Link from 'next/link';
import { api } from '@backend/lib/api';
import { StatCard } from '@frontend/components/shared/stat-card';
import { ErrorState } from '@frontend/components/shared/error-state';
import { OfflineBanner } from '@frontend/components/shared/offline-banner';
import { formatCurrency, formatRelativeTime } from '@backend/lib/utils';

const ACTIVITY_ICONS: Record<string, any> = {
  registration: UserPlus,
  enrolment: BookOpen,
  milestone: DollarSign,
  payout: CreditCard,
  dispute: AlertTriangle,
  verification: FileCheck,
};

export default function AdminDashboard() {
  const { data: res, isLoading, isError, refetch } = useQuery({
    queryKey: ['admin', 'stats'],
    queryFn: () => api.get<any>('/admin/stats'),
  });

  const s = res?.data;

  const statsCards = [
    { label: 'Total Users', value: s?.totalUsers || 0, icon: Users, color: 'bg-blue-100 text-blue-600', href: '/admin/users' },
    { label: 'Total Trainers', value: s?.totalTrainers || 0, icon: UserCheck, color: 'bg-orange-100 text-orange-600', href: '/admin/users?role=TRAINER' },
    { label: 'Active Enrolments', value: s?.activeEnrolments || 0, icon: BookOpen, color: 'bg-green-100 text-green-600', href: '#' },
    { label: 'Revenue Today', value: formatCurrency(s?.revenueToday || 0), icon: TrendingUp, color: 'bg-green-100 text-green-600', href: '/admin/transactions' },
    { label: 'Open Disputes', value: s?.activeDisputes || 0, icon: AlertTriangle, color: 'bg-red-100 text-red-600', href: '/admin/disputes', badge: s?.activeDisputes },
    { label: 'Pending Verifications', value: s?.pendingVerifications || 0, icon: ShieldCheck, color: 'bg-yellow-100 text-yellow-600', href: '/admin/verifications', badge: s?.pendingVerifications },
  ];

  const activities = s?.recentActivity || [];
  const pendingVerifications = s?.pendingVerifications || 0;
  const openDisputes = s?.activeDisputes || 0;

  return (
    <div className="space-y-6">
      <OfflineBanner />
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-dark">Admin Panel</h1>
          <p className="text-sm text-muted-foreground">{new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
        </div>
      </div>

      {isError ? (
        <ErrorState message="Failed to load admin stats" onRetry={() => refetch()} />
      ) : (
        <>
          {isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {[1,2,3,4,5,6].map(i => <div key={i} className="bg-white rounded-card shadow-card p-4 animate-pulse"><div className="h-10 bg-accent rounded w-2/3" /></div>)}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {statsCards.map(c => <StatCard key={c.label} {...c} />)}
            </div>
          )}

          {(pendingVerifications > 0 || openDisputes > 0) && (
            <div className="flex flex-wrap gap-3">
              {pendingVerifications > 0 && (
                <Link href="/admin/verifications" className="flex items-center gap-2 px-4 py-2.5 bg-yellow-50 text-yellow-700 border border-yellow-200 rounded-btn text-sm font-medium hover:bg-yellow-100 transition-colors">
                  <ShieldCheck size={16} /> Review Verifications ({pendingVerifications}) <ArrowRight size={14} />
                </Link>
              )}
              {openDisputes > 0 && (
                <Link href="/admin/disputes" className="flex items-center gap-2 px-4 py-2.5 bg-red-50 text-red-700 border border-red-200 rounded-btn text-sm font-medium hover:bg-red-100 transition-colors">
                  <AlertTriangle size={16} /> Resolve Disputes ({openDisputes}) <ArrowRight size={14} />
                </Link>
              )}
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <section className="bg-white rounded-card shadow-card p-4">
              <h2 className="font-semibold text-dark mb-3">Revenue (30 days)</h2>
              <div className="h-40 flex items-end justify-around gap-2 pt-4">
                {Array.from({ length: 30 }).map((_, i) => {
                  const h = Math.sin(i * 0.4) * 25 + 35 + Math.random() * 25;
                  return <div key={i} className="flex-1 bg-primary/20 rounded-t" style={{ height: `${h}%` }} />;
                })}
              </div>
            </section>

            <section className="bg-white rounded-card shadow-card p-4">
              <h2 className="font-semibold text-dark mb-3">Enrolments (30 days)</h2>
              <div className="h-40 flex items-end justify-around gap-2 pt-4">
                {Array.from({ length: 30 }).map((_, i) => {
                  const h = Math.random() * 60 + 10;
                  return <div key={i} className="flex-1 bg-primary/20 rounded-t" style={{ height: `${h}%` }} />;
                })}
              </div>
            </section>
          </div>

          <section className="bg-white rounded-card shadow-card p-4">
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-semibold text-dark">Recent Activity</h2>
            </div>
            {activities.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">Activity will appear here as the platform grows.</p>
            ) : (
              <div className="space-y-3">
                {activities.slice(0, 20).map((a: any, i: number) => {
                  const Icon = ACTIVITY_ICONS[a.type] || MessageCircle;
                  return (
                    <div key={a.id || i} className="flex items-start gap-3 text-sm">
                      <div className="w-8 h-8 bg-accent rounded-full flex items-center justify-center flex-shrink-0">
                        <Icon size={14} className="text-body" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-dark">{a.description}</p>
                        <p className="text-xs text-muted-foreground">{a.timestamp ? formatRelativeTime(a.timestamp) : ''}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        </>
      )}
    </div>
  );
}
