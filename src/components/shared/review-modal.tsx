import { useState } from 'react';
import { X, Star, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface ReviewModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: { rating: number; comment: string }) => Promise<void>;
}

export function ReviewModal({ open, onClose, onSubmit }: ReviewModalProps) {
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(false);

  if (!open) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (rating === 0) return;
    setLoading(true);
    try {
      await onSubmit({ rating, comment });
      toast.success('Review submitted!');
      onClose();
    } catch (err: any) {
      toast.error(err.message || 'Failed to submit review');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="bg-white rounded-2xl -modal max-w-md w-full p-6 relative">
        <button onClick={onClose} className="absolute top-4 right-4 p-1 text-body-foreground hover:text-dark">
          <X size={20} />
        </button>

        <div className="text-center mb-6">
          <h2 className="text-lg font-bold text-dark">Rate Your Experience</h2>
          <p className="text-sm text-body mt-1">Share your feedback to help the community.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex items-center justify-center gap-1">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                onMouseEnter={() => setHoverRating(star)}
                onMouseLeave={() => setHoverRating(0)}
                onClick={() => setRating(star)}
                className="p-1"
              >
                <Star
                  size={32}
                  className={cn(
                    'transition-colors',
                    (hoverRating || rating) >= star ? 'text-body fill-warning' : 'text-gray-200',
                  )}
                />
              </button>
            ))}
          </div>

          <div>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows={3}
              className="w-full px-3 py-2.5 border border-border rounded-btn text-sm resize-none"
              placeholder="Write your review (optional)"
            />
          </div>

          <button
            type="submit"
            disabled={loading || rating === 0}
            className="w-full py-2.5 bg-primary text-white font-medium rounded-btn hover:bg-surface disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
          >
            {loading && <Loader2 size={16} className="animate-spin" />}
            Submit Review
          </button>
        </form>
      </div>
    </div>
  );
}
