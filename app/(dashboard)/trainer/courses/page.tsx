'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import { useState } from 'react';
import { Plus, Pencil, Eye, EyeOff, Trash2, Star, BookOpen, X } from 'lucide-react';
import { BackButton } from '@frontend/components/shared/back-button';
import { StatusBadge } from '@frontend/components/shared/status-badge';
import { EmptyState } from '@frontend/components/shared/empty-state';
import { ErrorState } from '@frontend/components/shared/error-state';
import { CardSkeleton } from '@frontend/components/shared/loading-skeleton';
import { OfflineBanner } from '@frontend/components/shared/offline-banner';
import { formatCurrency } from '@backend/lib/utils';
import { toast } from 'sonner';

export default function CourseManagementPage() {
  const queryClient = useQueryClient();
  const [deleteTarget, setDeleteTarget] = useState<any>(null);

  const { data, isLoading, isError, refetch } = useQuery({
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

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/courses/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trainer-courses'] });
      toast.success('Course deleted');
      setDeleteTarget(null);
    },
    onError: (err: any) => toast.error(err.message),
  });

  const courses = data?.data || [];

  return (
    <div className="space-y-6">
      <OfflineBanner />
      <BackButton href="/trainer" label="Back to Dashboard" />
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-dark">My Courses</h1>
        <Link
          href="/trainer/courses/new"
          className="flex items-center gap-1.5 px-4 py-2 bg-primary text-white text-sm font-medium rounded-btn hover:bg-primary/90"
        >
          <Plus size={16} /> New Course
        </Link>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">{[1, 2].map(i => <CardSkeleton key={i} />)}</div>
      ) : isError ? (
        <ErrorState message="Failed to load courses" onRetry={() => refetch()} />
      ) : courses.length === 0 ? (
        <EmptyState
          icon={BookOpen}
          title="You haven't created any courses yet"
          subtitle="Create your first course to start attracting students"
          action={{ label: 'Create Your First Course', href: '/trainer/courses/new' }}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {courses.map((course: any) => (
            <div key={course.id} className="bg-white rounded-card shadow-card overflow-hidden hover:shadow-cardHover transition-shadow">
              {course.imageUrl ? (
                <div className="h-32 bg-accent overflow-hidden">
                  <img src={course.imageUrl} alt="" className="w-full h-full object-cover" />
                </div>
              ) : (
                <div className="h-32 bg-gradient-to-br from-primary/10 to-accent flex items-center justify-center">
                  <span className="text-3xl font-bold text-primary/30">{course.title?.[0] || '?'}</span>
                </div>
              )}
              <div className="p-4">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium text-dark truncate">{course.title}</h3>
                    <div className="flex items-center gap-2 mt-0.5">
                      <StatusBadge status={course.mode} />
                      {course.category && (
                        <span className="text-xs text-muted-foreground bg-accent px-2 py-0.5 rounded-full">{course.category}</span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => publishMutation.mutate({ id: course.id, isPublished: !course.isPublished })}
                      className={`p-2 rounded-btn transition-colors ${
                        course.isPublished ? 'bg-primary/10 text-primary' : 'bg-accent text-muted-foreground'
                      }`}
                      title={course.isPublished ? 'Published' : 'Draft'}
                    >
                      {course.isPublished ? <Eye size={16} /> : <EyeOff size={16} />}
                    </button>
                    <Link
                      href={`/trainer/courses/${course.id}`}
                      className="p-2 text-muted-foreground hover:text-dark hover:bg-accent rounded-btn"
                    >
                      <Pencil size={16} />
                    </Link>
                    <button
                      onClick={() => setDeleteTarget(course)}
                      className="p-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-btn"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>

                <div className="flex items-center gap-3 text-xs text-muted-foreground mb-2">
                  <span className="font-semibold text-dark">{formatCurrency(course.priceKes)}</span>
                  <span>{course._count?.enrolments || 0} enrolled</span>
                  {course.averageRating ? (
                    <span className="flex items-center gap-1">
                      <Star size={12} className="text-primary fill-primary" />
                      {course.averageRating.toFixed(1)}
                    </span>
                  ) : null}
                </div>

                <div className="flex items-center gap-2">
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                    course.isPublished ? 'bg-primary/10 text-primary' : 'bg-accent text-muted-foreground'
                  }`}>
                    {course.isPublished ? 'Published' : 'Draft'}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={() => setDeleteTarget(null)}>
          <div className="bg-white rounded-card shadow-modal w-full max-w-sm p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-dark">Delete Course</h3>
              <button onClick={() => setDeleteTarget(null)} className="p-1 text-muted-foreground hover:text-dark">
                <X size={20} />
              </button>
            </div>
            <p className="text-sm text-body mb-2">Are you sure you want to delete <strong>{deleteTarget.title}</strong>?</p>
            <p className="text-xs text-muted-foreground mb-6">This action cannot be undone.</p>
            <div className="flex gap-3">
              <button
                onClick={() => deleteMutation.mutate(deleteTarget.id)}
                disabled={deleteMutation.isPending}
                className="flex-1 py-2.5 bg-destructive text-white font-medium rounded-btn hover:bg-destructive/90 disabled:opacity-50 transition-colors"
              >
                {deleteMutation.isPending ? 'Deleting...' : 'Delete'}
              </button>
              <button onClick={() => setDeleteTarget(null)} className="flex-1 py-2.5 border border-border text-body rounded-btn hover:bg-accent transition-colors">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
