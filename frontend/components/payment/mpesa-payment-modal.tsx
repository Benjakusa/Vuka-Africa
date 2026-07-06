'use client';

import { useState, useCallback, useEffect } from 'react';
import { X, CheckCircle, AlertCircle, Clock, Smartphone } from 'lucide-react';
import { api } from '@backend/lib/api';
import { formatCurrency } from '@backend/lib/utils';
import { toast } from 'sonner';

interface MpesaPaymentModalProps {
  open: boolean;
  onClose: () => void;
  type: 'enrolment' | 'verification';
  referenceId: string;
  amount: number;
  phone?: string;
  onSuccess?: (data?: any) => void;
}

type Step = 'confirm' | 'pushing' | 'waiting' | 'success' | 'failure' | 'timeout';

export function MpesaPaymentModal({ open, onClose, type, referenceId, amount, phone: initialPhone, onSuccess }: MpesaPaymentModalProps) {
  const [step, setStep] = useState<Step>('confirm');
  const [phone, setPhone] = useState(initialPhone || '');
  const [errorMessage, setErrorMessage] = useState('');
  const [elapsed, setElapsed] = useState(0);
  const [result, setResult] = useState<any>(null);

  const reset = useCallback(() => {
    setStep('confirm');
    setErrorMessage('');
    setElapsed(0);
    setResult(null);
  }, []);

  useEffect(() => {
    if (open) reset();
  }, [open, reset]);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (step === 'waiting' && elapsed < 60) {
      timer = setInterval(() => setElapsed((e) => e + 1), 1000);
    }
    if (elapsed >= 60 && step === 'waiting') {
      setStep('timeout');
    }
    return () => clearInterval(timer);
  }, [step, elapsed]);

  useEffect(() => {
    let pollTimer: NodeJS.Timeout;
    if (step === 'waiting') {
      pollTimer = setInterval(async () => {
        try {
          const res = await api.get<any>(`/enrolments/${referenceId}`);
          if (res.data?.status === 'ACTIVE' || res.data?.status === 'COMPLETED') {
            setStep('success');
            setResult(res.data);
            clearInterval(pollTimer);
          }
        } catch {}
      }, 3000);
    }
    return () => clearInterval(pollTimer);
  }, [step, referenceId]);

  const handlePay = async () => {
    setStep('pushing');
    try {
      if (type === 'enrolment') {
        const res = await api.post<any>('/enrolments', { courseId: referenceId });
        setResult(res.data);
        setStep('waiting');
      } else {
        const res = await api.post<any>('/trainers/me/verify/pay');
        setResult(res.data);
        setStep('waiting');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Payment failed');
      setStep('failure');
    }
  };

  const handleSuccess = () => {
    onSuccess?.(result);
    onClose();
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={onClose}>
      <div className="bg-white rounded-card shadow-modal w-full max-w-md p-6" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-dark">
            {type === 'enrolment' ? 'Enrol in Course' : 'Verification Fee'}
          </h2>
          <button onClick={onClose} className="p-1 text-muted-foreground hover:text-dark">
            <X size={20} />
          </button>
        </div>

        {step === 'confirm' && (
          <div className="space-y-4">
            <div className="bg-primary/5 rounded-lg p-4 text-center">
              <p className="text-2xl font-bold text-primary">{formatCurrency(amount)}</p>
              <p className="text-sm text-muted-foreground mt-1">
                {type === 'enrolment' ? 'Course enrolment fee' : 'One-time verification fee'}
              </p>
            </div>
            <div>
              <label className="text-sm font-medium text-dark mb-1 block">M-Pesa Phone Number</label>
              <input
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+254 712 345 678"
                className="w-full px-3 py-2 border border-border rounded-btn text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>
            <button
              onClick={handlePay}
              className="w-full py-2.5 bg-primary text-white font-medium rounded-btn hover:bg-primary/90 transition-colors"
            >
              Pay with M-Pesa
            </button>
            <p className="text-xs text-center text-muted-foreground flex items-center justify-center gap-1">
              <Smartphone size={14} /> You&apos;ll receive an STK push on your phone
            </p>
          </div>
        )}

        {step === 'pushing' && (
          <div className="text-center py-8 space-y-4">
            <div className="animate-spin w-12 h-12 border-4 border-primary/30 border-t-primary rounded-full mx-auto" />
            <p className="text-body font-medium">Contacting M-Pesa...</p>
          </div>
        )}

        {step === 'waiting' && (
          <div className="text-center py-8 space-y-4">
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
              <Smartphone size={32} className="text-primary" />
            </div>
            <div>
              <p className="text-body font-medium">Check your phone</p>
              <p className="text-sm text-muted-foreground mt-1">
                Enter your M-Pesa PIN to complete payment
              </p>
            </div>
            <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
              <Clock size={14} />
              Waiting for confirmation... {elapsed}s elapsed
            </div>
            <div className="w-full bg-accent rounded-full h-1.5">
              <div
                className="bg-primary h-1.5 rounded-full transition-all"
                style={{ width: `${(elapsed / 60) * 100}%` }}
              />
            </div>
          </div>
        )}

        {step === 'success' && (
          <div className="text-center py-8 space-y-4">
            <CheckCircle size={48} className="text-green-500 mx-auto" />
            <div>
              <p className="text-body font-medium">Payment successful!</p>
              <p className="text-sm text-muted-foreground mt-1">
                {type === 'enrolment' ? "You're enrolled!" : 'Your verification fee has been received.'}
              </p>
            </div>
            <button
              onClick={handleSuccess}
              className="w-full py-2.5 bg-primary text-white font-medium rounded-btn hover:bg-primary/90 transition-colors"
            >
              Continue
            </button>
          </div>
        )}

        {step === 'failure' && (
          <div className="text-center py-8 space-y-4">
            <AlertCircle size={48} className="text-destructive mx-auto" />
            <div>
              <p className="text-body font-medium">Payment failed</p>
              <p className="text-sm text-muted-foreground mt-1">{errorMessage || 'Please try again.'}</p>
            </div>
            <div className="flex gap-3">
              <button onClick={reset} className="flex-1 py-2.5 bg-primary text-white font-medium rounded-btn hover:bg-primary/90 transition-colors">
                Try Again
              </button>
              <button onClick={onClose} className="flex-1 py-2.5 border border-border text-body font-medium rounded-btn hover:bg-accent transition-colors">
                Cancel
              </button>
            </div>
          </div>
        )}

        {step === 'timeout' && (
          <div className="text-center py-8 space-y-4">
            <Clock size={48} className="text-warning mx-auto" />
            <div>
              <p className="text-body font-medium">Payment confirmation timed out</p>
              <p className="text-sm text-muted-foreground mt-1">
                Check your M-Pesa and try again. Your enrolment is saved.
              </p>
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
