import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ShieldCheck, Loader2, CheckCircle, XCircle, Clock } from 'lucide-react';
import { toast } from 'sonner';
import { useAuthStore } from '@/stores/auth-store';
import { supabase } from '@/lib/supabase';
import { getMyTrainerProfile, updateTrainerProfile } from '@/services/trainerService';
import { FileUpload } from '@/components/shared/file-upload';
import { CardSkeleton } from '@/components/shared/loading-skeleton';
import { formatDate } from '@/lib/utils';

export default function Verification() {
  const { user } = useAuthStore();
  const queryClient = useQueryClient();

  const { data: profile, isLoading } = useQuery({
    queryKey: ['trainer', 'profile', user?.id],
    queryFn: () => getMyTrainerProfile(user!.id),
    enabled: !!user?.id,
  });

  const [govIdUrl, setGovIdUrl] = useState<string | null>(null);

  const submitMutation = useMutation({
    mutationFn: () =>
      updateTrainerProfile(profile!.id, {
        verificationStatus: 'PENDING',
        govIdUrl: govIdUrl || profile?.govIdUrl,
      }),
    onSuccess: () => {
      toast.success('Verification application submitted');
      queryClient.invalidateQueries({ queryKey: ['trainer', 'profile', user?.id] });
    },
    onError: (err: any) => {
      toast.error(err.message || 'Failed to submit verification');
    },
  });

  const uploadId = async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    const { data, error } = await supabase.storage
      .from('verifications')
      .upload(`gov-ids/${user!.id}/${file.name}`, file);
    if (error) throw error;
    const { data: urlData } = supabase.storage.from('verifications').getPublicUrl(data.path);
    setGovIdUrl(urlData.publicUrl);
    toast.success('Document uploaded');
  };

  if (isLoading) {
    return (
      <div className="max-w-2xl mx-auto">
        <CardSkeleton />
      </div>
    );
  }

  const status = profile?.verificationStatus || 'NONE';
  const isVerified = profile?.isVerified;

  const statusConfig: Record<string, { icon: any; color: string; title: string; desc: string }> = {
    NONE: {
      icon: ShieldCheck,
      color: 'text-muted-foreground',
      title: 'Not Verified',
      desc: 'Verify your identity to build trust with students and unlock higher earnings.',
    },
    PENDING: {
      icon: Clock,
      color: 'text-yellow-600',
      title: 'Verification Pending',
      desc: 'Your documents are being reviewed. This usually takes 1-2 business days.',
    },
    APPROVED: {
      icon: CheckCircle,
      color: 'text-green-600',
      title: 'Verified',
      desc: 'You are verified! Students can see your verified badge.',
    },
    REJECTED: {
      icon: XCircle,
      color: 'text-red-600',
      title: 'Verification Rejected',
      desc: 'Your documents did not meet our requirements. Please re-submit.',
    },
  };

  const config = statusConfig[status] ?? {
    icon: ShieldCheck,
    color: 'text-muted-foreground',
    title: 'Not Verified',
    desc: 'Verify your identity to build trust with students and unlock higher earnings.',
  };
  const StatusIcon = config.icon;

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold text-dark mb-6">Trainer Verification</h1>

      <div className="bg-white rounded-card shadow-card p-6 mb-6">
        <div className="flex items-center gap-4 mb-4">
          <StatusIcon size={40} className={config.color} />
          <div>
            <h2 className="text-lg font-bold text-dark">{config.title}</h2>
            <p className="text-sm text-body">{config.desc}</p>
          </div>
        </div>

        {isVerified && (
          <div className="flex items-center gap-2 px-4 py-3 bg-green-50 border border-green-200 rounded-card">
            <CheckCircle size={16} className="text-green-600" />
            <span className="text-sm text-green-700 font-medium">Your account is verified</span>
          </div>
        )}

        {status === 'REJECTED' && (
          <div className="px-4 py-3 bg-red-50 border border-red-200 rounded-card mb-4">
            <p className="text-sm text-red-700">
              {profile?.verificationNote || 'Your application was rejected. Please re-submit with correct documents.'}
            </p>
          </div>
        )}

        {(status === 'NONE' || status === 'REJECTED') && !isVerified && (
          <div className="space-y-4 mt-4">
            <div>
              <label className="text-sm font-medium text-dark mb-1 block">Upload Government ID</label>
              <FileUpload
                accept="image/*,.pdf"
                onUpload={uploadId}
                label="Upload ID (KRA PIN, National ID, or Passport)"
              />
            </div>

            <button
              onClick={() => submitMutation.mutate()}
              disabled={submitMutation.isPending}
              className="w-full py-2.5 bg-primary text-white font-medium rounded-btn hover:bg-primary/90 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {submitMutation.isPending && <Loader2 size={16} className="animate-spin" />}
              {submitMutation.isPending ? 'Submitting...' : 'Submit for Verification'}
            </button>
          </div>
        )}

        {status === 'PENDING' && (
          <div className="flex items-center gap-2 px-4 py-3 bg-yellow-50 border border-yellow-200 rounded-card">
            <Clock size={16} className="text-yellow-600" />
            <span className="text-sm text-yellow-700">
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
    </div>
  );
}
