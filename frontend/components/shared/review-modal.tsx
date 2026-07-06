'use client';

import { useState } from 'react';
import { Star, X } from 'lucide-react';
import { cn } from '@backend/lib/utils';

interface ReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (rating: number, comment: string) => void;
  isPending?: boolean;
  trainerName?: string;
  courseTitle?: string;
}

export function ReviewModal({ isOpen, onClose, onSubmit, isPending, trainerName, courseTitle }: ReviewModalProps) {
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (rating === 0) return;
    onSubmit(rating, comment.trim());
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/50" onClick={onClose}>
      <div
        className="bg-white rounded-t-2xl sm:rounded-card shadow-modal w-full sm:max-w-md p-6 sm:mb-0 max-h-[85vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-dark">Write a Review</h3>
          <button onClick={onClose} className="p-1 text-muted-foreground hover:text-dark rounded-full hover:bg-accent">
            <X size={20} />
          </button>
        </div>

        {trainerName && (
          <p className="text-sm text-body mb-1">Trainer: <span className="font-medium text-dark">{trainerName}</span></p>
        )}
        {courseTitle && (
          <p className="text-xs text-muted-foreground mb-4">{courseTitle}</p>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-sm font-medium text-dark mb-2 block">Rating</label>
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onMouseEnter={() => setHoverRating(star)}
                  onMouseLeave={() => setHoverRating(0)}
                  onClick={() => setRating(star)}
                  className="p-0.5 transition-transform hover:scale-110"
                >
                  <Star
                    size={28}
                    className={cn(
                      'transition-colors',
                      star <= (hoverRating || rating) ? 'text-primary fill-primary' : 'text-gray-200'
                    )}
                  />
                </button>
              ))}
            </div>
            {rating === 0 && <p className="text-xs text-destructive mt-1">Please select a rating</p>}
          </div>

          <div>
            <label className="text-sm font-medium text-dark mb-1 block">Comment (optional)</label>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Share your experience..."
              rows={4}
              className="w-full px-3 py-2 border border-border rounded-btn text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 resize-none"
            />
          </div>

          <div className="flex gap-3">
            <button
              type="submit"
              disabled={rating === 0 || isPending}
              className="flex-1 py-2.5 bg-primary text-white font-medium rounded-btn hover:bg-primary/90 disabled:opacity-50 transition-colors"
            >
              {isPending ? 'Submitting...' : 'Submit Review'}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 border border-border text-body rounded-btn hover:bg-accent transition-colors"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
