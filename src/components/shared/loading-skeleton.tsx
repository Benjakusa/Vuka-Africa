export function CardSkeleton() {
  return (
    <div className="bg-white rounded-card shadow-card p-4 animate-shimmer">
      <div className="w-12 h-12 rounded-full bg-gray-200 mb-3" />
      <div className="h-4 bg-gray-200 rounded w-3/4 mb-2" />
      <div className="h-3 bg-gray-200 rounded w-1/2" />
    </div>
  );
}

export function ProfileSkeleton() {
  return (
    <div className="animate-shimmer">
      <div className="bg-white rounded-card shadow-card overflow-hidden">
        <div className="h-48 bg-gray-200" />
        <div className="px-6 pb-6 -mt-16 flex items-end gap-4">
          <div className="w-24 h-24 rounded-full border-4 border-white bg-gray-200" />
          <div className="flex-1 pb-1">
            <div className="h-6 bg-gray-200 rounded w-48 mb-2" />
            <div className="h-4 bg-gray-200 rounded w-32" />
          </div>
        </div>
      </div>
    </div>
  );
}

export function TableSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="animate-shimmer space-y-3">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="h-12 bg-gray-200 rounded" />
      ))}
    </div>
  );
}
