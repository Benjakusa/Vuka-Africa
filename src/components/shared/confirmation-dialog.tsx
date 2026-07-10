import { X, AlertTriangle, Loader2 } from 'lucide-react';

interface ConfirmationDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  title: string;
  message: string;
  confirmLabel?: string;
  loading?: boolean;
  variant?: 'primary' | 'destructive';
}

export function ConfirmationDialog({
  open,
  onClose,
  onConfirm,
  title,
  message,
  confirmLabel = 'Confirm',
  loading = false,
  variant = 'primary',
}: ConfirmationDialogProps) {
  if (!open) return null;

  const handleConfirm = async () => {
    await onConfirm();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="bg-white rounded-2xl -modal max-w-sm w-full p-6 relative">
        <button onClick={onClose} className="absolute top-4 right-4 p-1 text-body-foreground hover:text-dark">
          <X size={20} />
        </button>
        <div className="text-center mb-6">
          <AlertTriangle
            size={40}
            className={variant === 'destructive' ? 'text-primary mx-auto mb-3' : 'text-primary mx-auto mb-3'}
          />
          <h2 className="text-lg font-bold text-dark">{title}</h2>
          <p className="text-sm text-body mt-1">{message}</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 border border-border text-sm font-medium rounded-btn hover:bg-accent transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={loading}
            className={`flex-1 py-2.5 text-white text-sm font-medium rounded-btn transition-colors flex items-center justify-center gap-2 ${
              variant === 'destructive'
                ? 'bg-primary text-white hover:bg-primary text-white/90 disabled:opacity-50'
                : 'bg-primary hover:bg-surface disabled:opacity-50'
            }`}
          >
            {loading && <Loader2 size={14} className="animate-spin" />}
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
