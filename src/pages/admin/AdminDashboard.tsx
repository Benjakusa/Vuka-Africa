import { useQuery } from '@tanstack/react-query';
import {
  Users,
  UserCheck,
  BookOpen,
  GraduationCap,
  AlertTriangle,
  Wallet,
  Clock,
  Activity,
  ShieldCheck,
  DollarSign,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { getAdminStats, getAdminEarnings } from '@/services/adminService';
import { getEnrolments } from '@/services/enrolmentService';
import { adminKeys } from '@/lib/query-keys';
import { StatCard } from '@/components/shared/stat-card';
import { CardSkeleton } from '@/components/shared/loading-skeleton';
import { ErrorState } from '@/components/shared/error-state';
import { supabase } from '@/lib/supabase';
import { formatCurrency, formatNumber, timeAgo } from '@/lib/utils';

export default function AdminDashboard() {
  const {
    data: stats,
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: adminKeys.stats,
    queryFn: getAdminStats,
  });

  const { data: earnings } = useQuery({
    queryKey: adminKeys.earnings,
    queryFn: getAdminEarnings,
  });

  if (isLoading) {
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

  if (isError) {
    return <ErrorState message="Failed to load dashboard stats" onRetry={() => refetch()} />;
  }

  const totalTrainees = (stats?.totalUsers || 0) - (stats?.totalTrainers || 0);

  return (
    <div className="max-w-5xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-dark">Admin Dashboard</h1>
        <p className="text-body text-sm">Platform overview at a glance</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard
          icon={Users}
          label="Total Users"
          value={formatNumber(stats?.totalUsers || 0)}
          iconBg="bg-surface"
          iconColor="text-foreground"
        />
        <StatCard
          icon={UserCheck}
          label="Trainers"
          value={formatNumber(stats?.totalTrainers || 0)}
          iconBg="bg-surface"
          iconColor="text-foreground"
        />
        <StatCard
          icon={GraduationCap}
          label="Trainees"
          value={formatNumber(totalTrainees)}
          iconBg="bg-surface"
          iconColor="text-foreground"
        />
        <StatCard
          icon={BookOpen}
          label="Courses"
          value={formatNumber(stats?.totalCourses || 0)}
          iconBg="bg-purple-50"
          iconColor="text-purple-600"
        />
        <StatCard
          icon={GraduationCap}
          label="Enrolments"
          value={formatNumber(stats?.totalEnrolments || 0)}
          iconBg="bg-surface"
          iconColor="text-body"
        />
        <StatCard
          icon={DollarSign}
          label="Total Earnings"
          value={formatCurrency(earnings?.totalCommissions || 0)}
          iconBg="bg-surface"
          iconColor="text-foreground"
        />
        <StatCard
          icon={Clock}
          label="Pending Payouts"
          value={`${formatNumber(earnings?.pendingPayoutsCount || 0)} (${formatCurrency(earnings?.pendingPayouts || 0)})`}
          iconBg="bg-surface"
          iconColor="text-body"
        />
        <StatCard
          icon={AlertTriangle}
          label="Open Disputes"
          value={formatNumber(stats?.openDisputes || 0)}
          iconBg="bg-primary"
          iconColor="text-primary"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <div className="bg-white rounded-card shadow-card p-6">
          <h2 className="text-lg font-bold text-dark mb-4">Needs Attention</h2>
          <div className="space-y-3">
            <Link
              to="/admin/verifications"
              className="flex items-center justify-between p-3 bg-surface rounded-card hover:bg-accent transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-surface flex items-center justify-center">
                  <ShieldCheck size={18} className="text-body" />
                </div>
                <div>
                  <p className="text-sm font-medium text-dark">Pending Verifications</p>
                  <p className="text-xs text-body-foreground">Review trainer verification requests</p>
                </div>
              </div>
              <span className="text-xs font-bold text-body">Review</span>
            </Link>
            <Link
              to="/admin/disputes"
              className="flex items-center justify-between p-3 bg-surface rounded-card hover:bg-accent transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-primary flex items-center justify-center">
                  <AlertTriangle size={18} className="text-primary" />
                </div>
                <div>
                  <p className="text-sm font-medium text-dark">Open Disputes</p>
                  <p className="text-xs text-body-foreground">
                    {formatNumber(stats?.openDisputes || 0)} disputes need resolution
                  </p>
                </div>
              </div>
              <span className="text-xs font-bold text-primary">{formatNumber(stats?.openDisputes || 0)}</span>
            </Link>
            <Link
              to="/admin/earnings"
              className="flex items-center justify-between p-3 bg-surface rounded-card hover:bg-accent transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-surface flex items-center justify-center">
                  <Wallet size={18} className="text-body" />
                </div>
                <div>
                  <p className="text-sm font-medium text-dark">Pending Payouts</p>
                  <p className="text-xs text-body-foreground">
                    {formatCurrency(earnings?.pendingPayouts || 0)} to process
                  </p>
                </div>
              </div>
              <span className="text-xs font-bold text-body">{formatCurrency(earnings?.pendingPayouts || 0)}</span>
            </Link>
          </div>
        </div>

        <RecentActivity />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-card shadow-card p-6">
          <h2 className="text-lg font-bold text-dark mb-4">Quick Actions</h2>
          <div className="grid grid-cols-2 gap-3">
            <Link to="/admin/earnings" className="block p-3 bg-surface rounded-card hover:bg-accent transition-colors">
              <Wallet size={18} className="text-primary mb-1" />
              <p className="font-medium text-dark text-sm">Earnings</p>
              <p className="text-xs text-body-foreground">View financials</p>
            </Link>
            <Link to="/admin/courses" className="block p-3 bg-surface rounded-card hover:bg-accent transition-colors">
              <BookOpen size={18} className="text-primary mb-1" />
              <p className="font-medium text-dark text-sm">Courses</p>
              <p className="text-xs text-body-foreground">Manage courses</p>
            </Link>
            <Link
              to="/admin/verifications"
              className="block p-3 bg-surface rounded-card hover:bg-accent transition-colors"
            >
              <ShieldCheck size={18} className="text-primary mb-1" />
              <p className="font-medium text-dark text-sm">Verifications</p>
              <p className="text-xs text-body-foreground">Review trainers</p>
            </Link>
            <Link to="/admin/disputes" className="block p-3 bg-surface rounded-card hover:bg-accent transition-colors">
              <AlertTriangle size={18} className="text-primary mb-1" />
              <p className="font-medium text-dark text-sm">Disputes</p>
              <p className="text-xs text-body-foreground">Resolve issues</p>
            </Link>
            <Link to="/admin/users" className="block p-3 bg-surface rounded-card hover:bg-accent transition-colors">
              <Users size={18} className="text-primary mb-1" />
              <p className="font-medium text-dark text-sm">Users</p>
              <p className="text-xs text-body-foreground">Manage accounts</p>
            </Link>
            <Link to="/admin/config" className="block p-3 bg-surface rounded-card hover:bg-accent transition-colors">
              <Activity size={18} className="text-primary mb-1" />
              <p className="font-medium text-dark text-sm">Settings</p>
              <p className="text-xs text-body-foreground">Platform config</p>
            </Link>
          </div>
        </div>

        <div className="bg-white rounded-card shadow-card p-6">
          <h2 className="text-lg font-bold text-dark mb-4">Platform Stats</h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-body">Total Users</span>
              <span className="text-sm font-bold text-dark">{formatNumber(stats?.totalUsers || 0)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-body">Trainers</span>
              <span className="text-sm font-bold text-dark">{formatNumber(stats?.totalTrainers || 0)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-body">Trainees</span>
              <span className="text-sm font-bold text-dark">{formatNumber(totalTrainees)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-body">Courses</span>
              <span className="text-sm font-bold text-dark">{formatNumber(stats?.totalCourses || 0)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-body">Enrolments</span>
              <span className="text-sm font-bold text-dark">{formatNumber(stats?.totalEnrolments || 0)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-body">Total Commissions</span>
              <span className="text-sm font-bold text-dark">{formatCurrency(earnings?.totalCommissions || 0)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-body">Pending Payouts</span>
              <span className="text-sm font-bold text-body">{formatCurrency(earnings?.pendingPayouts || 0)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-body">Open Disputes</span>
              <span className="text-sm font-bold text-primary">{formatNumber(stats?.openDisputes || 0)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function RecentActivity() {
  const { data: recentEnrolments, isLoading: loadingEnrolments } = useQuery({
    queryKey: ['admin', 'recent-enrolments'],
    queryFn: () => getEnrolments({ limit: 5 }),
  });

  const { data: recentPayouts } = useQuery({
    queryKey: ['admin', 'recent-payouts'],
    queryFn: async () => {
      const { data } = await supabase
        .from('Payout')
        .select('*, trainer:Trainer!trainerId(user:User!userId(fullName))')
        .order('createdAt', { ascending: false })
        .limit(5);
      return data || [];
    },
  });

  const { data: recentDisputes } = useQuery({
    queryKey: ['admin', 'recent-disputes'],
    queryFn: async () => {
      const { data } = await supabase
        .from('Dispute')
        .select('*, enrolment:Enrolment(course:Course(title))')
        .order('createdAt', { ascending: false })
        .limit(5);
      return data || [];
    },
  });

  return (
    <div className="bg-white rounded-card shadow-card p-6">
      <h2 className="text-lg font-bold text-dark mb-4">Recent Activity</h2>

      <div className="space-y-4">
        <div>
          <h3 className="text-xs font-semibold text-body-foreground uppercase tracking-wider mb-2">
            Recent Enrolments
          </h3>
          {loadingEnrolments ? (
            <CardSkeleton />
          ) : recentEnrolments?.length ? (
            <div className="space-y-1.5">
              {recentEnrolments.slice(0, 5).map((e: any) => (
                <div key={e.id} className="flex items-center justify-between py-1.5">
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-medium text-dark truncate">{e.course?.title || 'Course'}</p>
                    <p className="text-xs text-body-foreground">{e.trainee?.fullName || 'Trainee'}</p>
                  </div>
                  <span className="text-xs text-body-foreground shrink-0 ml-2">{timeAgo(e.createdAt)}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-body-foreground py-2">No enrolments yet</p>
          )}
        </div>

        <div className="border-t border-border pt-3">
          <h3 className="text-xs font-semibold text-body-foreground uppercase tracking-wider mb-2">Recent Payouts</h3>
          {recentPayouts?.length ? (
            <div className="space-y-1.5">
              {recentPayouts.map((p: any) => (
                <div key={p.id} className="flex items-center justify-between py-1.5">
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-medium text-dark truncate">{p.trainer?.user?.fullName || 'Trainer'}</p>
                    <p className="text-xs text-body-foreground">{formatCurrency(p.amount)}</p>
                  </div>
                  <span className="text-xs text-body-foreground shrink-0 ml-2">{timeAgo(p.createdAt)}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-body-foreground py-2">No payouts yet</p>
          )}
        </div>

        <div className="border-t border-border pt-3">
          <h3 className="text-xs font-semibold text-body-foreground uppercase tracking-wider mb-2">Recent Disputes</h3>
          {recentDisputes?.length ? (
            <div className="space-y-1.5">
              {recentDisputes.map((d: any) => (
                <div key={d.id} className="flex items-center justify-between py-1.5">
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-medium text-dark truncate">{d.enrolment?.course?.title || 'Course'}</p>
                    <p className="text-xs text-body-foreground">{d.status}</p>
                  </div>
                  <span className="text-xs text-body-foreground shrink-0 ml-2">{timeAgo(d.createdAt)}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-body-foreground py-2">No disputes</p>
          )}
        </div>
      </div>
    </div>
  );
}
