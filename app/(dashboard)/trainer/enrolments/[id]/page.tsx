'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams } from 'next/navigation';
import { useState, useMemo } from 'react';
import { ArrowLeft, Mail, Phone, AlertTriangle, Loader2, CheckCircle, Clock, ChevronDown, ChevronUp, Monitor, MapPin } from 'lucide-react';
import Link from 'next/link';
import { api } from '@backend/lib/api';
import { MilestoneStepper } from '@frontend/components/shared/milestone-stepper';
import { StatusBadge } from '@frontend/components/shared/status-badge';
import { VerifiedBadge } from '@frontend/components/shared/verified-badge';
import { DisputeModal } from '@frontend/components/shared/dispute-modal';
import { ErrorState } from '@frontend/components/shared/error-state';
import { OfflineBanner } from '@frontend/components/shared/offline-banner';
import { ProfileSkeleton } from '@frontend/components/shared/loading-skeleton';
import { formatCurrency, formatDate, formatDateTime } from '@backend/lib/utils';
import { toast } from 'sonner';

export default function TrainerEnrolmentDetailPage() {
  const { id } = useParams<{ id: string }>();
  const queryClient = useQueryClient();
  const [showDispute, setShowDispute] = useState(false);
  const [showSessions, setShowSessions] = useState(false);

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['enrolment', id],
    queryFn: () => api.get<any>(`/enrolments/${id}`),
  });

  const enr = data?.data;

  const confirmMutation = useMutation({
    mutationFn: (milestoneId: string) => api.post(`/milestones/${milestoneId}/confirm`, {}),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['enrolment', id] });
      toast.success('Milestone marked as delivered');
    },
    onError: (err: any) => toast.error(err.message),
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

  const milestoneList = useMemo(() => (enr?.milestones || []).map((m: any) => ({
    id: m.id, sequence: m.sequence, label: m.label,
    percentage: m.percentage, amountKes: m.amountKes, status: m.status,
    trainerConfirmedAt: m.trainerConfirmedAt, traineeConfirmedAt: m.traineeConfirmedAt,
  })), [enr?.milestones]);

  const sessionHistory = useMemo(() => (enr?.sessionLogs || enr?.sessions || []), [enr]);

  if (isLoading) return <ProfileSkeleton />;
  if (isError || !enr) return <ErrorState message="Enrolment not found" onRetry={() => refetch()} />;

  const trainee = enr.trainee;
  const traineeName = trainee?.fullName || 'Trainee';
  const traineePhone = trainee?.phone || '';
  const traineeEmail = trainee?.email || '';
  const commissionRate = enr.commissionRate || 20;
  const totalPaid = Number(enr.pricePaidKes || enr.totalPaid || 0);
  const commission = Math.round(totalPaid * (commissionRate / 100));
  const trainerEarnings = totalPaid - commission;

  return (
    <div className="space-y-6 max-w-3xl">
      <OfflineBanner />
      <Link href="/trainer/enrolments" className="flex items-center gap-1.5 text-sm text-primary hover:underline">
        <ArrowLeft size={16} /> Back to Enrolments
      </Link>

      <div className="bg-white rounded-card shadow-card p-6">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-lg">
            {traineeName[0]}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2">
              <h1 className="text-xl font-bold text-dark">{traineeName}</h1>
              <StatusBadge status={enr.status} />
            </div>
            <p className="text-sm text-muted-foreground">{enr.course?.title}</p>
            <div className="flex items-center gap-2 mt-2">
              <StatusBadge status={enr.course?.mode || ''} />
              {enr.course?.duration && (
                <span className="text-xs text-muted-foreground">{enr.course.duration}</span>
              )}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 mt-4 pt-4 border-t border-border text-sm">
          <div><span className="text-muted-foreground">Enrolled:</span> <span className="text-dark">{formatDateTime(enr.createdAt)}</span></div>
          {traineeEmail && (
            <div className="flex items-center gap-1">
              <Mail size={14} className="text-muted-foreground" />
              <a href={`mailto:${traineeEmail}`} className="text-primary hover:underline truncate">{traineeEmail}</a>
            </div>
          )}
          {traineePhone && (
            <div className="flex items-center gap-1">
              <Phone size={14} className="text-muted-foreground" />
              <span className="text-dark">
                {traineePhone.replace(/.(?=.{4})/g, 'X')}
              </span>
            </div>
          )}
        </div>
      </div>

      <section className="bg-white rounded-card shadow-card p-6">
        <h2 className="text-lg font-semibold text-dark mb-4">Milestone Manager</h2>
        <MilestoneStepper
          milestones={milestoneList}
          enrolmentStatus={enr.status}
          role="TRAINER"
          onTrainerConfirm={(mid) => confirmMutation.mutate(mid)}
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
                    <p className="text-xs text-muted-foreground">{s.mode === 'PHYSICAL' ? 'Physical session' : 'Virtual session'}</p>
                  </div>
                  <CheckCircle size={16} className="text-primary" />
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      <section className="bg-white rounded-card shadow-card p-4">
        <h3 className="font-medium text-dark mb-3">Payment Summary</h3>
        <div className="space-y-3 text-sm">
          <div className="flex justify-between items-center pb-2 border-b border-border">
            <span className="text-body">Total course price</span>
            <span className="font-medium text-dark">{formatCurrency(totalPaid)}</span>
          </div>
          {milestoneList.map((m: any) => (
            <div key={m.id} className="flex justify-between items-center">
              <span className="text-body">{m.label} ({m.percentage}%)</span>
              <span className={m.status === 'RELEASED' ? 'font-medium text-dark' : 'text-muted-foreground'}>
                {m.status === 'RELEASED' ? formatCurrency(m.amountKes) : 'Pending'}
              </span>
            </div>
          ))}
          <div className="pt-2 border-t border-border space-y-1">
            <div className="flex justify-between text-muted-foreground">
              <span>Commission ({commissionRate}%)</span>
              <span>-{formatCurrency(commission)}</span>
            </div>
            <div className="flex justify-between font-semibold text-dark">
              <span>Your earnings</span>
              <span>{formatCurrency(trainerEarnings)}</span>
            </div>
          </div>
        </div>
      </section>

      <div className="flex flex-col sm:flex-row gap-3 pt-2 pb-6">
        {traineeEmail && (
          <a
            href={`mailto:${traineeEmail}?subject=Regarding your enrolment in ${enr.course?.title || ''}`}
            className="flex items-center justify-center gap-2 px-4 py-2.5 border border-border text-body rounded-btn hover:bg-accent transition-colors text-sm font-medium"
          >
            <Mail size={16} /> Message Trainee
          </a>
        )}
        {enr.status !== 'COMPLETED' && enr.status !== 'CANCELLED' && (
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
    </div>
  );
}
