'use client';

import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { BookOpen, CheckCircle, Wallet, Clock, Star, ArrowRight } from 'lucide-react';
import { BackButton } from '@frontend/components/shared/back-button';
import { api } from '@backend/lib/api';
import { enrolmentKeys } from '@backend/lib/query-keys';
import { useAuthStore } from '@frontend/stores/auth-store';
import { EmptyState } from '@frontend/components/shared/empty-state';
import { CardSkeleton } from '@frontend/components/shared/loading-skeleton';
import { formatCurrency, formatDate } from '@backend/lib/utils';

export default function TraineeDashboard() {
  const { user } = useAuthStore();

  const { data: enrolmentsData, isLoading } = useQuery({
    queryKey: enrolmentKeys.list({ status: 'ACTIVE' }),
    queryFn: () => api.get<any>('/enrolments', { status: 'ACTIVE', page: 1, perPage: 20 }),
  });

  const { data: completedData } = useQuery({
    queryKey: enrolmentKeys.list({ status: 'COMPLETED' }),
    queryFn: () => api.get<any>('/enrolments', { status: 'COMPLETED', page: 1, perPage: 5 }),
  });

  const activeEnrolments = enrolmentsData?.data?.data || [];
  const completedEnrolments = completedData?.data?.data || [];
  const totalSpent = completedEnrolments.reduce((sum: number, e: any) => sum + Number(e.pricePaidKes), 0);
  const pendingReviews = completedEnrolments.filter((e: any) => !e.reviews?.length);

  return (
    <div className="space-y-6">
      <BackButton href="/" />
      <h1 className="text-2xl font-bold text-dark">Hello, {user?.fullName?.split(' ')[0]}!</h1>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-card shadow-card p-4 text-center">
          <div className="w-10 h-10 rounded-full flex items-center justify-center mx-auto mb-2">
            <BookOpen size={20} className="text-primary" />
          </div>
          <p className="text-2xl font-bold text-dark">{activeEnrolments.length}</p>
          <p className="text-xs text-muted-foreground">Active Trainings</p>
        </div>
        <div className="bg-white rounded-card shadow-card p-4 text-center">
          <div className="w-10 h-10 rounded-full flex items-center justify-center mx-auto mb-2">
            <CheckCircle size={20} className="text-primary" />
          </div>
          <p className="text-2xl font-bold text-dark">{completedEnrolments.length}</p>
          <p className="text-xs text-muted-foreground">Completed</p>
        </div>
        <div className="bg-white rounded-card shadow-card p-4 text-center">
          <div className="w-10 h-10 rounded-full flex items-center justify-center mx-auto mb-2">
            <Wallet size={20} className="text-primary" />
          </div>
          <p className="text-2xl font-bold text-dark">{formatCurrency(totalSpent)}</p>
          <p className="text-xs text-muted-foreground">Total Spent</p>
        </div>
      </div>

      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-dark">Active Enrolments</h2>
          <Link href="/dashboard/trainee/enrolments" className="text-sm text-primary hover:underline">View all</Link>
        </div>
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2].map(i => <CardSkeleton key={i} />)}
          </div>
        ) : activeEnrolments.length === 0 ? (
          <EmptyState
            icon={BookOpen}
            title="No active enrolments"
            subtitle="Start learning by browsing available trainers"
            action={{ label: 'Browse Trainers', href: '/trainers' }}
          />
        ) : (
          <div className="space-y-3">
            {activeEnrolments.map((e: any) => {
              const progress = e.milestones?.filter((m: any) => m.status === 'RELEASED').length || 0;
              const pct = Math.round((progress / 3) * 100);
              return (
                <Link key={e.id} href={`/dashboard/trainee/enrolments/${e.id}`} className="block bg-white rounded-card shadow-card p-4 hover:shadow-cardHover transition-shadow">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                      {e.course?.title?.[0]}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-sm text-dark truncate">{e.course?.title}</h3>
                      <p className="text-xs text-muted-foreground">Progress: {progress}/3 milestones</p>
                      <div className="mt-2 h-2 bg-accent rounded-full">
                        <div className="h-2 bg-primary rounded-full transition-all" style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                    <ArrowRight size={18} className="text-muted-foreground flex-shrink-0 mt-2" />
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </section>

      <section>
        <h2 className="text-lg font-semibold text-dark mb-4">Upcoming Sessions</h2>
        <div className="bg-white rounded-card shadow-card p-4">
          <p className="text-sm text-muted-foreground">No upcoming sessions scheduled.</p>
        </div>
      </section>

      {pendingReviews.length > 0 && (
        <section className="bg-warning/5 border border-warning/20 rounded-card p-4">
          <div className="flex items-center gap-3">
            <Star size={20} className="text-warning" />
            <div className="flex-1">
              <p className="text-sm font-medium text-dark">
                You have {pendingReviews.length} course{pendingReviews.length > 1 ? 's' : ''} waiting for review
              </p>
            </div>
            <Link href="/dashboard/trainee/reviews" className="text-sm text-primary font-medium hover:underline">
              Write a Review
            </Link>
          </div>
        </section>
      )}
    </div>
  );
}
