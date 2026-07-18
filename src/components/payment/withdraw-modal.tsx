import { useState } from 'react';
import { X, Loader2, Wallet, CheckCircle, AlertCircle, Clock } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import { toast } from 'sonner';

interface WithdrawModalProps {
  open: boolean;
  onClose: () => void;
  balance: number;
  onWithdraw: (data: { amount: number; phone: string }) => Promise<void>;
}

export function WithdrawModal({ open, onClose, balance, onWithdraw }: WithdrawModalProps) {
  const [amount, setAmount] = useState('');
  const [phone, setPhone] = useState('+254');
  const [step, setStep] = useState<'form' | 'processing' | 'success' | 'error'>('form');
  const [message, setMessage] = useState('');

  if (!open) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const num = Number(amount);
    if (num < 100) {
      toast.error('Minimum withdrawal is KES 100');
      return;
    }
    if (num > balance) {
      toast.error('Insufficient balance');
      return;
    }
    if (num > 50000) {
      toast.error('Maximum withdrawal is KES 50,000');
      return;
    }

    setStep('processing');
    try {
      await onWithdraw({ amount: num, phone: phone.replace(/[^0-9]/g, '') });
      setStep('success');
    } catch (err: any) {
      setStep('error');
      setMessage(err.message || 'Withdrawal request failed');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="bg-white rounded-2xl -modal max-w-md w-full p-6 relative">
        <button onClick={onClose} className="absolute top-4 right-4 p-1 text-body-foreground hover:text-dark">
          <X size={20} />
        </button>

        {step === 'form' && (
          <>
            <div className="text-center mb-6">
              <Wallet size={40} className="text-primary mx-auto mb-3" />
              <h2 className="text-xl font-bold text-dark">Withdraw Earnings</h2>
              <p className="text-sm text-body mt-1">Available balance: {formatCurrency(balance)}</p>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="withdraw-amount" className="text-sm font-medium text-dark mb-1 block">
                  Amount (KES)
                </label>
                <input
                  id="withdraw-amount"
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  min={100}
                  max={Math.min(balance, 50000)}
                  required
                  className="w-full px-3 py-2.5 border border-border rounded-btn text-sm"
                  placeholder="100 - 50,000"
                />
              </div>
              <div>
                <label htmlFor="withdraw-phone" className="text-sm font-medium text-dark mb-1 block">
                  M-Pesa Phone Number
                </label>
                <input
                  id="withdraw-phone"
                  type="tel"
                  value={phone}
                  onChange={(e) =>
                    setPhone(
                      e.target.value.startsWith('+') ? e.target.value : `+${e.target.value.replace(/[^0-9]/g, '')}`,
                    )
                  }
                  required
                  className="w-full px-3 py-2.5 border border-border rounded-btn text-sm"
                  placeholder="+254 712 345 678"
                />
              </div>
              <div className="p-3 bg-surface rounded-card flex items-start gap-2">
                <Clock size={16} className="text-body mt-0.5 shrink-0" />
                <p className="text-xs text-body">
                  Your withdrawal request will be submitted for admin review. An admin will process your payment within
                  24 hours. You will receive an M-Pesa notification when payment is sent.
                </p>
              </div>
              <button
                type="submit"
                disabled={!amount || Number(amount) < 100}
                className="w-full py-3 bg-primary text-white font-medium rounded-btn hover:bg-surface disabled:opacity-50"
              >
                Submit Withdrawal Request
              </button>
            </form>
          </>
        )}

        {step === 'processing' && (
          <div className="text-center py-8">
            <Loader2 size={48} className="animate-spin text-primary mx-auto mb-4" />
            <h2 className="text-lg font-semibold text-dark mb-1">Submitting Request</h2>
            <p className="text-sm text-body">Please wait...</p>
          </div>
        )}

        {step === 'success' && (
          <div className="text-center py-8">
            <CheckCircle size={48} className="text-foreground mx-auto mb-4" />
            <h2 className="text-lg font-semibold text-dark mb-1">Request Submitted!</h2>
            <p className="text-sm text-body mb-4">
              Your withdrawal request has been submitted for admin review. You will receive your payment within 24
              hours.
            </p>
            <button
              onClick={onClose}
              className="px-6 py-2 bg-primary text-white font-medium rounded-btn hover:bg-surface"
            >
              Done
            </button>
          </div>
        )}

        {step === 'error' && (
          <div className="text-center py-8">
            <AlertCircle size={48} className="text-primary mx-auto mb-4" />
            <h2 className="text-lg font-semibold text-dark mb-1">Request Failed</h2>
            <p className="text-sm text-body mb-4">{message}</p>
            <button
              onClick={() => setStep('form')}
              className="px-6 py-2 bg-primary text-white font-medium rounded-btn hover:bg-surface"
            >
              Try Again
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
