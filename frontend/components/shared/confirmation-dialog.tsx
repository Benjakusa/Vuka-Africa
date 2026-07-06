'use client';

import { X, AlertTriangle } from 'lucide-react';

interface ConfirmationDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmLabel?: string;
  confirmColor?: 'primary' | 'destructive' | 'warning';
  isPending?: boolean;
}

export function ConfirmationDialog({
  isOpen, onClose, onConfirm, title, message,
  confirmLabel = 'Confirm', confirmColor = 'destructive', isPending,
}: ConfirmationDialogProps) {
  if (!isOpen) return null;

  const colorClasses = {
    primary: 'bg-primary hover:bg-primary/90',
    destructive: 'bg-destructive hover:bg-destructive/90',
    warning: 'bg-warning hover:bg-warning/90',
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={onClose}>
      <div className="bg-white rounded-card shadow-modal w-full max-w-sm p-6" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-warning/10 rounded-full flex items-center justify-center">
            <AlertTriangle size={20} className="text-warning" />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-dark">{title}</h3>
          </div>
          <button onClick={onClose} className="p-1 text-muted-foreground hover:text-dark">
            <X size={20} />
          </button>
        </div>
        <p className="text-sm text-body mb-6">{message}</p>
        <div className="flex gap-3">
          <button
            onClick={onConfirm}
            disabled={isPending}
            className={`flex-1 py-2.5 text-white font-medium rounded-btn disabled:opacity-50 transition-colors ${colorClasses[confirmColor]}`}
          >
            {isPending ? 'Processing...' : confirmLabel}
          </button>
          <button onClick={onClose} className="flex-1 py-2.5 border border-border text-body rounded-btn hover:bg-accent transition-colors">
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
