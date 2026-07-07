import { useState } from 'react';
import { X, Loader2, Wallet, CheckCircle, AlertCircle } from 'lucide-react';
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
      setMessage(err.message || 'Withdrawal failed');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="bg-white rounded-2xl shadow-modal max-w-md w-full p-6 relative">
        <button onClick={onClose} className="absolute top-4 right-4 p-1 text-muted-foreground hover:text-dark">
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
                <label className="text-sm font-medium text-dark mb-1 block">Amount (KES)</label>
                <input
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
                <label className="text-sm font-medium text-dark mb-1 block">M-Pesa Phone Number</label>
                <input
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
              <button
                type="submit"
                disabled={!amount || Number(amount) < 100}
                className="w-full py-3 bg-primary text-white font-medium rounded-btn hover:bg-primary/90 disabled:opacity-50"
              >
                Withdraw to M-Pesa
              </button>
            </form>
          </>
        )}

        {step === 'processing' && (
          <div className="text-center py-8">
            <Loader2 size={48} className="animate-spin text-primary mx-auto mb-4" />
            <h2 className="text-lg font-semibold text-dark mb-1">Processing Withdrawal</h2>
            <p className="text-sm text-body">Check your phone for the M-Pesa prompt.</p>
          </div>
        )}

        {step === 'success' && (
          <div className="text-center py-8">
            <CheckCircle size={48} className="text-green-500 mx-auto mb-4" />
            <h2 className="text-lg font-semibold text-dark mb-1">Withdrawal Successful!</h2>
            <p className="text-sm text-body mb-4">Funds sent to your M-Pesa.</p>
            <button
              onClick={onClose}
              className="px-6 py-2 bg-primary text-white font-medium rounded-btn hover:bg-primary/90"
            >
              Done
            </button>
          </div>
        )}

        {step === 'error' && (
          <div className="text-center py-8">
            <AlertCircle size={48} className="text-destructive mx-auto mb-4" />
            <h2 className="text-lg font-semibold text-dark mb-1">Withdrawal Failed</h2>
            <p className="text-sm text-body mb-4">{message}</p>
            <button
              onClick={() => setStep('form')}
              className="px-6 py-2 bg-primary text-white font-medium rounded-btn hover:bg-primary/90"
            >
              Try Again
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
