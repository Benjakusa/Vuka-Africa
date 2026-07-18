import { useState, useRef, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useSearchParams } from 'react-router-dom';
import { Loader2, Search, X } from 'lucide-react';
import { CourseCard } from '@/components/shared/course-card';
import { CardSkeleton } from '@/components/shared/loading-skeleton';
import { ErrorState } from '@/components/shared/error-state';
import { EmptyState } from '@/components/shared/empty-state';
import { getCourses } from '@/services/courseService';
import { courseKeys } from '@/lib/query-keys';
import { CATEGORIES } from '@/lib/categories';
import { usePageTitle } from '@/hooks/use-page-title';

const COURSES_PER_PAGE = 12;

const MODES = [
  { value: '', label: 'All Modes' },
  { value: 'PHYSICAL', label: 'Physical' },
  { value: 'VIRTUAL', label: 'Virtual' },
  { value: 'HYBRID', label: 'Hybrid' },
];

const SORT_OPTIONS = [
  { value: 'newest', label: 'Newest' },
  { value: 'price_asc', label: 'Price: Low to High' },
  { value: 'price_desc', label: 'Price: High to Low' },
];

export default function Courses() {
  usePageTitle('Browse Skill Courses in Kenya');
  const [searchParams, setSearchParams] = useSearchParams();
  const [allCourses, setAllCourses] = useState<any[]>([]);
  const [loadingMore, setLoadingMore] = useState(false);
  const nextPageRef = useRef(2);
  const totalRef = useRef(0);

  const search = searchParams.get('search') || '';
  const category = searchParams.get('category') || '';
  const mode = searchParams.get('mode') || '';
  const sort = searchParams.get('sort') || 'newest';

  const queryKey = useMemo(
    () => courseKeys.list({ search, category, mode, sort, page: 1 }),
    [search, category, mode, sort],
  );

  const {
    data: courseResult,
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey,
    queryFn: async () => {
      const order = sort === 'price_asc' ? 'priceKes' : sort === 'price_desc' ? 'priceKes' : 'createdAt';
      const orderAsc = sort === 'price_asc';
      const result = (await getCourses({
        isPublished: true,
        page: 1,
        perPage: COURSES_PER_PAGE,
        includeTotal: true,
        search: search || undefined,
        category: category || undefined,
        mode: mode || undefined,
        order,
        orderAsc,
      })) as { data: any[]; total: number };
      totalRef.current = result.total;
      nextPageRef.current = 2;
      setAllCourses([]);
      return result;
    },
    staleTime: 120_000,
    gcTime: 300_000,
  });

  const courses = allCourses.length > 0 ? allCourses : courseResult?.data || [];
  const hasMore = (nextPageRef.current - 1) * COURSES_PER_PAGE < totalRef.current;

  const handleLoadMore = async () => {
    setLoadingMore(true);
    try {
      const order = sort === 'price_asc' ? 'priceKes' : sort === 'price_desc' ? 'priceKes' : 'createdAt';
      const orderAsc = sort === 'price_asc';
      const result = (await getCourses({
        isPublished: true,
        page: nextPageRef.current,
        perPage: COURSES_PER_PAGE,
        includeTotal: true,
        search: search || undefined,
        category: category || undefined,
        mode: mode || undefined,
        order,
        orderAsc,
      })) as { data: any[]; total: number };
      setAllCourses((prev) => [...prev, ...result.data]);
      nextPageRef.current += 1;
    } finally {
      setLoadingMore(false);
    }
  };

  const updateFilter = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams);
    if (value) params.set(key, value);
    else params.delete(key);
    setSearchParams(params, { replace: true });
  };

  const clearFilters = () => {
    setSearchParams({}, { replace: true });
  };

  const hasActiveFilters = search || category || mode || sort !== 'newest';

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-6">
        <h1 className="text-2xl md:text-3xl font-bold text-dark">Browse Courses</h1>
        <p className="text-body text-sm mt-1">Discover courses taught by verified trainers</p>
      </div>

      <div className="bg-white rounded-card shadow-card p-4 mb-6">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[200px]">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-body-foreground" />
            <input
              type="text"
              placeholder="Search by course title or trainer..."
              value={search}
              onChange={(e) => updateFilter('search', e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-sm border border-input rounded-btn"
            />
          </div>
          <select
            value={category}
            onChange={(e) => updateFilter('category', e.target.value)}
            className="px-3 py-2 text-sm border border-input rounded-btn bg-white"
            aria-label="Filter by category"
          >
            <option value="">All Categories</option>
            {CATEGORIES.map((cat) => (
              <option key={cat.name} value={cat.name}>
                {cat.name}
              </option>
            ))}
          </select>
          <select
            value={mode}
            onChange={(e) => updateFilter('mode', e.target.value)}
            className="px-3 py-2 text-sm border border-input rounded-btn bg-white"
            aria-label="Filter by mode"
          >
            {MODES.map((m) => (
              <option key={m.value} value={m.value}>
                {m.label}
              </option>
            ))}
          </select>
          <select
            value={sort}
            onChange={(e) => updateFilter('sort', e.target.value)}
            className="px-3 py-2 text-sm border border-input rounded-btn bg-white"
            aria-label="Sort by"
          >
            {SORT_OPTIONS.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="px-3 py-2 text-sm text-primary hover:underline flex items-center gap-1"
            >
              <X size={14} /> Clear
            </button>
          )}
        </div>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <CardSkeleton key={i} />
          ))}
        </div>
      ) : isError ? (
        <ErrorState message="Failed to load courses" onRetry={() => refetch()} />
      ) : courses.length > 0 ? (
        <>
          <p className="text-sm text-body-foreground mb-4">
            {totalRef.current} course{totalRef.current !== 1 ? 's' : ''} found
          </p>
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
                priceKes={Number(course.priceKes)}
                imageUrl={course.imageUrl}
                detailed
                category={course.category}
                trainerName={course.trainer?.fullName}
                trainerIsVerified={course.trainer?.isVerified}
                averageRating={course.trainer?.averageRating}
                totalReviews={course.trainer?.totalReviews}
              />
            ))}
          </div>
          {hasMore && (
            <div className="flex justify-center mt-8">
              <button
                onClick={handleLoadMore}
                disabled={loadingMore}
                className="px-6 py-2.5 bg-primary text-white text-sm font-medium rounded-btn hover:bg-surface disabled:opacity-60 transition-colors flex items-center gap-2"
              >
                {loadingMore && <Loader2 size={16} className="animate-spin" />}
                {loadingMore ? 'Loading...' : 'Load More Courses'}
              </button>
            </div>
          )}
        </>
      ) : (
        <EmptyState
          icon={Search}
          title="No courses found"
          subtitle={hasActiveFilters ? 'Try adjusting your search or filters' : 'No courses available yet'}
          action={hasActiveFilters ? { label: 'Clear Filters', onClick: clearFilters } : undefined}
        />
      )}
    </div>
  );
}
