'use client';

import { RatingStars } from './rating-stars';
import { formatDate } from '@backend/lib/utils';

interface ReviewCardProps {
  traineeName: string;
  avatarUrl: string | null;
  rating: number;
  comment: string | null;
  createdAt: string;
}

export function ReviewCard({ traineeName, avatarUrl, rating, comment, createdAt }: ReviewCardProps) {
  return (
    <div className="rounded-card bg-white shadow-card p-4">
      <div className="flex items-start gap-3 mb-2">
        <div className="w-10 h-10 rounded-full bg-primary/10 flex-shrink-0 overflow-hidden">
          {avatarUrl ? (
            <img src={avatarUrl} alt={traineeName} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-primary font-bold text-sm">
              {traineeName[0]}
            </div>
          )}
        </div>
        <div className="flex-1">
          <div className="flex items-center justify-between">
            <h4 className="font-medium text-sm text-dark">{traineeName}</h4>
            <span className="text-xs text-muted-foreground">{formatDate(createdAt)}</span>
          </div>
          <RatingStars rating={rating} size={14} />
        </div>
      </div>
      {comment && <p className="text-sm text-body ml-13">{comment}</p>}
    </div>
  );
}
