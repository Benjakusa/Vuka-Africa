import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useParams } from 'react-router-dom';
import { BookOpen, MapPin, Calendar, Wallet, CheckCircle, XCircle, DollarSign } from 'lucide-react';
import { toast } from 'sonner';

import { getEnrolment, confirmMilestone, acceptEnrolment, rejectEnrolment } from '@/services/enrolmentService';
import { enrolmentKeys } from '@/lib/query-keys';
import { BackButton } from '@/components/shared/back-button';
import { StatusBadge } from '@/components/shared/status-badge';
import { MilestoneStepper } from '@/components/shared/milestone-stepper';
import { MilestoneManager } from '@/components/shared/milestone-manager';
import { CardSkeleton } from '@/components/shared/loading-skeleton';
import { ErrorState } from '@/components/shared/error-state';
import { AcceptEnrolmentModal } from '@/components/shared/accept-enrolment-modal';
import { MaterialsSection } from '@/components/shared/materials-section';
import { formatCurrency, formatDate, getInitials } from '@/lib/utils';

export default function TrainerEnrolmentDetail() {
  const { id } = useParams<{ id: string }>();
  const queryClient = useQueryClient();
  const [confirming, setConfirming] = useState<string | null>(null);
  const [actionModal, setActionModal] = useState<'accept' | 'reject' | null>(null);

  const {
    data: enrolment,
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: enrolmentKeys.detail(id!),
    queryFn: () => getEnrolment(id!),
    enabled: !!id,
  });

  const handleConfirmMilestone = async (milestoneId: string) => {
    setConfirming(milestoneId);
    try {
      await confirmMilestone(milestoneId, 'trainer');
      toast.success('Milestone confirmed');
      refetch();
    } catch (err: any) {
      toast.error(err.message || 'Failed to confirm milestone');
    } finally {
      setConfirming(null);
    }
  };

  const handleAccept = async () => {
    await acceptEnrolment(id!);
    toast.success('Enrolment accepted');
    queryClient.invalidateQueries({ queryKey: enrolmentKeys.all });
    refetch();
  };

  const handleReject = async (reason?: string) => {
    await rejectEnrolment(id!, reason || '');
    toast.success('Enrolment rejected');
    queryClient.invalidateQueries({ queryKey: enrolmentKeys.all });
    refetch();
  };

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto">
        <CardSkeleton />
        <div className="mt-4">
          <CardSkeleton />
        </div>
      </div>
    );
  }

  if (isError || !enrolment) {
    return <ErrorState message="Failed to load enrolment" />;
  }

  const course = enrolment.course || {};
  const trainee = enrolment.trainee || {};
  const milestones = enrolment.milestones || [];
  const isPending = enrolment.status === 'PENDING_ACCEPTANCE';
  const isRejected = enrolment.status === 'REJECTED';
  const isActive = enrolment.status === 'ACTIVE';

  return (
    <div className="max-w-4xl mx-auto">
      <BackButton href="/trainer/enrolments" label="Back to Enrolments" />

      <div className="bg-white rounded-card shadow-card p-6 mb-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1 min-w-0">
            <h1 className="text-xl font-bold text-dark mb-1">{course.title || 'Course'}</h1>
            <p className="text-xs text-body-foreground">Enrolled {formatDate(enrolment.createdAt)}</p>
          </div>
          <StatusBadge status={enrolment.status} />
        </div>

        {isRejected && enrolment.rejectionReason && (
          <div className="mb-4 p-3 bg-primary border border-primary rounded-card">
            <p className="text-sm font-medium text-primary">Rejection Reason</p>
            <p className="text-sm text-primary mt-1">{enrolment.rejectionReason}</p>
          </div>
        )}

        <div className="flex flex-wrap gap-4 text-sm text-body mb-4">
          <span className="flex items-center gap-1">
            <MapPin size={14} className="text-body-foreground" />
            {course.mode || 'N/A'}
          </span>
          <span className="flex items-center gap-1">
            <Calendar size={14} className="text-body-foreground" />
            {course.duration || 'Flexible'}
          </span>
          <span className="flex items-center gap-1">
            <BookOpen size={14} className="text-body-foreground" />
            {course.sessionCount || 0} sessions
          </span>
        </div>

        {enrolment.pricePaidKes && (
          <div className="bg-surface rounded-card p-4 space-y-2">
            <div className="flex items-center gap-2 text-sm font-medium text-dark mb-2">
              <Wallet size={16} className="text-primary" />
              Payment Breakdown
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-body">Course Price</span>
              <span className="font-medium text-dark">{formatCurrency(enrolment.pricePaidKes)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-body">Platform Fee</span>
              <span className="font-medium text-primary">-{formatCurrency(enrolment.commissionKes || 0)}</span>
            </div>
            <hr className="border-border/50" />
            <div className="flex justify-between text-sm font-semibold">
              <span className="text-dark">Your Earnings</span>
              <span className="text-primary">{formatCurrency(enrolment.trainerPayoutKes || 0)}</span>
            </div>
          </div>
        )}

        {isPending && (
          <div className="flex gap-3 mt-4">
            <button
              onClick={() => setActionModal('accept')}
              className="flex items-center gap-2 px-5 py-2.5 bg-surface text-white font-medium rounded-btn hover:bg-surface transition-colors text-sm"
            >
              <CheckCircle size={16} />
              Accept Enrolment
            </button>
            <button
              onClick={() => setActionModal('reject')}
              className="flex items-center gap-2 px-5 py-2.5 border border-destructive text-primary font-medium rounded-btn hover:bg-primary transition-colors text-sm"
            >
              <XCircle size={16} />
              Reject
            </button>
          </div>
        )}
      </div>

      <div className="bg-white rounded-card shadow-card p-6 mb-6">
        <h2 className="text-lg font-bold text-dark mb-4">Trainee</h2>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-surface flex items-center justify-center text-primary font-bold">
            {getInitials(trainee.fullName || 'T')}
          </div>
          <div>
            <p className="font-medium text-dark">{trainee.fullName || 'Unknown'}</p>
            <p className="text-xs text-body-foreground">
              {trainee.email} • {trainee.phone}
            </p>
          </div>
        </div>
      </div>

      {(isActive || enrolment.status === 'COMPLETED') && (
        <div className="mb-6">
          <MaterialsSection enrolmentId={enrolment.id} isTrainer={true} enrolmentStatus={enrolment.status} />
        </div>
      )}

      {(isActive || enrolment.status === 'COMPLETED') && (
        <div className="bg-white rounded-card shadow-card p-6 mb-6">
          <MilestoneManager
            enrolmentId={enrolment.id}
            role="trainer"
            courseSessionCount={course.sessionCount || 10}
            milestones={milestones}
            onRefresh={refetch}
          />
        </div>
      )}

      {(isActive || enrolment.status === 'COMPLETED') && milestones.length > 0 && (
        <div className="bg-white rounded-card shadow-card p-6 mb-6">
          <div className="flex items-center gap-2 mb-4">
            <DollarSign size={16} className="text-body-foreground" />
            <h2 className="text-lg font-bold text-dark">Escrow Confirmation</h2>
          </div>
          <p className="text-xs text-body-foreground mb-4">
            Both parties must confirm milestones to release funds. This is separate from session tracking.
          </p>
          <MilestoneStepper
            milestones={milestones}
            role="trainer"
            onConfirm={handleConfirmMilestone}
            confirming={confirming}
          />
        </div>
      )}

      <AcceptEnrolmentModal
        open={actionModal !== null}
        mode={actionModal || 'accept'}
        onClose={() => setActionModal(null)}
        onConfirm={actionModal === 'accept' ? handleAccept : handleReject}
        traineeName={trainee.fullName}
        courseTitle={course.title}
      />
    </div>
  );
}
