import { useState, useEffect, useRef, useCallback } from 'react';
import { X, Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import { useAuthStore } from '@/stores/auth-store';
import { supabase } from '@/lib/supabase';
import { initiateMpesaPayment } from '@/services/paymentService';
import { formatCurrency } from '@/lib/utils';

interface MpesaPaymentModalProps {
  open: boolean;
  onClose: () => void;
  type: 'enrolment' | 'verification';
  courseId?: string;
  trainerId?: string;
  amount: number;
  phone?: string;
  onSuccess?: () => void;
}

export function MpesaPaymentModal({
  open,
  onClose,
  type,
  courseId,
  trainerId,
  amount,
  phone: initialPhone,
  onSuccess,
}: MpesaPaymentModalProps) {
  const [phone, setPhone] = useState(initialPhone || '+254');
  const [step, setStep] = useState<'form' | 'processing' | 'polling' | 'success' | 'error'>('form');
  const [message, setMessage] = useState('');
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const stepRef = useRef(step);
  const submittingRef = useRef(false);
  const { user } = useAuthStore();

  stepRef.current = step;

  const cleanup = useCallback(() => {
    if (pollingRef.current) {
      clearInterval(pollingRef.current);
      pollingRef.current = null;
    }
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, []);

  useEffect(() => {
    if (!open) {
      setStep('form');
      setMessage('');
      submittingRef.current = false;
      cleanup();
    }
  }, [open, cleanup]);

  const isSubmitting = step === 'processing' || step === 'polling';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submittingRef.current) return;
    submittingRef.current = true;
    setStep('processing');
    setMessage('');

    try {
      const cleanPhone = phone.replace(/[^0-9]/g, '');
      if (cleanPhone.length < 10) {
        throw new Error('Please enter a valid M-Pesa phone number');
      }

      // Check for existing enrolment for this user + course
      if (type === 'enrolment') {
        const { data: existing } = await supabase
          .from('Enrolment')
          .select('status')
          .eq('courseId', courseId)
          .eq('traineeId', user!.id)
          .maybeSingle();

        if (existing) {
          if (existing.status === 'PENDING_PAYMENT') {
            throw new Error('Your payment request is still pending. Please complete the M-Pesa prompt on your phone or wait for the current request to finish.');
          }
          if (existing.status === 'PENDING_ACCEPTANCE') {
            setStep('success');
            onSuccess?.();
            return;
          }
          throw new Error('You are already enrolled in this course. Please check your enrolled courses or explore other available courses.');
        }
      }

      if (type === 'enrolment') {
        const now = new Date().toISOString();
        const { data: trainerProfile } = await supabase
          .from('Trainer')
          .select('commissionRate')
          .eq('id', trainerId)
          .maybeSingle();
        const rate = Number(trainerProfile?.commissionRate || 20);
        const commissionKes = Math.round(amount * (rate / 100) * 100) / 100;
        const trainerPayoutKes = amount - commissionKes;

        const { data: enrolment, error: createError } = await supabase
          .from('Enrolment')
          .insert({
            courseId,
            trainerId,
            traineeId: user!.id,
            pricePaidKes: amount,
            commissionKes,
            trainerPayoutKes,
            status: 'PENDING_PAYMENT',
            createdAt: now,
            updatedAt: now,
          })
          .select('id')
          .single();

        if (createError) {
          if (createError.code === '23505') {
            submittingRef.current = false;
            setStep('success');
            onSuccess?.();
            return;
          }
          throw new Error(createError.message);
        }

        const result = await initiateMpesaPayment({
          phone: cleanPhone,
          amount,
          reference: `ENROL-${enrolment.id.slice(0, 6)}`,
          description: 'Course Enrolment',
          enrolmentId: enrolment.id,
          trainerId,
        });

        if (!result.CheckoutRequestID) {
          throw new Error(result.ResponseDescription || 'Failed to initiate payment');
        }

        setStep('polling');
        startPolling(enrolment.id);
        return;
      }

      const result = await initiateMpesaPayment({
        phone: cleanPhone,
        amount,
        reference: `VERIFY-${user!.id.slice(0, 6)}`,
        description: 'Verification Fee',
        trainerId,
      });

      if (!result.CheckoutRequestID) {
        throw new Error(result.ResponseDescription || 'Failed to initiate payment');
      }

      setStep('polling');
      startPolling(trainerId!);
    } catch (err: any) {
      submittingRef.current = false;
      setStep('error');
      setMessage(err.message || 'Payment failed. Please try again.');
    }
  };

  const startPolling = (recordId: string) => {
    const POLL_INTERVAL = 2500;
    const POLL_TIMEOUT = 120000;

    timeoutRef.current = setTimeout(() => {
      cleanup();
      submittingRef.current = false;
      if (stepRef.current === 'polling') {
        setStep('error');
        setMessage('Payment confirmation timed out. Please check again later.');
      }
    }, POLL_TIMEOUT);

    pollingRef.current = setInterval(async () => {
      if (type === 'enrolment') {
        const { data, error } = await supabase.from('Enrolment').select('status').eq('id', recordId).maybeSingle();
        if (error || !data) return;

        if (data.status === 'PENDING_ACCEPTANCE') {
          cleanup();
          submittingRef.current = false;
          setStep('success');
          onSuccess?.();
        } else if (data.status === 'CANCELLED') {
          cleanup();
          submittingRef.current = false;
          setStep('error');
          setMessage('Your previous payment did not go through. Please try again.');
        }
      } else {
        const { data, error } = await supabase
          .from('Trainer')
          .select('verificationFeePaid')
          .eq('id', recordId)
          .maybeSingle();
        if (error || !data) return;

        if (data.verificationFeePaid) {
          cleanup();
          submittingRef.current = false;
          setStep('success');
          onSuccess?.();
        }
      }
    }, POLL_INTERVAL);
  };

  if (!open) return null;

  const formatPhone = (val: string) => {
    const digits = val.replace(/[^0-9]/g, '');
    if (digits.startsWith('254')) return `+${digits}`;
    if (digits.startsWith('0')) return `+254${digits.slice(1)}`;
    return `+254${digits}`;
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
              <div className="w-14 h-14 bg-surface rounded-full flex items-center justify-center mx-auto mb-3">
                {type === 'enrolment' ? (
                  <svg className="w-7 h-7 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                ) : (
                  <svg className="w-7 h-7 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                    />
                  </svg>
                )}
              </div>
              <h2 className="text-xl font-bold text-dark">
                {type === 'enrolment' ? 'Complete Enrolment' : 'Pay Verification Fee'}
              </h2>
              <p className="text-sm text-body mt-1">Amount: {formatCurrency(amount)}</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-sm font-medium text-dark mb-1 block">M-Pesa Phone Number</label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(formatPhone(e.target.value))}
                  placeholder="+254 712 345 678"
                  required
                  className="w-full px-3 py-2.5 border border-border rounded-btn text-sm"
                />
                <p className="text-xs text-body-foreground mt-1">You will receive an STK Push prompt on this number.</p>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3 bg-primary text-white font-medium rounded-btn hover:bg-surface transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? 'Processing...' : `Pay ${formatCurrency(amount)}`}
              </button>
            </form>
          </>
        )}

        {step === 'processing' && (
          <div className="text-center py-8">
            <Loader2 size={48} className="animate-spin text-primary mx-auto mb-4" />
            <h2 className="text-lg font-semibold text-dark mb-1">Initiating Payment</h2>
            <p className="text-sm text-body">Please wait...</p>
          </div>
        )}

        {step === 'polling' && (
          <div className="text-center py-8">
            <Loader2 size={48} className="animate-spin text-primary mx-auto mb-4" />
            <h2 className="text-lg font-semibold text-dark mb-1">Check Your Phone</h2>
            <p className="text-sm text-body mb-2">
              Enter your M-Pesa PIN on the STK Push prompt sent to <strong>{phone}</strong>.
            </p>
            <p className="text-xs text-body-foreground">Waiting for confirmation...</p>
          </div>
        )}

        {step === 'success' && (
          <div className="text-center py-8">
            <CheckCircle size={48} className="text-foreground mx-auto mb-4" />
            <h2 className="text-lg font-semibold text-dark mb-1">You're Enrolled!</h2>
            <p className="text-sm text-body mb-2">
              Your payment of {formatCurrency(amount)} has been processed successfully.
            </p>
            <p className="text-sm text-primary font-medium mb-6">The trainer will contact you soon to coordinate.</p>
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
            <h2 className="text-lg font-semibold text-dark mb-1">Payment Failed</h2>
            <p className="text-sm text-body mb-4">{message}</p>
            <button
              onClick={() => { submittingRef.current = false; setStep('form'); }}
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
