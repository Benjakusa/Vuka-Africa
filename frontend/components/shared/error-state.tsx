import { AlertCircle, RefreshCw } from 'lucide-react';

interface ErrorStateProps {
  message?: string;
  onRetry?: () => void;
}

export function ErrorState({ message = 'Something went wrong', onRetry }: ErrorStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
      <AlertCircle className="w-16 h-16 text-destructive mb-4" strokeWidth={1} />
      <h3 className="text-lg font-semibold text-dark mb-1">{message}</h3>
      <p className="text-body text-sm mb-6">Please try again or contact support if the issue persists.</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-btn text-sm font-medium hover:bg-primary/90 transition-colors"
        >
          <RefreshCw size={16} /> Try Again
        </button>
      )}
    </div>
  );
}
