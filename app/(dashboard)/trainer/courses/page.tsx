'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import { Plus, Pencil, Eye, EyeOff } from 'lucide-react';
import { BackButton } from '@frontend/components/shared/back-button';
import { api } from '@backend/lib/api';
import { EmptyState } from '@frontend/components/shared/empty-state';
import { CardSkeleton } from '@frontend/components/shared/loading-skeleton';
import { formatCurrency } from '@backend/lib/utils';
import { toast } from 'sonner';

export default function CourseManagementPage() {
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['trainer-courses'],
    queryFn: () => api.get<any>('/trainers/me/courses'),
  });

  const publishMutation = useMutation({
    mutationFn: ({ id, isPublished }: { id: string; isPublished: boolean }) =>
      api.patch(`/courses/${id}`, { isPublished }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trainer-courses'] });
      toast.success('Course updated');
    },
    onError: (err: any) => toast.error(err.message),
  });

  const courses = data?.data || [];

  return (
    <div className="space-y-6">
      <BackButton href="/dashboard/trainer" label="Back to Dashboard" />
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-dark">My Courses</h1>
        <Link
          href="/dashboard/trainer/courses/new"
          className="flex items-center gap-1.5 px-4 py-2 bg-primary text-white text-sm font-medium rounded-btn hover:bg-primary/90"
        >
          <Plus size={16} /> New Course
        </Link>
      </div>

      {isLoading ? (
        <div className="space-y-3">{[1, 2].map(i => <CardSkeleton key={i} />)}</div>
      ) : courses.length === 0 ? (
        <EmptyState
          icon={Eye}
          title="No courses yet"
          subtitle="Create your first course to start attracting students"
          action={{ label: 'Create Course', href: '/dashboard/trainer/courses/new' }}
        />
      ) : (
        <div className="space-y-3">
          {courses.map((course: any) => (
            <div key={course.id} className="bg-white rounded-card shadow-card p-4 hover:shadow-cardHover transition-shadow">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-card flex items-center justify-center flex-shrink-0">
                  {course.imageUrl ? (
                    <img src={course.imageUrl} alt="" className="w-full h-full object-cover rounded-card" />
                  ) : (
                    <span className="text-lg font-bold text-primary">{course.title?.[0]}</span>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium text-dark truncate">{course.title}</h3>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1">
                    <span>{formatCurrency(course.priceKes)}</span>
                    <span>{course.mode}</span>
                    <span>{course._count?.enrolments || 0} enrolled</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => publishMutation.mutate({ id: course.id, isPublished: !course.isPublished })}
                    className={`p-2 rounded-btn text-xs font-medium transition-colors ${
                      course.isPublished ? 'text-primary' : 'text-muted-foreground'
                    }`}
                    title={course.isPublished ? 'Published' : 'Draft'}
                  >
                    {course.isPublished ? <Eye size={16} /> : <EyeOff size={16} />}
                  </button>
                  <Link
                    href={`/dashboard/trainer/courses/${course.id}`}
                    className="p-2 text-muted-foreground hover:text-dark hover:bg-accent rounded-btn"
                  >
                    <Pencil size={16} />
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
