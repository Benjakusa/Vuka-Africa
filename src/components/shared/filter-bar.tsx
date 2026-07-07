import { useSearchParams } from 'react-router-dom';
import { Search, SlidersHorizontal, X } from 'lucide-react';
import { useDebounce } from '@/hooks/use-debounce';
import { useState, useEffect } from 'react';

export function FilterBar() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [showFilters, setShowFilters] = useState(false);

  const debouncedSearch = useDebounce(search, 300);

  useEffect(() => {
    const params = new URLSearchParams(searchParams);
    if (debouncedSearch) params.set('search', debouncedSearch);
    else params.delete('search');
    params.set('page', '1');
    setSearchParams(params, { replace: true });
  }, [debouncedSearch]);

  const updateFilter = (key: string, value: string | undefined) => {
    const params = new URLSearchParams(searchParams);
    if (value) params.set(key, value);
    else params.delete(key);
    params.set('page', '1');
    setSearchParams(params, { replace: true });
  };

  const clearFilters = () => {
    setSearch('');
    setSearchParams(new URLSearchParams(), { replace: true });
  };

  const hasFilters = Array.from(searchParams.entries()).some(([k]) => k !== 'page');

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search trainers..."
            className="w-full pl-9 pr-3 py-2 border border-border rounded-btn text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
        </div>
        <button
          onClick={() => setShowFilters(!showFilters)}
          className={`p-2 border rounded-btn ${showFilters || hasFilters ? 'bg-primary text-white border-primary' : 'border-border text-body hover:bg-accent'}`}
        >
          <SlidersHorizontal size={18} />
        </button>
      </div>

      {showFilters && (
        <div className="bg-white rounded-card shadow-card p-4 space-y-3 border border-border">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <select
              value={searchParams.get('category') || ''}
              onChange={(e) => updateFilter('category', e.target.value || undefined)}
              className="px-2 py-1.5 border border-border rounded-btn text-sm"
            >
              <option value="">All Categories</option>
              <option value="Baking & Cake Decoration">Baking</option>
              <option value="Photography & Videography">Photography</option>
              <option value="Programming & Web Dev">Programming</option>
              <option value="Fitness & Wellness">Fitness</option>
              <option value="Music & Instruments">Music</option>
              <option value="Languages">Languages</option>
            </select>
            <select
              value={searchParams.get('mode') || ''}
              onChange={(e) => updateFilter('mode', e.target.value || undefined)}
              className="px-2 py-1.5 border border-border rounded-btn text-sm"
            >
              <option value="">All Modes</option>
              <option value="PHYSICAL">Physical</option>
              <option value="VIRTUAL">Virtual</option>
              <option value="HYBRID">Hybrid</option>
            </select>
            <select
              value={searchParams.get('sortBy') || 'averageRating'}
              onChange={(e) => updateFilter('sortBy', e.target.value)}
              className="px-2 py-1.5 border border-border rounded-btn text-sm"
            >
              <option value="averageRating">Top Rated</option>
              <option value="totalReviews">Most Reviews</option>
              <option value="totalStudents">Most Students</option>
            </select>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={searchParams.get('verifiedOnly') === 'true'}
                onChange={(e) => updateFilter('verifiedOnly', e.target.checked ? 'true' : undefined)}
                className="rounded"
              />
              Verified Only
            </label>
          </div>
          {hasFilters && (
            <button onClick={clearFilters} className="flex items-center gap-1 text-xs text-primary hover:underline">
              <X size={12} /> Clear all filters
            </button>
          )}
        </div>
      )}
    </div>
  );
}
