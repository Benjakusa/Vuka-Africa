'use client';

import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { cn } from '@backend/lib/utils';

interface PaginationProps {
  page: number;
  totalPages: number;
  total: number;
}

export function Pagination({ page, totalPages, total }: PaginationProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const goTo = (p: number) => {
    const params = new URLSearchParams(searchParams);
    params.set('page', String(p));
    router.push(`${pathname}?${params.toString()}`);
  };

  if (totalPages <= 1) return null;

  return (
    <div className="flex items-center justify-between pt-6">
      <p className="text-sm text-muted-foreground">{total} total results</p>
      <div className="flex items-center gap-2">
        <button
          onClick={() => goTo(page - 1)}
          disabled={page <= 1}
          className={cn(
            'p-2 rounded-btn border border-border hover:bg-accent disabled:opacity-40 disabled:cursor-not-allowed transition-colors'
          )}
        >
          <ChevronLeft size={16} />
        </button>
        {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
          let pageNum: number;
          if (totalPages <= 7) {
            pageNum = i + 1;
          } else if (page <= 4) {
            pageNum = i + 1;
          } else if (page >= totalPages - 3) {
            pageNum = totalPages - 6 + i;
          } else {
            pageNum = page - 3 + i;
          }
          return (
            <button
              key={pageNum}
              onClick={() => goTo(pageNum)}
              className={cn(
                'w-9 h-9 rounded-btn text-sm font-medium transition-colors',
                pageNum === page
                  ? 'bg-primary text-white'
                  : 'hover:bg-accent text-muted-foreground'
              )}
            >
              {pageNum}
            </button>
          );
        })}
        <button
          onClick={() => goTo(page + 1)}
          disabled={page >= totalPages}
          className={cn(
            'p-2 rounded-btn border border-border hover:bg-accent disabled:opacity-40 disabled:cursor-not-allowed transition-colors'
          )}
        >
          <ChevronRight size={16} />
        </button>
      </div>
    </div>
  );
}
