import { useQuery } from '@tanstack/react-query';
import { useParams } from 'react-router-dom';
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { CheckCircle, MapPin, Monitor, Globe, Clock, Users } from 'lucide-react';
import { BackButton } from '@/components/shared/back-button';
import { courseKeys } from '@/lib/query-keys';
import { getCourseBySlug } from '@/services/courseService';
import { supabase } from '@/lib/supabase';
import { VerifiedBadge } from '@/components/shared/verified-badge';
import { RatingStars } from '@/components/shared/rating-stars';
import { ErrorState } from '@/components/shared/error-state';
import { ProfileSkeleton } from '@/components/shared/loading-skeleton';
import { MpesaPaymentModal } from '@/components/payment/mpesa-payment-modal';
import { useAuthStore } from '@/stores/auth-store';
import { formatCurrency } from '@/lib/utils';

const modeConfig: Record<string, { icon: any; label: string }> = {
  PHYSICAL: { icon: MapPin, label: 'Physical' },
  VIRTUAL: { icon: Monitor, label: 'Virtual' },
  HYBRID: { icon: Globe, label: 'Hybrid' },
};

export default function CourseDetail() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuthStore();
  const [showPayment, setShowPayment] = useState(false);

  const {
    data: course,
    isLoading,
    isError,
  } = useQuery({
    queryKey: courseKeys.detail(slug!),
    queryFn: () => getCourseBySlug(slug!),
    enabled: !!slug,
  });

  const { data: existingEnrolment } = useQuery({
    queryKey: ['enrolment', 'check', course?.id, user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from('Enrolment')
        .select('id, status')
        .eq('courseId', course!.id)
        .eq('traineeId', user!.id)
        .maybeSingle();
      return data;
    },
    enabled: !!course?.id && !!user?.id && user?.role === 'TRAINEE',
  });

  const isEnrolled = !!existingEnrolment;

  const handleEnrol = () => {
    if (!isAuthenticated) {
      navigate(`/auth/login?redirect=/course/${slug}`);
      return;
    }
    if (user?.role !== 'TRAINEE') return;
    if (isEnrolled) return;
    setShowPayment(true);
  };

  if (isLoading)
    return (
      <div className="max-w-6xl mx-auto px-4 py-8">
        <ProfileSkeleton />
      </div>
    );
  if (isError || !course)
    return (
      <div className="max-w-6xl mx-auto px-4 py-8">
        <ErrorState message="Course not found" />
      </div>
    );

  const cfg = modeConfig[course.mode as string];
  const ModeIcon = cfg?.icon || MapPin;

  return (
    <>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <BackButton href="/trainers" label="Back to Trainers" />
        <nav className="text-sm text-muted-foreground mb-6">
          <Link to="/" className="hover:text-dark">
            Home
          </Link>
          <span className="mx-2">/</span>
          <Link to="/trainers" className="hover:text-dark">
            Trainers
          </Link>
          <span className="mx-2">/</span>
          <span className="text-dark">{course.trainer?.fullName}</span>
          <span className="mx-2">/</span>
          <span className="text-dark">{course.title}</span>
        </nav>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <span
                  className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${course.mode === 'PHYSICAL' ? 'bg-surface text-body' : course.mode === 'VIRTUAL' ? 'bg-primary/10 text-primary' : 'bg-accent text-body'}`}
                >
                  <ModeIcon size={12} className="inline mr-1" />
                  {cfg?.label}
                </span>
                <span className="px-2.5 py-0.5 bg-accent text-muted-foreground text-xs rounded-full">
                  {course.category}
                </span>
              </div>
              <h1 className="text-2xl md:text-3xl font-bold text-dark">{course.title}</h1>
            </div>

            {course.trainer && (
              <Link
                to={`/trainer/${course.trainer.id}`}
                className="flex items-center gap-3 p-3 bg-accent rounded-card hover:bg-accent/80 transition-colors"
              >
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                  {course.trainer.fullName?.[0]}
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="font-medium text-sm text-dark">{course.trainer.fullName}</span>
                    <VerifiedBadge isVerified={course.trainer.isVerified} size="sm" />
                  </div>
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <RatingStars rating={course.trainer.averageRating || 0} size={12} />(
                    {course.trainer.totalReviews || 0})
                  </div>
                </div>
              </Link>
            )}

            <section>
              <h2 className="text-lg font-semibold text-dark mb-2">About this course</h2>
              <p className="text-body text-sm leading-relaxed">{course.description}</p>
            </section>

            {course.learningOutcomes?.length > 0 && (
              <section>
                <h2 className="text-lg font-semibold text-dark mb-2">What you&apos;ll learn</h2>
                <ul className="space-y-2">
                  {course.learningOutcomes.map((o: string, i: number) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-body">
                      <CheckCircle size={16} className="text-green-500 mt-0.5 flex-shrink-0" />
                      {o}
                    </li>
                  ))}
                </ul>
              </section>
            )}
          </div>

          <div className="lg:col-span-1">
            <div className="lg:sticky lg:top-24">
              <div className="bg-white rounded-card shadow-card p-4 md:p-6 space-y-4">
                <p className="text-3xl font-bold text-dark">{formatCurrency(course.priceKes)}</p>
                <div className="space-y-2 text-sm text-body">
                  <p className="flex items-center gap-2">
                    <Clock size={16} /> {course.duration}, {course.sessionCount} sessions
                  </p>
                  {course.mode === 'PHYSICAL' && course.location && (
                    <p className="flex items-center gap-2">
                      <MapPin size={16} /> {course.location}
                    </p>
                  )}
                  <p className="flex items-center gap-2">
                    <Users size={16} /> Max {course.maxStudents || 'Unlimited'} students
                  </p>
                </div>
                <button
                  onClick={handleEnrol}
                  disabled={isAuthenticated && (user?.role !== 'TRAINEE' || isEnrolled)}
                  className="w-full py-3 bg-primary text-white font-medium rounded-btn hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {!isAuthenticated
                    ? 'Login to Enrol'
                    : user?.role !== 'TRAINEE'
                      ? 'Trainers cannot enrol'
                      : isEnrolled
                        ? 'Already Enrolled'
                        : 'Enrol Now'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {showPayment && course.id && (
        <MpesaPaymentModal
          open={showPayment}
          onClose={() => setShowPayment(false)}
          type="enrolment"
          courseId={course.id}
          trainerId={course.trainerId}
          amount={Number(course.priceKes)}
          phone={user?.phone}
          onSuccess={() => setShowPayment(false)}
        />
      )}
    </>
  );
}
