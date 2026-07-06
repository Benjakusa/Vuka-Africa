'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams } from 'next/navigation';
import { useState, useMemo } from 'react';
import { AlertTriangle, Mail, CheckCircle, Calendar, Monitor, MapPin, Clock, ChevronDown, ChevronUp, Star } from 'lucide-react';
import { api } from '@backend/lib/api';
import { enrolmentKeys } from '@backend/lib/query-keys';
import { useAuthStore } from '@frontend/stores/auth-store';
import { MilestoneStepper } from '@frontend/components/shared/milestone-stepper';
import { StatusBadge } from '@frontend/components/shared/status-badge';
import { VerifiedBadge } from '@frontend/components/shared/verified-badge';
import { DisputeModal } from '@frontend/components/shared/dispute-modal';
import { ReviewModal } from '@frontend/components/shared/review-modal';
import { ErrorState } from '@frontend/components/shared/error-state';
import { OfflineBanner } from '@frontend/components/shared/offline-banner';
import { ProfileSkeleton } from '@frontend/components/shared/loading-skeleton';
import { formatCurrency, formatDateTime, formatDate } from '@backend/lib/utils';
import { toast } from 'sonner';

export default function EnrolmentDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const queryClient = useQueryClient();
  const { user } = useAuthStore();

  const [showDispute, setShowDispute] = useState(false);
  const [showReview, setShowReview] = useState(false);
  const [showSessions, setShowSessions] = useState(false);

  const { data: res, isLoading, isError, refetch } = useQuery({
    queryKey: enrolmentKeys.detail(id),
    queryFn: () => api.get<any>(`/enrolments/${id}`),
    enabled: !!id,
  });

  const enrolment = res?.data;
  const isCompleted = enrolment?.status === 'COMPLETED';

  const confirmMutation = useMutation({
    mutationFn: (milestoneId: string) =>
      api.post(`/enrolments/${id}/milestones/${milestoneId}/trainee-confirm`),
    onMutate: async (milestoneId) => {
      await queryClient.cancelQueries({ queryKey: enrolmentKeys.detail(id) });
      const prev = queryClient.getQueryData(enrolmentKeys.detail(id));
      queryClient.setQueryData(enrolmentKeys.detail(id), (old: any) => ({
        ...old,
        data: {
          ...old?.data,
          milestones: old?.data?.milestones?.map((m: any) =>
            m.id === milestoneId ? { ...m, status: 'TRAINEE_CONFIRMED', traineeConfirmedAt: new Date().toISOString() } : m
          ),
        },
      }));
      return { prev };
    },
    onError: (err: any, _, context) => {
      queryClient.setQueryData(enrolmentKeys.detail(id), context?.prev);
      toast.error(err.message || 'Failed to confirm attendance');
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: enrolmentKeys.detail(id) }),
  });

  const disputeMutation = useMutation({
    mutationFn: ({ milestoneId, reason }: { milestoneId: string | null; reason: string }) =>
      api.post(`/enrolments/${id}/disputes`, { milestoneId, reason }),
    onSuccess: () => {
      toast.success('Dispute submitted. Our team will review within 24 hours.');
      setShowDispute(false);
    },
    onError: (err: any) => toast.error(err.message || 'Failed to raise dispute'),
  });

  const reviewMutation = useMutation({
    mutationFn: ({ rating, comment }: { rating: number; comment: string }) =>
      api.post(`/enrolments/${id}/review`, { rating, comment }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: enrolmentKeys.detail(id) });
      toast.success('Review submitted! Thank you for your feedback.');
      setShowReview(false);
    },
    onError: (err: any) => toast.error(err.message || 'Failed to submit review'),
  });

  const milestoneList = useMemo(() => (enrolment?.milestones || []).map((m: any) => ({
    id: m.id, sequence: m.sequence, label: m.label,
    percentage: m.percentage, amountKes: m.amountKes, status: m.status,
    trainerConfirmedAt: m.trainerConfirmedAt, traineeConfirmedAt: m.traineeConfirmedAt,
  })), [enrolment?.milestones]);

  const sessionHistory = useMemo(() => (enrolment?.sessionLogs || enrolment?.sessions || []), [enrolment]);

  if (isLoading) return <div><ProfileSkeleton /></div>;
  if (isError || !enrolment) return <ErrorState message="Enrolment not found" onRetry={() => refetch()} />;

  const trainer = enrolment.course?.trainer;
  const trainerName = trainer?.user?.fullName || 'Trainer';
  const hasReview = enrolment.reviews && enrolment.reviews.length > 0;

  return (
    <div className="space-y-6 max-w-3xl">
      <OfflineBanner />

      <div className="flex items-center gap-3">
        <StatusBadge status={enrolment.status} />
        <span className="text-xs text-muted-foreground">
          Started {enrolment.startedAt ? formatDate(enrolment.startedAt) : 'N/A'}
        </span>
      </div>

      <h1 className="text-xl font-bold text-dark">{enrolment.course?.title}</h1>

      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xs">
            {trainerName[0]}
          </div>
          <div>
            <div className="flex items-center gap-1">
              <span className="text-sm font-medium text-dark">{trainerName}</span>
              {trainer?.isVerified && <VerifiedBadge isVerified size="sm" />}
            </div>
            <span className="text-xs text-muted-foreground">Trainer</span>
          </div>
        </div>
        {enrolment.course?.mode && (
          <StatusBadge status={enrolment.course.mode} />
        )}
      </div>

      <section>
        <h2 className="text-lg font-semibold text-dark mb-4">Milestone Tracker</h2>
        <MilestoneStepper
          milestones={milestoneList}
          enrolmentStatus={enrolment.status}
          role="TRAINEE"
          onTraineeConfirm={(mid) => confirmMutation.mutate(mid)}
          isPending={confirmMutation.isPending}
        />
      </section>

      {sessionHistory.length > 0 && (
        <section className="bg-white rounded-card shadow-card">
          <button
            onClick={() => setShowSessions(!showSessions)}
            className="w-full flex items-center justify-between p-4 text-left"
          >
            <h3 className="font-medium text-dark">Session History</h3>
            {showSessions ? <ChevronUp size={18} className="text-muted-foreground" /> : <ChevronDown size={18} className="text-muted-foreground" />}
          </button>
          {showSessions && (
            <div className="px-4 pb-4 space-y-2 border-t border-border pt-3">
              {sessionHistory.map((s: any, i: number) => (
                <div key={s.id || i} className="flex items-center gap-3 text-sm">
                  <div className="w-8 h-8 bg-accent rounded-full flex items-center justify-center">
                    {s.mode === 'PHYSICAL' ? <MapPin size={14} className="text-body" /> : <Monitor size={14} className="text-body" />}
                  </div>
                  <div className="flex-1">
                    <p className="text-dark">{formatDate(s.date || s.createdAt)}</p>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span>{s.mode === 'PHYSICAL' ? 'Physical' : 'Virtual'}</span>
                    </div>
                  </div>
                  <CheckCircle size={16} className="text-primary" />
                  {s.mode === 'VIRTUAL' && (
                    <button className="px-2.5 py-1 bg-primary text-white text-xs font-medium rounded-btn hover:bg-primary/90">
                      Join
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      <section className="bg-white rounded-card shadow-card p-4">
        <h3 className="font-medium text-dark mb-3">Payment Summary</h3>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between items-center pb-2 border-b border-border">
            <span className="font-medium text-dark">Total paid</span>
            <span className="font-bold text-dark text-base">{formatCurrency(enrolment.pricePaidKes)}</span>
          </div>
          {milestoneList.map((m: any) => (
            <div key={m.id} className="flex justify-between items-center">
              <div>
                <span className="text-body">{m.label} ({m.percentage}%)</span>
                <span className="text-xs text-muted-foreground ml-2">
                  {m.status === 'RELEASED' ? 'Released' :
                   m.status === 'DISPUTED' ? 'Disputed' :
                   m.status === 'TRAINEE_CONFIRMED' ? 'Cooling off' :
                   'Pending'}
                </span>
              </div>
              <span className={m.status === 'RELEASED' ? 'font-medium text-dark' : 'text-muted-foreground'}>
                {m.status === 'RELEASED' ? formatCurrency(m.amountKes) : formatCurrency(m.amountKes)}
              </span>
            </div>
          ))}
          {enrolment.mpesaReceiptNumber && (
            <div className="pt-2 border-t border-border mt-2">
              <p className="text-xs text-muted-foreground">M-Pesa Receipt: <span className="font-mono">{enrolment.mpesaReceiptNumber}</span></p>
            </div>
          )}
        </div>
      </section>

      {isCompleted && (
        <section className="bg-primary/5 border border-primary/20 rounded-card p-5 text-center">
          <CheckCircle size={40} className="mx-auto text-primary mb-2" />
          <h3 className="text-lg font-semibold text-dark mb-1">Congratulations!</h3>
          <p className="text-sm text-body mb-4">You&apos;ve completed this course.</p>
          {!hasReview ? (
            <button
              onClick={() => setShowReview(true)}
              className="inline-flex items-center gap-2 px-5 py-2 bg-primary text-white font-medium rounded-btn hover:bg-primary/90 transition-colors"
            >
              <Star size={16} /> Leave a Review
            </button>
          ) : (
            <p className="text-xs text-muted-foreground">You&apos;ve already reviewed this course. Thank you!</p>
          )}
        </section>
      )}

      <div className="flex flex-col sm:flex-row gap-3 pt-2 pb-6">
        <a
          href={`mailto:${trainer?.user?.email || ''}?subject=Question about ${enrolment.course?.title || 'my enrolment'}`}
          className="flex items-center justify-center gap-2 px-4 py-2.5 border border-border text-body rounded-btn hover:bg-accent transition-colors text-sm font-medium"
        >
          <Mail size={16} /> Message Trainer
        </a>
        {enrolment.status !== 'COMPLETED' && enrolment.status !== 'CANCELLED' && (
          <button
            onClick={() => setShowDispute(true)}
            className="flex items-center justify-center gap-2 px-4 py-2.5 border border-destructive/30 text-destructive rounded-btn hover:bg-destructive/5 transition-colors text-sm font-medium"
          >
            <AlertTriangle size={16} /> Report an Issue
          </button>
        )}
      </div>

      <DisputeModal
        isOpen={showDispute}
        onClose={() => setShowDispute(false)}
        onSubmit={(milestoneId, reason) => disputeMutation.mutate({ milestoneId, reason })}
        isPending={disputeMutation.isPending}
        milestones={milestoneList}
      />

      <ReviewModal
        isOpen={showReview}
        onClose={() => setShowReview(false)}
        onSubmit={(rating, comment) => reviewMutation.mutate({ rating, comment })}
        isPending={reviewMutation.isPending}
        trainerName={trainerName}
        courseTitle={enrolment.course?.title}
      />
    </div>
  );
}
