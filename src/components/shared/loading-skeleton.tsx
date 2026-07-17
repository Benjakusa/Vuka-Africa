// ─── Course Card Skeleton ────────────────────────────────────

export function CardSkeleton() {
  return (
    <div className="bg-white rounded-card shadow-card overflow-hidden">
      {/* Image placeholder */}
      <div className="h-32 bg-gray-200 animate-shimmer" />
      {/* Content */}
      <div className="p-4 space-y-2">
        {/* Title — two lines */}
        <div className="space-y-1.5">
          <div className="h-4 bg-gray-200 rounded animate-shimmer w-full" />
          <div className="h-4 bg-gray-200 rounded animate-shimmer w-2/3" />
        </div>
        {/* Metadata */}
        <div className="flex gap-3">
          <div className="h-3 bg-gray-200 rounded animate-shimmer w-16" />
          <div className="h-3 bg-gray-200 rounded animate-shimmer w-12" />
          <div className="h-3 bg-gray-200 rounded animate-shimmer w-14" />
        </div>
        {/* Price */}
        <div className="h-4 bg-gray-200 rounded animate-shimmer w-20" />
      </div>
    </div>
  );
}

// ─── Trainer Profile Skeleton ────────────────────────────────

export function ProfileSkeleton() {
  return (
    <div className="bg-white rounded-card shadow-card overflow-hidden">
      {/* Cover image */}
      <div className="h-48 bg-gray-200 animate-shimmer" />
      {/* Profile info */}
      <div className="px-6 pb-6 -mt-16 flex items-end gap-4">
        {/* Avatar */}
        <div className="w-24 h-24 rounded-full border-4 border-white bg-gray-200 animate-shimmer shrink-0" />
        {/* Name + Stats */}
        <div className="flex-1 pb-1 space-y-2">
          <div className="h-6 bg-gray-200 rounded animate-shimmer w-48" />
          <div className="h-4 bg-gray-200 rounded animate-shimmer w-32" />
        </div>
      </div>
    </div>
  );
}

// ─── Table Row Skeleton ──────────────────────────────────────

export function TableRowSkeleton({ columns = 4 }: { columns?: number }) {
  return (
    <div className="flex items-center gap-4 h-12 px-4 bg-white rounded">
      {Array.from({ length: columns }).map((_, i) => (
        <div
          key={i}
          className="h-4 bg-gray-200 rounded animate-shimmer"
          style={{ width: `${60 + Math.random() * 40}%`, maxWidth: '200px' }}
        />
      ))}
    </div>
  );
}

export function TableSkeleton({ rows = 5, columns = 4 }: { rows?: number; columns?: number }) {
  return (
    <div className="space-y-2">
      {Array.from({ length: rows }).map((_, i) => (
        <TableRowSkeleton key={i} columns={columns} />
      ))}
    </div>
  );
}