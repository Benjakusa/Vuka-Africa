import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { BookOpen, Search, Users, DollarSign, Trash2, Eye, EyeOff, ChevronRight, GraduationCap } from 'lucide-react';
import {
  getAllCourses,
  getAdminCourseDetail,
  unpublishCourse,
  publishCourse,
  softDeleteCourse,
} from '@/services/adminService';
import { adminKeys } from '@/lib/query-keys';
import { CardSkeleton } from '@/components/shared/loading-skeleton';
import { ErrorState } from '@/components/shared/error-state';
import { EmptyState } from '@/components/shared/empty-state';
import { StatusBadge } from '@/components/shared/status-badge';
import { Pagination } from '@/components/shared/pagination';
import { formatCurrency, formatDate } from '@/lib/utils';
import { toast } from 'sonner';

export default function AdminCourses() {
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [modeFilter, setModeFilter] = useState('');
  const [page, setPage] = useState(1);
  const [selectedCourseId, setSelectedCourseId] = useState<string | null>(null);

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: adminKeys.adminCourses({ search, category: categoryFilter, mode: modeFilter, page }),
    queryFn: () =>
      getAllCourses({
        search: search || undefined,
        category: categoryFilter || undefined,
        mode: modeFilter || undefined,
        page,
      }),
  });

  const { data: courseDetail, isLoading: detailLoading } = useQuery({
    queryKey: adminKeys.adminCourseDetail(selectedCourseId || ''),
    queryFn: () => getAdminCourseDetail(selectedCourseId!),
    enabled: !!selectedCourseId,
  });

  const totalPages = data ? Math.ceil(data.total / 20) : 0;

  const handleTogglePublish = async (courseId: string, isPublished: boolean) => {
    try {
      if (isPublished) {
        await unpublishCourse(courseId);
        toast.success('Course unpublished');
      } else {
        await publishCourse(courseId);
        toast.success('Course published');
      }
      refetch();
    } catch (err: any) {
      toast.error(err.message || 'Failed to update course');
    }
  };

  const handleDelete = async (courseId: string) => {
    if (!confirm('Are you sure you want to delete this course? This action can be reversed.')) return;
    try {
      await softDeleteCourse(courseId);
      toast.success('Course deleted');
      refetch();
      if (selectedCourseId === courseId) setSelectedCourseId(null);
    } catch (err: any) {
      toast.error(err.message || 'Failed to delete course');
    }
  };

  if (isError) {
    return <ErrorState message="Failed to load courses" onRetry={() => refetch()} />;
  }

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-dark">Courses</h1>
        <p className="text-body text-sm">Manage all courses on the platform</p>
      </div>

      <div className="flex flex-wrap items-center gap-3 mb-4">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-body-foreground" />
          <input
            type="text"
            placeholder="Search by title or trainer..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="w-full pl-9 pr-3 py-2 text-sm border border-input rounded-btn focus: focus:"
          />
        </div>
        <select
          value={categoryFilter}
          onChange={(e) => {
            setCategoryFilter(e.target.value);
            setPage(1);
          }}
          className="px-3 py-2 text-sm border border-input rounded-btn focus: focus: bg-white"
          aria-label="Filter by category"
        >
          <option value="">All Categories</option>
          <option value="TECHNOLOGY">Technology</option>
          <option value="BUSINESS">Business</option>
          <option value="CREATIVE">Creative</option>
          <option value="LIFESTYLE">Lifestyle</option>
          <option value="ACADEMIC">Academic</option>
          <option value="OTHER">Other</option>
        </select>
        <select
          value={modeFilter}
          onChange={(e) => {
            setModeFilter(e.target.value);
            setPage(1);
          }}
          className="px-3 py-2 text-sm border border-input rounded-btn focus: focus: bg-white"
          aria-label="Filter by mode"
        >
          <option value="">All Modes</option>
          <option value="ONLINE">Online</option>
          <option value="IN_PERSON">In Person</option>
          <option value="HYBRID">Hybrid</option>
        </select>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          {isLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <CardSkeleton key={i} />
              ))}
            </div>
          ) : data?.data?.length ? (
            <div className="bg-white rounded-card shadow-card divide-y divide-border">
              {data.data.map((course: any) => (
                <div
                  key={course.id}
                  className={`p-4 hover:bg-surface/50 transition-colors cursor-pointer ${
                    selectedCourseId === course.id ? 'bg-surface' : ''
                  }`}
                  onClick={() => setSelectedCourseId(course.id)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="text-sm font-semibold text-dark truncate">{course.title}</h3>
                        <StatusBadge status={course.isPublished ? 'PUBLISHED' : 'UNPUBLISHED'} />
                      </div>
                      <p className="text-xs text-body-foreground mb-2">
                        by {course.trainerName} &middot; {course.category} &middot; {course.mode}
                      </p>
                      <div className="flex items-center gap-4 text-xs text-body">
                        <span className="flex items-center gap-1">
                          <DollarSign size={12} />
                          {formatCurrency(course.price)}
                        </span>
                        <span className="flex items-center gap-1">
                          <Users size={12} />
                          {course.enrolmentCount} enrolments
                        </span>
                        <span>{formatDate(course.createdAt)}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 ml-4 shrink-0">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleTogglePublish(course.id, course.isPublished);
                        }}
                        className="p-1.5 hover:bg-accent rounded-btn transition-colors"
                        aria-label={course.isPublished ? 'Unpublish course' : 'Publish course'}
                      >
                        {course.isPublished ? (
                          <EyeOff size={16} className="text-body-foreground" />
                        ) : (
                          <Eye size={16} className="text-body-foreground" />
                        )}
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(course.id);
                        }}
                        className="p-1.5 hover:bg-primary rounded-btn transition-colors"
                        aria-label="Delete course"
                      >
                        <Trash2 size={16} className="text-primary" />
                      </button>
                      <ChevronRight size={16} className="text-body-foreground" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState icon={BookOpen} title="No courses found" subtitle="Try adjusting your search or filters" />
          )}

          {totalPages > 1 && (
            <div className="mt-4">
              <Pagination page={page} totalPages={totalPages} total={data?.total || 0} />
            </div>
          )}
        </div>

        <div className="lg:col-span-1">
          {selectedCourseId ? (
            <div className="bg-white rounded-card shadow-card p-5">
              {detailLoading ? (
                <CardSkeleton />
              ) : courseDetail ? (
                <div>
                  <h3 className="text-base font-bold text-dark mb-3">{courseDetail.title}</h3>
                  <div className="space-y-2 text-sm mb-4">
                    <div className="flex justify-between">
                      <span className="text-body">Trainer</span>
                      <span className="text-dark font-medium">{courseDetail.trainerName}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-body">Category</span>
                      <span className="text-dark">{courseDetail.category}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-body">Mode</span>
                      <span className="text-dark">{courseDetail.mode}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-body">Price</span>
                      <span className="text-dark font-semibold">{formatCurrency(courseDetail.price)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-body">Total Revenue</span>
                      <span className="text-foreground font-semibold">{formatCurrency(courseDetail.totalRevenue)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-body">Enrolments</span>
                      <span className="text-dark">{courseDetail.enrolments?.length || 0}</span>
                    </div>
                  </div>

                  {courseDetail.enrolments?.length > 0 && (
                    <div>
                      <h4 className="text-sm font-bold text-dark mb-2 flex items-center gap-1.5">
                        <GraduationCap size={14} /> Enrolments
                      </h4>
                      <div className="space-y-2 max-h-64 overflow-y-auto">
                        {courseDetail.enrolments.map((enr: any) => {
                          const milestones = enr.milestones || [];
                          const completedCount = milestones.filter((m: any) => m.status === 'COMPLETED').length;
                          const totalCount = milestones.length;
                          const progress = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

                          return (
                            <div key={enr.id} className="p-2.5 bg-surface rounded-card">
                              <div className="flex items-center justify-between mb-1">
                                <p className="text-xs font-medium text-dark truncate">
                                  {enr.trainee?.fullName || 'Trainee'}
                                </p>
                                <StatusBadge status={enr.status} />
                              </div>
                              {totalCount > 0 && (
                                <div className="flex items-center gap-2">
                                  <div className="flex-1 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                                    <div
                                      className="h-full bg-primary rounded-full transition-all"
                                      style={{ width: `${progress}%` }}
                                    />
                                  </div>
                                  <span className="text-xs text-body-foreground shrink-0">
                                    {completedCount}/{totalCount}
                                  </span>
                                </div>
                              )}
                              <p className="text-xs text-body-foreground mt-1">{formatDate(enr.createdAt)}</p>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              ) : null}
            </div>
          ) : (
            <div className="bg-white rounded-card shadow-card p-6 text-center">
              <BookOpen size={32} className="mx-auto text-body-foreground mb-2" />
              <p className="text-sm text-body">Select a course to view details</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
