'use client';

import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { useState } from 'react';
import { ShieldCheck, Loader2, CheckCircle, XCircle, Clock } from 'lucide-react';
import { BackButton } from '@frontend/components/shared/back-button';
import { api } from '@backend/lib/api';
import { formatCurrency } from '@backend/lib/utils';
import { MpesaPaymentModal } from '@frontend/components/payment/mpesa-payment-modal';

export default function VerificationPage() {
  const [showPayment, setShowPayment] = useState(false);

  const { data: profile, isLoading } = useQuery({
    queryKey: ['trainer-profile'],
    queryFn: () => api.get<any>('/trainers/me'),
  });

  const p = profile?.data;

  const statusBadge = () => {
    if (!p?.verificationStatus || p.verificationStatus === 'NONE') {
      return { label: 'Not Verified', color: 'bg-accent text-muted-foreground', icon: XCircle };
    }
    const map: Record<string, { label: string; color: string; icon: any }> = {
      PENDING: { label: 'Pending Review', color: 'bg-warning/10 text-warning', icon: Clock },
      APPROVED: { label: 'Verified', color: 'bg-primary/10 text-primary', icon: CheckCircle },
      REJECTED: { label: 'Rejected', color: 'bg-destructive/10 text-destructive', icon: XCircle },
      PAID: { label: 'Fee Paid (Pending Review)', color: 'bg-primary/10 text-primary', icon: Clock },
    };
    return map[p.verificationStatus] || map.PENDING;
  };

  const badge = p ? statusBadge() : { label: 'Loading...', color: '', icon: Loader2 };

  return (
    <div className="space-y-6 max-w-2xl">
      <BackButton href="/dashboard/trainer" label="Back to Dashboard" />
      <h1 className="text-2xl font-bold text-dark">Verification</h1>

      <div className="bg-white rounded-card shadow-card p-6">
        <div className="flex items-center gap-4 mb-6">
          <ShieldCheck size={40} className="text-primary" />
          <div>
            <h2 className="font-semibold text-dark">Trainer Verification</h2>
            <p className="text-sm text-muted-foreground">Get verified to build trust with students</p>
          </div>
        </div>

        <div className="flex items-center gap-2 mb-4">
          <badge.icon size={16} />
          <span className={`px-3 py-1 rounded-full text-xs font-medium ${badge.color}`}>{badge.label}</span>
        </div>

        {p?.verificationStatus === 'NONE' && (
          <div className="space-y-4">
            <p className="text-sm text-body">
              Verified trainers earn student trust and get a 
              <span className="font-semibold"> {p?.isFirst100 ? '0%' : '12%'} commission rate</span>.
              A non-refundable verification fee of KES 5,000 is required.
            </p>
            <ul className="space-y-2 text-sm text-body">
              <li className="flex items-center gap-2"><CheckCircle size={14} className="text-primary" /> Verified badge on your profile</li>
              <li className="flex items-center gap-2"><CheckCircle size={14} className="text-primary" /> Higher search ranking</li>
              <li className="flex items-center gap-2"><CheckCircle size={14} className="text-primary" /> Reduced commission rate ({p?.isFirst100 ? '0%' : '12%'})</li>
            </ul>
            <button
              onClick={() => setShowPayment(true)}
              className="w-full py-2.5 bg-primary text-white font-medium rounded-btn hover:bg-primary/90 transition-colors"
            >
              Pay KES 5,000 Verification Fee
            </button>
          </div>
        )}

        {p?.verificationStatus === 'PAID' && (
          <p className="text-sm text-muted-foreground">Your payment has been received. We&apos;ll review your application within 48 hours.</p>
        )}

        {p?.verificationStatus === 'APPROVED' && (
          <div className="bg-green-50 border border-green-200 rounded-card p-4">
            <p className="text-sm text-primary font-medium">You are a verified trainer!</p>
          </div>
        )}

        {p?.verificationStatus === 'REJECTED' && (
          <div className="bg-red-50 border border-red-200 rounded-card p-4">
            <p className="text-sm text-red-800">{p?.verificationRejectionReason || 'Verification was rejected. Contact support for details.'}</p>
            <button onClick={() => setShowPayment(true)} className="mt-2 text-sm text-primary hover:underline">Re-apply</button>
          </div>
        )}
      </div>

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
