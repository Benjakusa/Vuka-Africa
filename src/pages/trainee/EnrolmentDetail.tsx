import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useParams } from 'react-router-dom';
import { BookOpen, MapPin, Calendar, Clock, AlertTriangle } from 'lucide-react';

import { useAuthStore } from '@/stores/auth-store';
import { getEnrolment, createDispute, createReview } from '@/services/enrolmentService';
import { enrolmentKeys } from '@/lib/query-keys';
import { BackButton } from '@/components/shared/back-button';
import { StatusBadge } from '@/components/shared/status-badge';
import { DisputeModal } from '@/components/shared/dispute-modal';
import { ReviewModal } from '@/components/shared/review-modal';

import { MilestoneManager } from '@/components/shared/milestone-manager';
import { MaterialsSection } from '@/components/shared/materials-section';
import { CardSkeleton } from '@/components/shared/loading-skeleton';
import { ErrorState } from '@/components/shared/error-state';
import { formatCurrency, formatDate, getInitials } from '@/lib/utils';

export default function EnrolmentDetail() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuthStore();
  const [showDispute, setShowDispute] = useState(false);
  const [showReview, setShowReview] = useState(false);
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

  const handleDispute = async (data: { reason: string; description?: string }) => {
    if (!enrolment || !user) return;
    const fullReason = data.description ? `${data.reason}: ${data.description}` : data.reason;
    await createDispute(enrolment.id, {
      raisedById: user.id,
      reason: fullReason,
    });
    setShowDispute(false);
    refetch();
  };

  const handleReview = async (data: { rating: number; comment: string }) => {
    if (!enrolment || !user) return;
    const trainerId = enrolment.trainerId || enrolment.trainer?.id;
    if (!trainerId) throw new Error('Trainer not found');
    await createReview({
      enrolmentId: enrolment.id,
      traineeId: user.id,
      trainerId,
      rating: data.rating,
      comment: data.comment,
    });
    setShowReview(false);
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
  const trainer = enrolment.trainer || {};
  const milestones = enrolment.milestones || [];
  const hasReview = enrolment.reviews && enrolment.reviews.length > 0;
  const isCompleted = enrolment.status === 'COMPLETED';
  const hasDispute = enrolment.disputeStatus === 'OPEN';
  const isPendingAcceptance = enrolment.status === 'PENDING_ACCEPTANCE';
  const isRejected = enrolment.status === 'REJECTED';
  const isActive = enrolment.status === 'ACTIVE';
  const allSessionsDone = milestones.length > 0 && milestones.every((m: any) => m.status === 'COMPLETED');
  const canReview = !hasReview && (isCompleted || allSessionsDone);
  const progressPercent =
    milestones.length > 0
      ? Math.round((milestones.filter((m: any) => m.status === 'COMPLETED').length / milestones.length) * 100)
      : 0;

  return (
    <div className="max-w-4xl mx-auto">
      <BackButton href="/trainee/enrolments" label="Back to Enrolments" />

      <div className="bg-white rounded-card shadow-card p-6 mb-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1 min-w-0">
            <h1 className="text-xl font-bold text-dark mb-1">{course.title || 'Course'}</h1>
            <p className="text-xs text-body-foreground">Enrolled {formatDate(enrolment.createdAt)}</p>
          </div>
          <StatusBadge status={enrolment.status} />
        </div>

        {isPendingAcceptance && (
          <div className="mb-4 p-4 bg-surface border border-border rounded-card flex items-start gap-3">
            <Clock size={20} className="text-body mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-sm font-medium text-body">Awaiting Trainer Approval</p>
              <p className="text-sm text-body mt-1">
                Your enrolment has been received. The trainer will review and accept it shortly.
              </p>
            </div>
          </div>
        )}

        {isRejected && (
          <div className="mb-4 p-4 bg-primary border border-primary rounded-card flex items-start gap-3">
            <AlertTriangle size={20} className="text-primary mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-sm font-medium text-primary">Enrolment Rejected</p>
              <p className="text-sm text-primary mt-1">The trainer has declined your enrolment.</p>
              {enrolment.rejectionReason && (
                <p className="text-sm text-primary mt-2 italic">Reason: &ldquo;{enrolment.rejectionReason}&rdquo;</p>
              )}
            </div>
          </div>
        )}

        {isActive && progressPercent > 0 && (
          <div className="mb-4">
            <div className="flex items-center justify-between text-sm mb-1">
              <span className="text-body">Course Progress</span>
              <span className="font-medium text-dark">{progressPercent}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-primary h-2 rounded-full transition-all duration-500"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
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

        {enrolment.pricePaidKes && <p className="text-primary font-bold">{formatCurrency(enrolment.pricePaidKes)}</p>}
      </div>

      <div className="bg-white rounded-card shadow-card p-6 mb-6">
        <h2 className="text-lg font-bold text-dark mb-4">Trainer</h2>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-surface flex items-center justify-center text-primary font-bold">
            {getInitials(trainer.fullName || 'T')}
          </div>
          <div>
            <p className="font-medium text-dark">
              {trainer.fullName || 'Unknown'}{' '}
              {trainer.isVerified && <span className="text-xs text-foreground">✓ Verified</span>}
            </p>
          </div>
        </div>
      </div>

      {(isActive || isCompleted) && (
        <div className="mb-6">
          <MaterialsSection enrolmentId={enrolment.id} isTrainer={false} enrolmentStatus={enrolment.status} />
        </div>
      )}

      {(isActive || isCompleted) && (
        <div className="bg-white rounded-card shadow-card p-6 mb-6">
          <MilestoneManager
            enrolmentId={enrolment.id}
            role="trainee"
            courseSessionCount={course.sessionCount || 10}
            milestones={milestones}
            onRefresh={refetch}
          />
        </div>
      )}

      <div className="flex flex-wrap gap-3">
        {canReview && (
          <button
            onClick={() => setShowReview(true)}
            className="px-4 py-2 bg-primary text-white text-sm font-medium rounded-btn hover:bg-surface"
          >
            Write Review
          </button>
        )}

        {!hasDispute && !isCompleted && !isPendingAcceptance && !isRejected && (
          <button
            onClick={() => setShowDispute(true)}
            className="px-4 py-2 border border-destructive text-primary text-sm font-medium rounded-btn hover:bg-primary text-white/5"
          >
            Raise Dispute
          </button>
        )}

        {hasDispute && <p className="text-sm text-body font-medium">Dispute in progress</p>}
      </div>

      <DisputeModal open={showDispute} onClose={() => setShowDispute(false)} onSubmit={handleDispute} />
      <ReviewModal open={showReview} onClose={() => setShowReview(false)} onSubmit={handleReview} />
    </div>
  );
}
