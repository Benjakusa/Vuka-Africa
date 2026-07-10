import React, { useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { Star, Users } from 'lucide-react';
import { VerifiedBadge } from './verified-badge';
import { trainerKeys } from '@/lib/query-keys';
import { getTrainer } from '@/services/trainerService';
import { formatCurrency } from '@/lib/utils';

interface TrainerCardProps {
  id: string;
  fullName: string;
  isVerified: boolean;
  averageRating: number;
  totalReviews: number;
  bio?: string | null;
  skills?: string[];
  user?: { avatarUrl?: string | null };
  courses?: any[];
}

export const TrainerCard = React.memo(function TrainerCard({
  id,
  fullName,
  isVerified,
  averageRating,
  totalReviews,
  bio,
  skills,
  courses,
  user,
}: TrainerCardProps) {
  const queryClient = useQueryClient();
  const minPrice = courses?.length ? Math.min(...courses.map((c: any) => Number(c.priceKes))) : null;

  const prefetch = useCallback(() => {
    queryClient.prefetchQuery({
      queryKey: trainerKeys.detail(id),
      queryFn: () => getTrainer(id),
      staleTime: 60_000,
    });
  }, [queryClient, id]);

  return (
    <Link
      to={`/trainer/${id}`}
      onMouseEnter={prefetch}
      className="block bg-white rounded-card shadow-card hover:shadow-cardHover transition-shadow p-4"
    >
      <div className="flex items-center gap-3 mb-3">
        <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold overflow-hidden">
          {user?.avatarUrl ? (
            <img src={user.avatarUrl} alt={fullName} className="w-full h-full object-cover" />
          ) : (
            fullName?.[0]
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <h3 className="font-semibold text-dark text-sm truncate">{fullName}</h3>
            <VerifiedBadge isVerified={isVerified} size="sm" />
          </div>
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Star size={12} className="text-warning fill-warning" />
            <span>{averageRating?.toFixed(1) || '0.0'}</span>
            <span>({totalReviews || 0})</span>
          </div>
        </div>
      </div>
      {bio && <p className="text-xs text-body line-clamp-2 mb-3">{bio}</p>}
      {skills && skills.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-3">
          {skills.slice(0, 3).map((s) => (
            <span key={s} className="px-2 py-0.5 bg-primary/10 text-primary text-xs rounded-full">
              {s}
            </span>
          ))}
        </div>
      )}
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span className="flex items-center gap-1">
          <Users size={12} /> {courses?.length || 0} courses
        </span>
        {minPrice && <span className="font-medium text-dark">From {formatCurrency(minPrice)}</span>}
      </div>
    </Link>
  );
});
