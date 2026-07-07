import { X, AlertTriangle, Loader2 } from 'lucide-react';

interface ConfirmationDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  title: string;
  message: string;
  confirmLabel?: string;
  variant?: 'primary' | 'destructive';
}

export function ConfirmationDialog({
  open,
  onClose,
  onConfirm,
  title,
  message,
  confirmLabel = 'Confirm',
  variant = 'primary',
}: ConfirmationDialogProps) {
  if (!open) return null;

  const handleConfirm = async () => {
    await onConfirm();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="bg-white rounded-2xl shadow-modal max-w-sm w-full p-6 relative">
        <button onClick={onClose} className="absolute top-4 right-4 p-1 text-muted-foreground hover:text-dark">
          <X size={20} />
        </button>
        <div className="text-center mb-6">
          <AlertTriangle
            size={40}
            className={variant === 'destructive' ? 'text-destructive mx-auto mb-3' : 'text-primary mx-auto mb-3'}
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
            className={`flex-1 py-2.5 text-white text-sm font-medium rounded-btn transition-colors ${
              variant === 'destructive' ? 'bg-destructive hover:bg-destructive/90' : 'bg-primary hover:bg-primary/90'
            }`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
