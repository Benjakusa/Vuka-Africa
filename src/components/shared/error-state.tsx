import { AlertTriangle } from 'lucide-react';

interface ErrorStateProps {
  message?: string;
  onRetry?: () => void;
}

export function ErrorState({ message = 'Something went wrong', onRetry }: ErrorStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
      <AlertTriangle size={48} className="text-destructive mb-4" strokeWidth={1} />
      <h3 className="text-lg font-semibold text-dark mb-1">{message}</h3>
      <p className="text-sm text-muted-foreground mb-4">Please try again later.</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="px-4 py-2 bg-primary text-white text-sm font-medium rounded-btn hover:bg-primary/90 transition-colors"
        >
          Try Again
        </button>
      )}
    </div>
  );
}
