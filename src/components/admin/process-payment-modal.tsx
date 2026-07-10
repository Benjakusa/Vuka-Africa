import { useState } from 'react';
import { X, Loader2, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { processTrainerPayment } from '@/services/adminService';
import { formatCurrency } from '@/lib/utils';
import { useAuthStore } from '@/stores/auth-store';

interface ProcessPaymentModalProps {
  open: boolean;
  onClose: () => void;
  payout: {
    id: string;
    trainerId: string;
    trainerName: string;
    trainerEmail: string;
    amountKes: number;
    mpesaPhone: string;
    availableBalance: number;
    requestDate: string;
  };
  onProcessed: () => void;
}

export function ProcessPaymentModal({ open, onClose, payout, onProcessed }: ProcessPaymentModalProps) {
  const { user } = useAuthStore();
  const [amountPaid, setAmountPaid] = useState(payout.amountKes.toString());
  const [mpesaTransactionId, setMpesaTransactionId] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'mpesa' | 'bank' | 'other'>('mpesa');
  const [notes, setNotes] = useState('');
  const [processing, setProcessing] = useState(false);

  if (!open) return null;

  const numericAmount = parseFloat(amountPaid) || 0;

  const handleSubmit = async () => {
    if (numericAmount <= 0) {
      toast.error('Payment amount must be greater than 0');
      return;
    }
    if (paymentMethod === 'mpesa' && !mpesaTransactionId.trim()) {
      toast.error('Please enter the M-Pesa transaction code');
      return;
    }

    setProcessing(true);
    try {
      await processTrainerPayment({
        payoutId: payout.id,
        amountPaid: numericAmount,
        mpesaTransactionId: mpesaTransactionId.trim() || `manual-${Date.now()}`,
        paymentMethod,
        notes: notes.trim() || undefined,
        adminId: user!.id,
      });
      toast.success(`Payment of ${formatCurrency(numericAmount)} processed successfully`);
      onProcessed();
    } catch (err: any) {
      toast.error(err.message || 'Failed to process payment');
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={onClose}>
      <div
        className="bg-white rounded-card -modal w-full max-w-lg max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-6 border-b border-border">
          <h2 className="text-lg font-bold text-dark">Process Trainer Payment</h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-accent rounded-full transition-colors"
            aria-label="Close modal"
          >
            <X size={20} className="text-body-foreground" />
          </button>
        </div>

        <div className="p-6 space-y-5">
          <div className="bg-surface rounded-card p-4 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm text-body">Trainer</span>
              <span className="text-sm font-medium text-dark">{payout.trainerName}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-body">Email</span>
              <span className="text-sm text-dark">{payout.trainerEmail}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-body">M-Pesa Phone</span>
              <span className="text-sm font-medium text-dark">{payout.mpesaPhone || 'Not provided'}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-body">Requested Amount</span>
              <span className="text-sm font-semibold text-dark">{formatCurrency(payout.amountKes)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-body">Available Balance</span>
              <span className="text-sm font-semibold text-dark">{formatCurrency(payout.availableBalance)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-body">Request Date</span>
              <span className="text-sm text-dark">{new Date(payout.requestDate).toLocaleDateString()}</span>
            </div>
          </div>

          <div>
            <label htmlFor="amountPaid" className="block text-sm font-medium text-dark mb-1.5">
              Payment Amount *
            </label>
            <p className="text-xs text-body-foreground mb-2">
              You can adjust the amount to pay (defaults to requested amount)
            </p>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-body-foreground">KES</span>
              <input
                id="amountPaid"
                type="number"
                step="0.01"
                min="0"
                max={payout.amountKes}
                value={amountPaid}
                onChange={(e) => setAmountPaid(e.target.value)}
                className="w-full pl-12 pr-3 py-2 text-sm border border-input rounded-btn focus: focus:"
              />
            </div>
          </div>

          <div>
            <label htmlFor="paymentMethod" className="block text-sm font-medium text-dark mb-1.5">
              Payment Method *
            </label>
            <select
              id="paymentMethod"
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value as 'mpesa' | 'bank' | 'other')}
              className="w-full px-3 py-2 text-sm border border-input rounded-btn focus: focus: bg-white"
            >
              <option value="mpesa">Manual M-Pesa (admin sends via M-Pesa)</option>
              <option value="bank">Bank Transfer</option>
              <option value="other">Record Payment Only</option>
            </select>
          </div>

          {paymentMethod === 'mpesa' && (
            <div>
              <label htmlFor="mpesaTransactionId" className="block text-sm font-medium text-dark mb-1.5">
                M-Pesa Transaction Code *
              </label>
              <input
                id="mpesaTransactionId"
                type="text"
                placeholder="e.g. SDF34H6K"
                value={mpesaTransactionId}
                onChange={(e) => setMpesaTransactionId(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-input rounded-btn focus: focus:"
              />
            </div>
          )}

          <div>
            <label htmlFor="paymentNotes" className="block text-sm font-medium text-dark mb-1.5">
              Admin Notes
            </label>
            <textarea
              id="paymentNotes"
              rows={3}
              placeholder="Optional notes about this payment..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-input rounded-btn focus: focus: resize-none"
            />
          </div>

          <div className="flex items-start gap-2 p-3 bg-surface rounded-card">
            <AlertCircle size={16} className="text-body mt-0.5 shrink-0" />
            <p className="text-xs text-body">
              This records the payment in the system. Ensure you have sent the funds via M-Pesa or bank transfer before
              confirming.
            </p>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 p-6 border-t border-border">
          <button
            onClick={onClose}
            disabled={processing}
            className="px-4 py-2 text-sm font-medium text-dark bg-accent rounded-btn hover:bg-accent/80 transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={processing || numericAmount <= 0}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium bg-primary text-white rounded-btn hover:bg-surface transition-colors disabled:opacity-50"
          >
            {processing && <Loader2 size={16} className="animate-spin" />}
            {processing ? 'Processing...' : `Confirm Payment — ${formatCurrency(numericAmount)}`}
          </button>
        </div>
      </div>
    </div>
  );
}
