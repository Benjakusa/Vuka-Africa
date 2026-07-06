'use client';

import { Search, X } from 'lucide-react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { useDebounce } from '@frontend/hooks/use-debounce';
import { useState, useEffect } from 'react';
import { cn } from '@backend/lib/utils';

interface FilterBarProps {
  showCategory?: boolean;
  showMode?: boolean;
  showPrice?: boolean;
  showVerified?: boolean;
  showSort?: boolean;
}

const CATEGORIES = [
  'Baking & Cake Decoration', 'Photography & Videography', 'Programming & Web Dev',
  'Fitness & Wellness', 'Music & Instruments', 'Languages',
];

const SORT_OPTIONS = [
  { value: 'rating', label: 'Highest Rated' },
  { value: 'price_asc', label: 'Price: Low to High' },
  { value: 'price_desc', label: 'Price: High to Low' },
  { value: 'newest', label: 'Newest' },
];

export function FilterBar({ showCategory = true, showMode = true, showPrice = true, showVerified = true, showSort = true }: FilterBarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [search, setSearch] = useState(searchParams.get('search') || '');
  const debouncedSearch = useDebounce(search, 300);

  const updateParam = (key: string, value: string | null) => {
    const params = new URLSearchParams(searchParams);
    if (value === null || value === '') params.delete(key);
    else params.set(key, value);
    params.set('page', '1');
    router.push(`${pathname}?${params.toString()}`);
  };

  useEffect(() => {
    updateParam('search', debouncedSearch || null);
  }, [debouncedSearch]);

  const activeFilters = [...searchParams.entries()].filter(([k]) => k !== 'page');

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search trainers..."
            className="w-full pl-9 pr-4 py-2 border border-border rounded-btn text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
          />
        </div>

        {showCategory && (
          <select
            value={searchParams.get('category') || ''}
            onChange={(e) => updateParam('category', e.target.value || null)}
            className="px-3 py-2 border border-border rounded-btn text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 bg-white"
          >
            <option value="">All Categories</option>
            {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        )}

        {showMode && (
          <select
            value={searchParams.get('mode') || ''}
            onChange={(e) => updateParam('mode', e.target.value || null)}
            className="px-3 py-2 border border-border rounded-btn text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 bg-white"
          >
            <option value="">All Modes</option>
            <option value="PHYSICAL">Physical</option>
            <option value="VIRTUAL">Virtual</option>
            <option value="HYBRID">Hybrid</option>
          </select>
        )}

        {showSort && (
          <select
            value={searchParams.get('sortBy') || 'rating'}
            onChange={(e) => updateParam('sortBy', e.target.value)}
            className="px-3 py-2 border border-border rounded-btn text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 bg-white"
          >
            {SORT_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        )}

        {showVerified && (
          <label className="flex items-center gap-2 px-3 py-2 border border-border rounded-btn text-sm cursor-pointer hover:bg-accent">
            <input
              type="checkbox"
              checked={searchParams.get('verifiedOnly') === 'true'}
              onChange={(e) => updateParam('verifiedOnly', e.target.checked ? 'true' : null)}
              className="rounded border-border text-primary focus:ring-primary"
            />
            Verified only
          </label>
        )}
      </div>

      {activeFilters.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {activeFilters.map(([key, val]) => (
            <span key={key} className="inline-flex items-center gap-1 px-2.5 py-1 bg-primary/10 text-primary text-xs rounded-full font-medium">
              {key === 'verifiedOnly' ? 'Verified' : `${key}: ${val}`}
              <button onClick={() => updateParam(key, null)} className="hover:text-primary/80">
                <X size={12} />
              </button>
            </span>
          ))}
          <button
            onClick={() => router.push(pathname)}
            className="text-xs text-muted-foreground hover:text-dark underline"
          >
            Clear all
          </button>
        </div>
      )}
    </div>
  );
}
