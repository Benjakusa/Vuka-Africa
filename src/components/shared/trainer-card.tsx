import React, { useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { Star, BookOpen, ShieldCheck, ShieldX } from 'lucide-react';
import { trainerKeys } from '@/lib/query-keys';
import { getTrainer } from '@/services/trainerService';

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
  skills,
  courses,
  user,
}: TrainerCardProps) {
  const queryClient = useQueryClient();

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
      className="block bg-white rounded-card p-5 h-full transition-shadow duration-200"
      style={{ boxShadow: '0 1px 3px 0 rgb(0 0 0 / 0.06), 0 1px 2px -1px rgb(0 0 0 / 0.06), 0 0 0 1px rgba(255,69,0,0.06)' }}
    >
      <div className="flex flex-col items-center text-center h-full">
        <div className="w-20 h-20 rounded-full bg-surface flex items-center justify-center text-primary font-bold text-2xl overflow-hidden mb-4 shrink-0">
          {user?.avatarUrl ? (
            <img src={user.avatarUrl} alt={fullName} className="w-full h-full object-cover" />
          ) : (
            fullName?.[0]
          )}
        </div>

        <div className="flex items-center justify-between w-full mb-3">
          <h3 className="font-bold text-dark text-base truncate mr-2">{fullName}</h3>
          <div className="flex items-center gap-1 shrink-0">
            <Star size={14} className="fill-[#FF4500] text-[#FF4500]" />
            <span className="text-sm font-semibold text-dark">{averageRating?.toFixed(1) || '0.0'}</span>
            <span className="text-xs text-muted-foreground">({totalReviews || 0})</span>
          </div>
        </div>

        {skills && skills.length > 0 && (
          <div className="flex flex-wrap justify-center gap-1.5 mb-4 w-full">
            {skills.slice(0, 4).map((s) => (
              <span key={s} className="px-2.5 py-1 bg-surface text-[#FF4500] text-xs font-medium rounded-full">
                {s}
              </span>
            ))}
          </div>
        )}

        <div className="mt-auto flex items-center justify-between w-full pt-3 border-t border-border">
          <span className="flex items-center gap-1.5 text-sm text-body font-medium">
            <BookOpen size={15} className="text-muted-foreground" />
            {courses?.length || 0} Courses
          </span>
          <span className={`flex items-center gap-1 text-sm font-medium ${isVerified ? 'text-blue-600' : 'text-muted-foreground'}`}>
            {isVerified ? (
              <><ShieldCheck size={15} className="text-blue-500" /> Verified</>
            ) : (
              <><ShieldX size={15} /> Unverified</>
            )}
          </span>
        </div>
      </div>
    </Link>
  );
});
