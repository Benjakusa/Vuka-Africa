import { useSearchParams } from 'react-router-dom';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PaginationProps {
  page: number;
  totalPages: number;
  total: number;
}

export function Pagination({ page, totalPages, total }: PaginationProps) {
  const [searchParams, setSearchParams] = useSearchParams();

  if (totalPages <= 1) return null;

  const goTo = (p: number) => {
    const params = new URLSearchParams(searchParams);
    params.set('page', String(p));
    setSearchParams(params);
  };

  return (
    <div className="flex items-center justify-center gap-2 mt-6">
      <button
        onClick={() => goTo(page - 1)}
        disabled={page <= 1}
        className={cn(
          'p-2 rounded-btn border border-border text-sm',
          page <= 1 ? 'text-muted-foreground cursor-not-allowed' : 'text-dark hover:bg-accent',
        )}
      >
        <ChevronLeft size={16} />
      </button>
      <span className="text-sm text-muted-foreground">
        Page {page} of {totalPages} ({total} total)
      </span>
      <button
        onClick={() => goTo(page + 1)}
        disabled={page >= totalPages}
        className={cn(
          'p-2 rounded-btn border border-border text-sm',
          page >= totalPages ? 'text-muted-foreground cursor-not-allowed' : 'text-dark hover:bg-accent',
        )}
      >
        <ChevronRight size={16} />
      </button>
    </div>
  );
}
