'use client';

import { useState } from 'react';
import { X, CheckCircle, AlertCircle, Send, KeyRound } from 'lucide-react';
import { api } from '@backend/lib/api';
import { formatCurrency } from '@backend/lib/utils';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';

interface WithdrawModalProps {
  open: boolean;
  onClose: () => void;
  maxAmount: number;
  defaultPhone?: string;
}

type Step = 'amount' | 'code' | 'processing' | 'success' | 'failure';

export function WithdrawModal({ open, onClose, maxAmount, defaultPhone }: WithdrawModalProps) {
  const [step, setStep] = useState<Step>('amount');
  const [amount, setAmount] = useState('');
  const [phone, setPhone] = useState(defaultPhone || '');
  const [code, setCode] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const queryClient = useQueryClient();

  const amountNum = parseFloat(amount) || 0;
  const isValid = amountNum >= 100 && amountNum <= maxAmount;

  const handleSendCode = async () => {
    try {
      await api.post('/payouts/request-2fa');
      setStep('code');
      toast.success('Verification code sent to your email');
    } catch (err: any) {
      toast.error(err.message || 'Failed to send code');
    }
  };

  const handleConfirm = async () => {
    setStep('processing');
    try {
      await api.post('/payouts/request', { amount: amountNum, phone, code });
      setStep('success');
      queryClient.invalidateQueries({ queryKey: ['earnings'] });
    } catch (err: any) {
      setErrorMessage(err.message || 'Withdrawal failed');
      setStep('failure');
    }
  };

  const reset = () => {
    setStep('amount');
    setAmount('');
    setCode('');
    setErrorMessage('');
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={onClose}>
      <div className="bg-white rounded-card shadow-modal w-full max-w-md p-6" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-dark">Withdraw Funds</h2>
          <button onClick={onClose} className="p-1 text-muted-foreground hover:text-dark">
            <X size={20} />
          </button>
        </div>

        {step === 'amount' && (
          <div className="space-y-4">
            <div className="bg-primary/5 rounded-lg p-4 text-center">
              <p className="text-sm text-muted-foreground">Available Balance</p>
              <p className="text-2xl font-bold text-primary">{formatCurrency(maxAmount)}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-dark mb-1 block">Amount (KES)</label>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="Enter amount"
                max={maxAmount}
                className="w-full px-3 py-2 border border-border rounded-btn text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
              {amountNum > maxAmount && (
                <p className="text-xs text-destructive mt-1">Amount exceeds available balance</p>
              )}
              {amountNum > 0 && amountNum < 100 && (
                <p className="text-xs text-destructive mt-1">Minimum withdrawal is KES 100</p>
              )}
            </div>
            <div>
              <label className="text-sm font-medium text-dark mb-1 block">M-Pesa Phone</label>
              <input
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+254 712 345 678"
                className="w-full px-3 py-2 border border-border rounded-btn text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>
            <button
              onClick={handleSendCode}
              disabled={!isValid || !phone}
              className="w-full py-2.5 bg-primary text-white font-medium rounded-btn hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
            >
              <Send size={16} /> Send Verification Code
            </button>
          </div>
        )}

        {step === 'code' && (
          <div className="space-y-4">
            <div className="flex items-center gap-3 p-3 bg-accent rounded-lg">
              <KeyRound size={20} className="text-primary" />
              <p className="text-sm text-body">Enter the 6-digit code sent to your email</p>
            </div>
            <div>
              <input
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="000000"
                maxLength={6}
                className="w-full text-center text-2xl tracking-[0.5em] px-3 py-3 border border-border rounded-btn focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>
            <p className="text-sm text-muted-foreground">
              Withdrawing <strong>{formatCurrency(amountNum)}</strong> to {phone}
            </p>
            <button
              onClick={handleConfirm}
              disabled={code.length !== 6}
              className="w-full py-2.5 bg-primary text-white font-medium rounded-btn hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Confirm Withdrawal
            </button>
          </div>
        )}

        {step === 'processing' && (
          <div className="text-center py-8 space-y-4">
            <div className="animate-spin w-12 h-12 border-4 border-primary/30 border-t-primary rounded-full mx-auto" />
            <p className="text-body font-medium">Processing your withdrawal...</p>
            <p className="text-sm text-muted-foreground">{formatCurrency(amountNum)} to {phone}</p>
          </div>
        )}

        {step === 'success' && (
          <div className="text-center py-8 space-y-4">
            <CheckCircle size={48} className="text-green-500 mx-auto" />
            <div>
              <p className="text-body font-medium">Withdrawal initiated!</p>
              <p className="text-sm text-muted-foreground mt-1">
                {formatCurrency(amountNum)} will be sent to {phone} within 24 hours.
              </p>
            </div>
            <button onClick={() => { reset(); onClose(); }} className="w-full py-2.5 bg-primary text-white font-medium rounded-btn hover:bg-primary/90 transition-colors">
              Done
            </button>
          </div>
        )}

        {step === 'failure' && (
          <div className="text-center py-8 space-y-4">
            <AlertCircle size={48} className="text-destructive mx-auto" />
            <div>
              <p className="text-body font-medium">Withdrawal failed</p>
              <p className="text-sm text-muted-foreground mt-1">{errorMessage}</p>
            </div>
            <div className="flex gap-3">
              <button onClick={reset} className="flex-1 py-2.5 bg-primary text-white font-medium rounded-btn hover:bg-primary/90 transition-colors">
                Try Again
              </button>
              <button onClick={onClose} className="flex-1 py-2.5 border border-border text-body font-medium rounded-btn hover:bg-accent transition-colors">
                Close
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
