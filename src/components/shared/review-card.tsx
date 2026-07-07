import { Star } from 'lucide-react';
import { formatDate } from '@/lib/utils';

interface ReviewCardProps {
  traineeName: string;
  avatarUrl?: string | null;
  rating: number;
  comment?: string;
  createdAt: string;
}

export function ReviewCard({ traineeName, avatarUrl, rating, comment, createdAt }: ReviewCardProps) {
  return (
    <div className="bg-white rounded-card shadow-card p-4">
      <div className="flex items-center gap-3 mb-2">
        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xs">
          {traineeName?.[0] || '?'}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-dark">{traineeName}</p>
          <p className="text-xs text-muted-foreground">{formatDate(createdAt)}</p>
        </div>
        <div className="flex items-center gap-0.5">
          {[1, 2, 3, 4, 5].map((star) => (
            <Star key={star} size={12} className={star <= rating ? 'text-warning fill-warning' : 'text-gray-200'} />
          ))}
        </div>
      </div>
      {comment && <p className="text-sm text-body">{comment}</p>}
    </div>
  );
}
