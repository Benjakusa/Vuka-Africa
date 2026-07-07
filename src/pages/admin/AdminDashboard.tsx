import { useQuery } from '@tanstack/react-query';
import { Users, UserCheck, BookOpen, GraduationCap, AlertTriangle } from 'lucide-react';
import { getAdminStats } from '@/services/adminService';
import { adminKeys } from '@/lib/query-keys';
import { StatCard } from '@/components/shared/stat-card';
import { CardSkeleton } from '@/components/shared/loading-skeleton';
import { ErrorState } from '@/components/shared/error-state';
import { formatNumber } from '@/lib/utils';

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

  if (isLoading) {
    return (
      <div className="max-w-5xl mx-auto">
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
          {Array.from({ length: 5 }).map((_, i) => (
            <CardSkeleton key={i} />
          ))}
        </div>
      </div>
    );
  }

  if (isError) {
    return <ErrorState message="Failed to load dashboard stats" onRetry={() => refetch()} />;
  }

  return (
    <div className="max-w-5xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-dark">Admin Dashboard</h1>
        <p className="text-body text-sm">Platform overview at a glance</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
        <StatCard
          icon={Users}
          label="Total Users"
          value={formatNumber(stats?.totalUsers || 0)}
          iconBg="bg-blue-50"
          iconColor="text-blue-600"
        />
        <StatCard
          icon={UserCheck}
          label="Trainers"
          value={formatNumber(stats?.totalTrainers || 0)}
          iconBg="bg-green-50"
          iconColor="text-green-600"
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
          iconBg="bg-yellow-50"
          iconColor="text-yellow-600"
        />
        <StatCard
          icon={AlertTriangle}
          label="Open Disputes"
          value={formatNumber(stats?.openDisputes || 0)}
          iconBg="bg-red-50"
          iconColor="text-red-600"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-card shadow-card p-6">
          <h2 className="text-lg font-bold text-dark mb-4">Quick Actions</h2>
          <div className="space-y-3">
            <a
              href="/admin/verifications"
              className="block p-3 bg-surface rounded-card hover:bg-accent transition-colors"
            >
              <p className="font-medium text-dark text-sm">Review Trainer Verifications</p>
              <p className="text-xs text-muted-foreground">Approve or reject pending verification requests</p>
            </a>
            <a href="/admin/disputes" className="block p-3 bg-surface rounded-card hover:bg-accent transition-colors">
              <p className="font-medium text-dark text-sm">Manage Disputes</p>
              <p className="text-xs text-muted-foreground">Resolve open disputes between trainees and trainers</p>
            </a>
            <a href="/admin/users" className="block p-3 bg-surface rounded-card hover:bg-accent transition-colors">
              <p className="font-medium text-dark text-sm">User Management</p>
              <p className="text-xs text-muted-foreground">View, suspend, or activate user accounts</p>
            </a>
            <a href="/admin/config" className="block p-3 bg-surface rounded-card hover:bg-accent transition-colors">
              <p className="font-medium text-dark text-sm">Platform Configuration</p>
              <p className="text-xs text-muted-foreground">Update commission rates and platform settings</p>
            </a>
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
              <span className="text-sm text-body">Total Trainers</span>
              <span className="text-sm font-bold text-dark">{formatNumber(stats?.totalTrainers || 0)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-body">Total Courses</span>
              <span className="text-sm font-bold text-dark">{formatNumber(stats?.totalCourses || 0)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-body">Total Enrolments</span>
              <span className="text-sm font-bold text-dark">{formatNumber(stats?.totalEnrolments || 0)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-body">Open Disputes</span>
              <span className="text-sm font-bold text-dark">{formatNumber(stats?.openDisputes || 0)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
