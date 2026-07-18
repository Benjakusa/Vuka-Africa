import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ShieldCheck, Loader2, CheckCircle, XCircle, Clock, Wallet, ArrowRight } from 'lucide-react';
import { toast } from 'sonner';
import { useAuthStore } from '@/stores/auth-store';
import { supabase } from '@/lib/supabase';
import { getMyTrainerProfile, updateTrainerProfile } from '@/services/trainerService';
import { trainerKeys } from '@/lib/query-keys';
import { FileUpload } from '@/components/shared/file-upload';
import { CardSkeleton } from '@/components/shared/loading-skeleton';
import { formatDate, formatCurrency } from '@/lib/utils';
import { MpesaPaymentModal } from '@/components/payment/mpesa-payment-modal';

type Step = 'details' | 'payment' | 'submit';

const steps: { key: Step; label: string }[] = [
  { key: 'details', label: 'Details' },
  { key: 'payment', label: 'Payment' },
  { key: 'submit', label: 'Submit' },
];

export default function Verification() {
  const { user } = useAuthStore();
  const queryClient = useQueryClient();

  const { data: profile, isLoading } = useQuery({
    queryKey: trainerKeys.profile(user?.id),
    queryFn: () => getMyTrainerProfile(user!.id),
    enabled: !!user?.id,
    initialData: user?.trainer,
    staleTime: 60_000,
  });

  const [idDocumentUrl, setIdDocumentUrl] = useState<string | null>(null);
  const [kraPinUrl, setKraPinUrl] = useState<string | null>(null);
  const [passportPhotoUrl, setPassportPhotoUrl] = useState<string | null>(null);
  const [location, setLocation] = useState('');
  const [alternativeContact, setAlternativeContact] = useState('');
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);

  const rawStatus = profile?.verificationStatus || 'NONE';
  const status = (rawStatus === 'UNSUBMITTED' ? 'NONE' : rawStatus) as 'NONE' | 'PENDING' | 'APPROVED' | 'REJECTED';
  const isVerified = profile?.isVerified;
  const feePaid = profile?.verificationFeePaid;
  const feeAmount = profile?.verificationFeeAmount || 2000;

  const [currentStep, setCurrentStep] = useState<Step>(feePaid ? 'submit' : 'details');

  const saveMutation = useMutation({
    mutationFn: () => {
      const finalId = idDocumentUrl || profile?.idDocumentUrl;
      const finalKra = kraPinUrl || profile?.kraPinUrl;
      const finalPassport = passportPhotoUrl || profile?.passportPhotoUrl;

      if (!finalId || !finalKra || !finalPassport) {
        throw new Error('Please upload all three required documents');
      }

      if (!location && !profile?.location) {
        throw new Error('Please enter your location');
      }

      if (!alternativeContact && !profile?.alternativeContact) {
        throw new Error('Please enter an alternative contact number');
      }

      return updateTrainerProfile(profile!.id, {
        idDocumentUrl: finalId,
        kraPinUrl: finalKra,
        passportPhotoUrl: finalPassport,
        location: location || profile?.location,
        alternativeContact: alternativeContact || profile?.alternativeContact,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: trainerKeys.profile(user?.id) });
      setCurrentStep('payment');
    },
    onError: (err: any) => {
      toast.error(err.message || 'Failed to save details');
    },
  });

  const submitMutation = useMutation({
    mutationFn: () => updateTrainerProfile(profile!.id, { verificationStatus: 'PENDING' }),
    onSuccess: () => {
      toast.success('Verification application submitted');
      queryClient.invalidateQueries({ queryKey: trainerKeys.profile(user?.id) });
    },
    onError: (err: any) => {
      toast.error(err.message || 'Failed to submit verification');
    },
  });

  const uploadFile = async (file: File, type: string, setter: (url: string) => void) => {
    const { data, error } = await supabase.storage
      .from('verifications')
      .upload(`${type}/${user!.id}/${Date.now()}_${file.name}`, file);
    if (error) throw error;
    const { data: urlData } = supabase.storage.from('verifications').getPublicUrl(data.path);
    setter(urlData.publicUrl);
    toast.success('Document uploaded');
  };

  if (isLoading) {
    return (
      <div className="max-w-2xl mx-auto">
        <CardSkeleton />
      </div>
    );
  }

  const statusConfig: Record<string, { icon: any; color: string; title: string; desc: string }> = {
    NONE: {
      icon: ShieldCheck,
      color: 'text-body-foreground',
      title: 'Not Verified',
      desc: 'Verify your identity to build trust with students and unlock higher earnings.',
    },
    PENDING: {
      icon: Clock,
      color: 'text-body',
      title: 'Verification Pending',
      desc: 'Your documents are being reviewed. This usually takes 1-2 business days.',
    },
    APPROVED: {
      icon: CheckCircle,
      color: 'text-foreground',
      title: 'Verified',
      desc: 'You are verified! Students can see your verified badge.',
    },
    REJECTED: {
      icon: XCircle,
      color: 'text-primary',
      title: 'Verification Rejected',
      desc: 'Your documents did not meet our requirements. Please re-submit.',
    },
  };

  const config = (statusConfig[status] ?? statusConfig['NONE'])!;
  const StatusIcon = config.icon;

  const stepIndex = steps.findIndex((s) => s.key === currentStep);
  const hasId = !!(idDocumentUrl || profile?.idDocumentUrl);
  const hasKra = !!(kraPinUrl || profile?.kraPinUrl);
  const hasPassport = !!(passportPhotoUrl || profile?.passportPhotoUrl);

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold text-dark mb-6">Trainer Verification</h1>

      <div className="bg-white rounded-card shadow-card p-6 mb-6">
        <div className="flex items-center gap-4 mb-6">
          <StatusIcon size={40} className={config.color} />
          <div>
            <h2 className="text-lg font-bold text-dark">{config.title}</h2>
            <p className="text-sm text-body">{config.desc}</p>
          </div>
        </div>

        {isVerified && (
          <div className="flex items-center gap-2 px-4 py-3 bg-surface border border-border rounded-card mb-4">
            <CheckCircle size={16} className="text-foreground" />
            <span className="text-sm text-foreground font-medium">Your account is verified</span>
          </div>
        )}

        {status === 'REJECTED' && (
          <div className="px-4 py-3 bg-primary border border-primary rounded-card mb-4">
            <p className="text-sm text-primary">
              {profile?.verificationNote || 'Your application was rejected. Please re-submit with correct documents.'}
            </p>
          </div>
        )}

        {(status === 'NONE' || status === 'REJECTED') && !isVerified && (
          <>
            <div className="flex items-center gap-0 mb-6">
              {steps.map((s, i) => {
                const isActive = i === stepIndex;
                const isDone = i < stepIndex;
                return (
                  <div key={s.key} className="flex items-center flex-1">
                    <div className="flex items-center gap-2">
                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${
                          isDone
                            ? 'bg-foreground text-white'
                            : isActive
                              ? 'bg-dark text-white'
                              : 'bg-surface text-body-foreground'
                        }`}
                      >
                        {isDone ? <CheckCircle size={16} /> : i + 1}
                      </div>
                      <span
                        className={`text-sm font-medium ${isActive ? 'text-dark' : isDone ? 'text-foreground' : 'text-body-foreground'}`}
                      >
                        {s.label}
                      </span>
                    </div>
                    {i < steps.length - 1 && (
                      <div className={`flex-1 h-px mx-3 ${i < stepIndex ? 'bg-foreground' : 'bg-border'}`} />
                    )}
                  </div>
                );
              })}
            </div>

            {currentStep === 'details' && (
              <div className="space-y-6">
                <div>
                  <label className="text-sm font-medium text-dark mb-1 block">Your Location</label>
                  <input
                    type="text"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="e.g. Nairobi, Kenya"
                    className="w-full px-3 py-2.5 border border-border rounded-btn text-sm"
                  />
                  {profile?.location && !location && (
                    <p className="text-xs text-body-foreground mt-1">Current: {profile.location}</p>
                  )}
                </div>

                <div>
                  <label className="text-sm font-medium text-dark mb-1 block">
                    Alternative Contact (Relative / Partner / Business Partner)
                  </label>
                  <input
                    type="tel"
                    value={alternativeContact}
                    onChange={(e) => setAlternativeContact(e.target.value)}
                    placeholder="e.g. +254 712 345 678"
                    className="w-full px-3 py-2.5 border border-border rounded-btn text-sm"
                  />
                  {profile?.alternativeContact && !alternativeContact && (
                    <p className="text-xs text-body-foreground mt-1">Current: {profile.alternativeContact}</p>
                  )}
                </div>

                <div>
                  <label className="text-sm font-medium text-dark mb-1 block">1. Upload National ID or Passport</label>
                  <FileUpload
                    accept="image/*,.pdf"
                    onUpload={(file) => uploadFile(file, 'ids', setIdDocumentUrl)}
                    label="Front and Back of ID, or Passport page"
                  />
                  {(idDocumentUrl || profile?.idDocumentUrl) && (
                    <p className="text-xs text-foreground mt-1 flex items-center gap-1">
                      <CheckCircle size={12} /> Uploaded
                    </p>
                  )}
                </div>

                <div>
                  <label className="text-sm font-medium text-dark mb-1 block">2. Upload KRA PIN Certificate</label>
                  <FileUpload
                    accept="image/*,.pdf"
                    onUpload={(file) => uploadFile(file, 'kra', setKraPinUrl)}
                    label="Official KRA PIN document"
                  />
                  {(kraPinUrl || profile?.kraPinUrl) && (
                    <p className="text-xs text-foreground mt-1 flex items-center gap-1">
                      <CheckCircle size={12} /> Uploaded
                    </p>
                  )}
                </div>

                <div>
                  <label className="text-sm font-medium text-dark mb-1 block">3. Upload Passport Photo</label>
                  <FileUpload
                    accept="image/*"
                    onUpload={(file) => uploadFile(file, 'photos', setPassportPhotoUrl)}
                    label="Clear, recent passport-sized photo"
                  />
                  {(passportPhotoUrl || profile?.passportPhotoUrl) && (
                    <p className="text-xs text-foreground mt-1 flex items-center gap-1">
                      <CheckCircle size={12} /> Uploaded
                    </p>
                  )}
                </div>

                <button
                  onClick={() => saveMutation.mutate()}
                  disabled={saveMutation.isPending}
                  className="w-full py-2.5 bg-dark text-white font-medium rounded-btn hover:bg-surface disabled:opacity-50 flex items-center justify-center gap-2 transition-colors"
                >
                  {saveMutation.isPending && <Loader2 size={16} className="animate-spin" />}
                  {saveMutation.isPending ? 'Saving...' : 'Next — Payment'}
                  <ArrowRight size={16} />
                </button>
              </div>
            )}

            {currentStep === 'payment' && (
              <div className="space-y-6">
                <div className="border border-border rounded-card p-6 bg-surface">
                  <div className="flex items-center gap-3 mb-4">
                    <Wallet size={24} className="text-primary" />
                    <div>
                      <h3 className="font-semibold text-dark">Verification Fee</h3>
                      <p className="text-sm text-body">A one-time fee of {formatCurrency(feeAmount)} is required.</p>
                    </div>
                  </div>
                  {!feePaid && (
                    <button
                      onClick={() => setPaymentModalOpen(true)}
                      className="w-full py-2.5 bg-dark text-white font-medium rounded-btn hover:bg-surface flex items-center justify-center gap-2 transition-colors"
                    >
                      Pay {formatCurrency(feeAmount)} via M-Pesa
                    </button>
                  )}
                </div>

                {feePaid && (
                  <>
                    <div className="flex items-center gap-2 text-sm text-foreground font-medium bg-surface px-3 py-2 rounded">
                      <CheckCircle size={16} /> Verification fee paid successfully
                    </div>
                    <button
                      onClick={() => setCurrentStep('submit')}
                      className="w-full py-2.5 bg-dark text-white font-medium rounded-btn hover:bg-surface flex items-center justify-center gap-2 transition-colors"
                    >
                      Next — Submit <ArrowRight size={16} />
                    </button>
                  </>
                )}
              </div>
            )}

            {currentStep === 'submit' && (
              <div className="space-y-6">
                <div className="bg-surface rounded-card p-4 space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-body-foreground">Location</span>
                    <span className="text-dark font-medium">{location || profile?.location}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-body-foreground">Alternative Contact</span>
                    <span className="text-dark font-medium">{alternativeContact || profile?.alternativeContact}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-body-foreground">ID Document</span>
                    <span className="text-foreground font-medium flex items-center gap-1">
                      <CheckCircle size={12} /> {hasId ? 'Uploaded' : 'Missing'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-body-foreground">KRA PIN</span>
                    <span className="text-foreground font-medium flex items-center gap-1">
                      <CheckCircle size={12} /> {hasKra ? 'Uploaded' : 'Missing'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-body-foreground">Passport Photo</span>
                    <span className="text-foreground font-medium flex items-center gap-1">
                      <CheckCircle size={12} /> {hasPassport ? 'Uploaded' : 'Missing'}
                    </span>
                  </div>
                </div>

                <button
                  onClick={() => submitMutation.mutate()}
                  disabled={submitMutation.isPending || !hasId || !hasKra || !hasPassport}
                  className="w-full py-2.5 bg-primary text-white font-medium rounded-btn hover:bg-surface disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {submitMutation.isPending && <Loader2 size={16} className="animate-spin" />}
                  {submitMutation.isPending ? 'Submitting...' : 'Submit for Verification'}
                </button>
              </div>
            )}
          </>
        )}

        {status === 'PENDING' && (
          <div className="flex items-center gap-2 px-4 py-3 bg-surface border border-border rounded-card mt-4">
            <Clock size={16} className="text-body" />
            <span className="text-sm text-body">
              Submitted {profile?.updatedAt ? formatDate(profile.updatedAt) : 'recently'}. We'll notify you once
              reviewed.
            </span>
          </div>
        )}

        {status === 'NONE' && !isVerified && (
          <div className="mt-6 p-4 bg-surface rounded-card">
            <h3 className="text-sm font-semibold text-dark mb-2">Benefits of Verification</h3>
            <ul className="text-sm text-body space-y-1">
              <li className="flex items-center gap-2">• Verified badge on your profile</li>
              <li className="flex items-center gap-2">• Higher visibility in search results</li>
              <li className="flex items-center gap-2">• Increased student trust and enrolments</li>
              <li className="flex items-center gap-2">• Access to higher payout limits</li>
            </ul>
          </div>
        )}
      </div>

      <MpesaPaymentModal
        open={paymentModalOpen}
        onClose={() => setPaymentModalOpen(false)}
        type="verification"
        trainerId={profile?.id}
        amount={feeAmount}
        phone={user?.phone || ''}
        onSuccess={() => {
          setPaymentModalOpen(false);
          queryClient.invalidateQueries({ queryKey: trainerKeys.profile(user?.id) });
        }}
      />
    </div>
  );
}
