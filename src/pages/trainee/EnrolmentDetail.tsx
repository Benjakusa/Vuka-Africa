import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useParams, Link } from 'react-router-dom';
import { BookOpen, User, MapPin, Monitor, Globe, Calendar } from 'lucide-react';
import { toast } from 'sonner';
import { useAuthStore } from '@/stores/auth-store';
import { getEnrolment, createDispute, createReview } from '@/services/enrolmentService';
import { enrolmentKeys } from '@/lib/query-keys';
import { BackButton } from '@/components/shared/back-button';
import { StatusBadge } from '@/components/shared/status-badge';
import { DisputeModal } from '@/components/shared/dispute-modal';
import { ReviewModal } from '@/components/shared/review-modal';
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

  const handleDispute = async (data: { reason: string; description: string }) => {
    if (!enrolment || !user) return;
    await createDispute(enrolment.id, {
      raisedBy: user.id,
      reason: data.reason,
      description: data.description,
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
  const hasReview = enrolment.reviews && enrolment.reviews.length > 0;
  const isCompleted = enrolment.status === 'COMPLETED';
  const hasDispute = enrolment.disputeStatus === 'OPEN';

  const modeIcon = course.mode === 'PHYSICAL' ? MapPin : course.mode === 'VIRTUAL' ? Monitor : Globe;

  return (
    <div className="max-w-4xl mx-auto">
      <BackButton href="/trainee/enrolments" label="Back to Enrolments" />

      <div className="bg-white rounded-card shadow-card p-6 mb-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1 min-w-0">
            <h1 className="text-xl font-bold text-dark mb-1">{course.title || 'Course'}</h1>
            <p className="text-xs text-muted-foreground">Enrolled {formatDate(enrolment.createdAt)}</p>
          </div>
          <StatusBadge status={enrolment.status} />
        </div>

        <div className="flex flex-wrap gap-4 text-sm text-body mb-4">
          <span className="flex items-center gap-1">
            <MapPin size={14} className="text-muted-foreground" />
            {course.mode || 'N/A'}
          </span>
          <span className="flex items-center gap-1">
            <Calendar size={14} className="text-muted-foreground" />
            {course.duration || 'Flexible'}
          </span>
          <span className="flex items-center gap-1">
            <BookOpen size={14} className="text-muted-foreground" />
            {course.sessionCount || 0} sessions
          </span>
        </div>

        {enrolment.pricePaidKes && <p className="text-primary font-bold">{formatCurrency(enrolment.pricePaidKes)}</p>}
      </div>

      <div className="bg-white rounded-card shadow-card p-6 mb-6">
        <h2 className="text-lg font-bold text-dark mb-4">Trainer</h2>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
            {getInitials(trainer.fullName || 'T')}
          </div>
          <div>
            <p className="font-medium text-dark">
              {trainer.fullName || 'Unknown'}{' '}
              {trainer.isVerified && <span className="text-xs text-green-600">✓ Verified</span>}
            </p>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap gap-3">
        {isCompleted && !hasReview && (
          <button
            onClick={() => setShowReview(true)}
            className="px-4 py-2 bg-primary text-white text-sm font-medium rounded-btn hover:bg-primary/90"
          >
            Write Review
          </button>
        )}

        {!hasDispute && !isCompleted && (
          <button
            onClick={() => setShowDispute(true)}
            className="px-4 py-2 border border-destructive text-destructive text-sm font-medium rounded-btn hover:bg-destructive/5"
          >
            Raise Dispute
          </button>
        )}

        {hasDispute && <p className="text-sm text-yellow-600 font-medium">Dispute in progress</p>}
      </div>

      <DisputeModal open={showDispute} onClose={() => setShowDispute(false)} onSubmit={handleDispute} />
      <ReviewModal open={showReview} onClose={() => setShowReview(false)} onSubmit={handleReview} />
    </div>
  );
}
