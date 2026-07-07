import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { BookOpen, Plus } from 'lucide-react';
import { useAuthStore } from '@/stores/auth-store';
import { getTrainerCourses } from '@/services/courseService';
import { courseKeys } from '@/lib/query-keys';
import { CourseCard } from '@/components/shared/course-card';
import { EmptyState } from '@/components/shared/empty-state';
import { ErrorState } from '@/components/shared/error-state';
import { CardSkeleton } from '@/components/shared/loading-skeleton';

export default function Courses() {
  const { user } = useAuthStore();
  const trainerId = user?.trainer?.id;

  const {
    data: courses,
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: courseKeys.list({ trainerId }),
    queryFn: () => getTrainerCourses(trainerId!),
    enabled: !!trainerId,
  });

  return (
    <div className="max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-dark">My Courses</h1>
          <p className="text-body text-sm">Manage your training offerings</p>
        </div>
        <Link
          to="/trainer/courses/new"
          className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-white text-sm font-medium rounded-btn hover:bg-primary/90 transition-colors"
        >
          <Plus size={16} /> New Course
        </Link>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <CardSkeleton key={i} />
          ))}
        </div>
      ) : isError ? (
        <ErrorState message="Failed to load courses" onRetry={() => refetch()} />
      ) : !courses || courses.length === 0 ? (
        <EmptyState
          icon={BookOpen}
          title="No courses yet"
          subtitle="Create your first course to start attracting students"
          action={{ label: 'Create Course', href: '/trainer/courses/new' }}
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {courses.map((course: any) => (
            <CourseCard
              key={course.id}
              id={course.id}
              title={course.title}
              slug={course.slug}
              mode={course.mode}
              duration={course.duration}
              sessionCount={course.sessionCount}
              priceKes={course.priceKes}
              imageUrl={course.imageUrl}
            />
          ))}
        </div>
      )}
    </div>
  );
}
