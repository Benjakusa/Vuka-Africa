import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link, useNavigate } from 'react-router-dom';
import { BookOpen, Plus, MoreVertical, Eye, EyeOff, Pencil, Trash2, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { useAuthStore } from '@/stores/auth-store';
import { getTrainerCourses, updateCourse } from '@/services/courseService';
import { courseKeys } from '@/lib/query-keys';
import { supabaseData as supabase } from '@/lib/supabase';
import { CourseCard } from '@/components/shared/course-card';
import { EmptyState } from '@/components/shared/empty-state';
import { ErrorState } from '@/components/shared/error-state';
import { CardSkeleton } from '@/components/shared/loading-skeleton';
import { ConfirmationDialog } from '@/components/shared/confirmation-dialog';

export default function Courses() {
  const { user } = useAuthStore();
  const trainerId = user?.trainer?.id;
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<any>(null);
  const [deleting, setDeleting] = useState(false);

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

  const toggleMutation = useMutation({
    mutationFn: ({ id, isPublished }: { id: string; isPublished: boolean }) => updateCourse(id, { isPublished }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: courseKeys.list({ trainerId }) });
      toast.success('Course visibility updated');
    },
    onError: (err: any) => toast.error(err.message || 'Failed to update'),
  });

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      const { error } = await supabase.from('Course').delete().eq('id', deleteTarget.id);
      if (error) throw error;
      toast.success('Course deleted');
      setDeleteTarget(null);
      queryClient.invalidateQueries({ queryKey: courseKeys.list({ trainerId }) });
    } catch (err: any) {
      toast.error(err.message || 'Failed to delete');
    } finally {
      setDeleting(false);
    }
  };

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
            <div key={course.id} className="relative group">
              <CourseCard
                id={course.id}
                title={course.title}
                slug={course.slug}
                mode={course.mode}
                duration={course.duration}
                sessionCount={course.sessionCount}
                priceKes={course.priceKes}
                imageUrl={course.imageUrl}
              />
              <div className="absolute top-2 right-2 z-10">
                <button
                  onClick={() => setOpenMenu(openMenu === course.id ? null : course.id)}
                  className="p-1.5 bg-white/90 backdrop-blur-sm rounded-full shadow-sm hover:bg-white transition-colors"
                >
                  <MoreVertical size={14} className="text-muted-foreground" />
                </button>
              </div>

              {openMenu === course.id && (
                <>
                  <div className="fixed inset-0 z-20" onClick={() => setOpenMenu(null)} />
                  <div className="absolute top-10 right-2 z-30 bg-white rounded-card shadow-lg border border-border py-1 w-44">
                    <button
                      onClick={() => {
                        toggleMutation.mutate({ id: course.id, isPublished: !course.isPublished });
                        setOpenMenu(null);
                      }}
                      className="w-full flex items-center gap-2 px-3 py-2 text-sm text-dark hover:bg-accent transition-colors"
                    >
                      {course.isPublished ? <EyeOff size={14} /> : <Eye size={14} />}
                      {course.isPublished ? 'Mute' : 'Unmute'}
                    </button>
                    <button
                      onClick={() => {
                        navigate(`/trainer/courses/${course.id}/edit`);
                        setOpenMenu(null);
                      }}
                      className="w-full flex items-center gap-2 px-3 py-2 text-sm text-dark hover:bg-accent transition-colors"
                    >
                      <Pencil size={14} /> Edit
                    </button>
                    <button
                      onClick={() => {
                        setDeleteTarget(course);
                        setOpenMenu(null);
                      }}
                      className="w-full flex items-center gap-2 px-3 py-2 text-sm text-destructive hover:bg-destructive/5 transition-colors"
                    >
                      <Trash2 size={14} /> Delete
                    </button>
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
      )}

      <ConfirmationDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Delete Course"
        message={`Are you sure you want to delete "${deleteTarget?.title}"? This action cannot be undone.`}
        confirmLabel={deleting ? 'Deleting...' : 'Delete'}
        loading={deleting}
      />
    </div>
  );
}
