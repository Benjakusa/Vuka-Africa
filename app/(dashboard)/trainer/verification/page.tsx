'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { ShieldCheck, CheckCircle, XCircle, Clock, Upload, Video, Camera, ArrowRight, Loader2, RefreshCw } from 'lucide-react';
import { BackButton } from '@frontend/components/shared/back-button';
import { api } from '@backend/lib/api';
import { FileUpload } from '@frontend/components/shared/file-upload';
import { ErrorState } from '@frontend/components/shared/error-state';
import { OfflineBanner } from '@frontend/components/shared/offline-banner';
import { MpesaPaymentModal } from '@frontend/components/payment/mpesa-payment-modal';
import { toast } from 'sonner';

export default function VerificationPage() {
  const queryClient = useQueryClient();
  const [showPayment, setShowPayment] = useState(false);
  const [idDocUrl, setIdDocUrl] = useState('');
  const [videoUrl, setVideoUrl] = useState('');

  const { data: profile, isLoading, isError, refetch } = useQuery({
    queryKey: ['trainer-profile'],
    queryFn: () => api.get<any>('/trainers/me'),
  });

  const submitMutation = useMutation({
    mutationFn: () => api.post('/trainers/me/verification/submit', { idDocumentUrl: idDocUrl, introductionVideoUrl: videoUrl }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trainer-profile'] });
      toast.success('Verification submitted! We\'ll review within 48 hours.');
    },
    onError: (err: any) => toast.error(err.message || 'Failed to submit verification'),
  });

  const p = profile?.data;

  if (isLoading) return <div className="p-8"><div className="animate-spin w-6 h-6 border-2 border-primary/30 border-t-primary rounded-full mx-auto" /></div>;
  if (isError) return <ErrorState message="Failed to load profile" onRetry={() => refetch()} />;

  const status = p?.verificationStatus || 'NONE';
  const isFirst100 = p?.isFirst100;

  const statusConfig: Record<string, { label: string; color: string; icon: any; message: string }> = {
    NONE: {
      label: 'Not Verified', color: 'bg-accent text-muted-foreground', icon: XCircle,
      message: 'Get verified to build trust and lower your commission!',
    },
    PENDING: {
      label: 'Pending Review', color: 'bg-warning/10 text-warning', icon: Clock,
      message: 'Your verification is under review. We\'ll notify you within 48 hours.',
    },
    APPROVED: {
      label: 'Verified', color: 'bg-primary/10 text-primary', icon: CheckCircle,
      message: 'You\'re verified! Enjoy 12% commission and higher visibility.',
    },
    REJECTED: {
      label: 'Rejected', color: 'bg-destructive/10 text-destructive', icon: XCircle,
      message: p?.verificationRejectionReason || 'Your verification was not approved.',
    },
    PAID: {
      label: 'Fee Paid', color: 'bg-primary/10 text-primary', icon: Clock,
      message: 'Your payment has been received. Submit your documents below.',
    },
  };
  const cfg = statusConfig[status] || statusConfig.NONE;
  const Icon = cfg.icon;

  const canSubmit = status === 'NONE' || status === 'PAID' || status === 'REJECTED';
  const submitting = status === 'PENDING' || status === 'APPROVED';

  return (
    <div className="space-y-6 max-w-2xl">
      <OfflineBanner />
      <BackButton href="/trainer" label="Back to Dashboard" />
      <h1 className="text-2xl font-bold text-dark">Verification</h1>

      <div className={`rounded-card p-5 ${status === 'APPROVED' ? 'bg-primary/5 border border-primary/20' : status === 'REJECTED' ? 'bg-destructive/5 border border-destructive/20' : 'bg-white shadow-card'}`}>
        <div className="flex items-center gap-3 mb-3">
          <Icon size={24} className={status === 'APPROVED' ? 'text-primary' : status === 'REJECTED' ? 'text-destructive' : 'text-muted-foreground'} />
          <div>
            <div className="flex items-center gap-2">
              <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${cfg.color}`}>{cfg.label}</span>
            </div>
            <p className="text-sm text-body mt-1">{cfg.message}</p>
          </div>
        </div>

        {status === 'APPROVED' && (
          <div className="mt-4 grid grid-cols-2 gap-3">
            {[ 'Verified badge on your profile', 'Reduced commission: 12%', 'Higher ranking in search', 'Priority support' ].map((benefit, i) => (
              <div key={i} className="flex items-center gap-2 text-sm text-body bg-white/50 rounded-card p-3">
                <CheckCircle size={16} className="text-primary flex-shrink-0" />
                {benefit}
              </div>
            ))}
          </div>
        )}

        {status === 'REJECTED' && (
          <p className="text-sm text-muted-foreground mt-2">You can reapply by submitting the documents below.</p>
        )}
      </div>

      {canSubmit && (
        <div className="bg-white rounded-card shadow-card p-6 space-y-6">
          <h2 className="font-semibold text-dark">Submit Verification Documents</h2>

          {status === 'NONE' && (
            <div className="bg-accent rounded-card p-4 text-sm space-y-2">
              <p className="font-medium text-dark">Verification Benefits</p>
              {[ 'Verified badge on your profile', `Reduced commission: ${isFirst100 ? '0%' : '12%'} (instead of 20%)`, 'Higher ranking in search results', 'More trust from trainees', 'Priority support' ].map((b, i) => (
                <div key={i} className="flex items-center gap-2 text-body">
                  <CheckCircle size={14} className="text-primary" />
                  {b}
                </div>
              ))}
            </div>
          )}

          {status !== 'PAID' && (
            <div>
              <label className="text-sm font-medium text-dark mb-2 block flex items-center gap-2">
                <Upload size={16} /> Upload ID Document
              </label>
              <p className="text-xs text-muted-foreground mb-2">Accepted: JPEG, PNG, PDF. Max 5MB.</p>
              <FileUpload accept="image/*,application/pdf" onUpload={setIdDocUrl} label="Upload ID" />
              {idDocUrl && <p className="text-xs text-green-600 mt-1">ID uploaded ✓</p>}
            </div>
          )}

          {status !== 'PAID' && (
            <div>
              <label className="text-sm font-medium text-dark mb-2 block flex items-center gap-2">
                <Video size={16} /> Introduction Video
              </label>
              <p className="text-xs text-muted-foreground mb-2">1-minute video showing your face and demonstrating your skill. MP4, WebM. Max 50MB.</p>
              <FileUpload accept="video/*" onUpload={setVideoUrl} label="Upload Video" />
              {videoUrl && <p className="text-xs text-green-600 mt-1">Video uploaded ✓</p>}
            </div>
          )}

          {status === 'NONE' && !isFirst100 && (
            <div className="bg-primary/5 border border-primary/20 rounded-card p-4">
              <p className="text-sm text-body mb-3">One-time verification fee: <strong className="text-dark">KES 5,000</strong></p>
              <button
                onClick={() => setShowPayment(true)}
                className="w-full py-2.5 bg-primary text-white font-medium rounded-btn hover:bg-primary/90 transition-colors"
              >
                Pay KES 5,000 via M-Pesa
              </button>
            </div>
          )}

          {status === 'PAID' && (
            <button
              onClick={() => submitMutation.mutate()}
              disabled={submitMutation.isPending}
              className="w-full py-2.5 bg-primary text-white font-medium rounded-btn hover:bg-primary/90 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
            >
              {submitMutation.isPending ? <><Loader2 size={16} className="animate-spin" /> Submitting...</> : 'Submit for Review'}
            </button>
          )}

          {status === 'REJECTED' && (
            <button
              onClick={() => submitMutation.mutate()}
              disabled={submitMutation.isPending}
              className="w-full py-2.5 bg-primary text-white font-medium rounded-btn hover:bg-primary/90 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
            >
              {submitMutation.isPending ? <><Loader2 size={16} className="animate-spin" /> Submitting...</> : 'Reapply'}
            </button>
          )}
        </div>
      )}

      {submitting && (
        <div className="bg-white rounded-card shadow-card p-6 text-center">
          <Clock size={40} className="mx-auto text-warning mb-3" />
          <h3 className="font-semibold text-dark mb-1">Verification {status === 'APPROVED' ? 'Approved' : 'Under Review'}</h3>
          <p className="text-sm text-muted-foreground">
            {status === 'APPROVED' ? 'You\'re all set! Enjoy the benefits.' : 'We\'ll notify you once the review is complete.'}
          </p>
        </div>
      )}

      {showPayment && (
        <MpesaPaymentModal
          open={showPayment}
          onClose={() => setShowPayment(false)}
          amount={5000}
          description="Trainer Verification Fee"
        />
      )}
    </div>
  );
}
