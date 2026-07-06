'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { CheckCircle, XCircle, Search, ShieldCheck, Loader2, Eye, X, FileText, Video, ExternalLink } from 'lucide-react';
import { BackButton } from '@frontend/components/shared/back-button';
import { api } from '@backend/lib/api';
import { EmptyState } from '@frontend/components/shared/empty-state';
import { ErrorState } from '@frontend/components/shared/error-state';
import { CardSkeleton } from '@frontend/components/shared/loading-skeleton';
import { ConfirmationDialog } from '@frontend/components/shared/confirmation-dialog';
import { OfflineBanner } from '@frontend/components/shared/offline-banner';
import { formatDateTime } from '@backend/lib/utils';
import { toast } from 'sonner';

const TABS = ['PENDING', 'APPROVED', 'REJECTED', 'ALL'] as const;

export default function AdminVerificationsPage() {
  const queryClient = useQueryClient();
  const [tab, setTab] = useState<string>('PENDING');
  const [search, setSearch] = useState('');
  const [rejectTarget, setRejectTarget] = useState<any>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [approveTarget, setApproveTarget] = useState<any>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewType, setPreviewType] = useState<'image' | 'video' | null>(null);

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['admin', 'verifications', tab],
    queryFn: () => api.get<any>('/admin/verifications', { status: tab !== 'ALL' ? tab : undefined }),
  });

  const approveMutation = useMutation({
    mutationFn: (id: string) => api.post(`/admin/verifications/${id}/approve`, {}),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'verifications'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'stats'] });
      toast.success('Trainer verified successfully');
      setApproveTarget(null);
    },
    onError: (err: any) => toast.error(err.message),
  });

  const rejectMutation = useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) =>
      api.post(`/admin/verifications/${id}/reject`, { reason }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'verifications'] });
      toast.success('Verification rejected');
      setRejectTarget(null);
      setRejectReason('');
    },
    onError: (err: any) => toast.error(err.message),
  });

  const items: any[] = data?.data || [];
  const filtered = items.filter((v: any) =>
    !search || v.trainer?.fullName?.toLowerCase().includes(search.toLowerCase()) ||
    v.trainer?.email?.toLowerCase().includes(search.toLowerCase())
  );

  const pendingCount = items.filter((v: any) => v.status === 'PENDING' || v.status === 'PAID').length;

  return (
    <div className="space-y-6">
      <OfflineBanner />
      <BackButton href="/admin" label="Back to Admin" />
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-dark">Verifications</h1>
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search trainers..."
            className="pl-9 pr-3 py-1.5 border border-border rounded-btn text-sm w-60 focus:outline-none focus:ring-2 focus:ring-primary/20" />
        </div>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-2">
        {TABS.map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-4 py-1.5 text-sm font-medium rounded-btn whitespace-nowrap transition-colors relative ${
              tab === t ? 'bg-primary text-white' : 'bg-white text-body border border-border hover:bg-accent'
            }`}>
            {t === 'ALL' ? 'All' : t.charAt(0) + t.slice(1).toLowerCase()}
            {t === 'PENDING' && pendingCount > 0 && (
              <span className="ml-1.5 w-4 h-4 bg-destructive text-white text-[10px] font-bold rounded-full inline-flex items-center justify-center">
                {pendingCount > 9 ? '9+' : pendingCount}
              </span>
            )}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="space-y-3">{[1,2,3].map(i => <CardSkeleton key={i} />)}</div>
      ) : isError ? (
        <ErrorState message="Failed to load verifications" onRetry={() => refetch()} />
      ) : filtered.length === 0 ? (
        <EmptyState icon={ShieldCheck} title={tab === 'PENDING' ? 'No pending verifications' : 'No verifications found'} subtitle="All verification requests will appear here" />
      ) : (
        <div className="space-y-3">
          {filtered.map((v: any) => (
            <div key={v.id} className="bg-white rounded-card shadow-card p-4">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm">
                  {v.trainer?.fullName?.[0] || '?'}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <div>
                      <p className="text-sm font-medium text-dark">{v.trainer?.fullName || 'Trainer'}</p>
                      <p className="text-xs text-muted-foreground">{v.trainer?.email} &middot; {v.createdAt ? formatDateTime(v.createdAt) : ''}</p>
                    </div>
                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium whitespace-nowrap ${
                      v.status === 'APPROVED' ? 'bg-primary/10 text-primary' :
                      v.status === 'REJECTED' ? 'bg-destructive/10 text-destructive' :
                      v.status === 'PAID' ? 'bg-warning/10 text-warning' :
                      'bg-accent text-body'
                    }`}>
                      {v.status === 'PAID' ? 'Fee Paid' : v.status?.charAt(0) + v.status?.slice(1).toLowerCase()}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 mt-2 flex-wrap">
                    {v.idDocumentUrl && (
                      <button onClick={() => { setPreviewUrl(v.idDocumentUrl); setPreviewType('image'); }}
                        className="flex items-center gap-1 px-2.5 py-1 bg-accent text-body text-xs rounded-btn hover:bg-accent/80 transition-colors">
                        <FileText size={12} /> View ID
                      </button>
                    )}
                    {v.introductionVideoUrl && (
                      <button onClick={() => { setPreviewUrl(v.introductionVideoUrl); setPreviewType('video'); }}
                        className="flex items-center gap-1 px-2.5 py-1 bg-accent text-body text-xs rounded-btn hover:bg-accent/80 transition-colors">
                        <Video size={12} /> Watch Video
                      </button>
                    )}
                    {v.feePaid && (
                      <span className="text-xs text-primary font-medium">Paid KES 5,000</span>
                    )}
                    {v.isFoundingTrainer && (
                      <span className="text-xs text-green-600 font-medium">Free (Founding Trainer)</span>
                    )}
                  </div>
                </div>
                {(v.status === 'PENDING' || v.status === 'PAID') && (
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <button onClick={() => setApproveTarget(v)}
                      className="p-2 bg-primary/10 text-primary rounded-btn hover:bg-primary/20 transition-colors" title="Approve">
                      <CheckCircle size={18} />
                    </button>
                    <button onClick={() => setRejectTarget(v)}
                      className="p-2 bg-destructive/10 text-destructive rounded-btn hover:bg-destructive/20 transition-colors" title="Reject">
                      <XCircle size={18} />
                    </button>
                  </div>
                )}
                {v.status === 'REJECTED' && v.rejectionReason && (
                  <p className="text-xs text-destructive mt-1 w-full">Reason: {v.rejectionReason}</p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <ConfirmationDialog
        isOpen={!!approveTarget}
        onClose={() => setApproveTarget(null)}
        onConfirm={() => approveTarget && approveMutation.mutate(approveTarget.id)}
        title="Approve Verification"
        message={`Verify ${approveTarget?.trainer?.fullName || 'this trainer'}? Their commission will be set to 12%.`}
        confirmLabel="Approve"
        confirmColor="primary"
        isPending={approveMutation.isPending}
      />

      {rejectTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={() => { setRejectTarget(null); setRejectReason(''); }}>
          <div className="bg-white rounded-card shadow-modal w-full max-w-md p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-destructive/10 rounded-full flex items-center justify-center">
                <XCircle size={20} className="text-destructive" />
              </div>
              <h3 className="text-lg font-semibold text-dark">Reject Verification</h3>
              <button onClick={() => { setRejectTarget(null); setRejectReason(''); }} className="ml-auto p-1 text-muted-foreground hover:text-dark">
                <X size={20} />
              </button>
            </div>
            <p className="text-xs text-muted-foreground mb-2">This reason will be shared with the trainer.</p>
            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="Reason for rejection (min 20 characters)..."
              rows={4}
              className="w-full px-3 py-2 border border-border rounded-btn text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 resize-none"
            />
            <p className="text-xs text-muted-foreground mt-1">{rejectReason.length}/20 characters minimum</p>
            <div className="flex gap-3 mt-4">
              <button
                onClick={() => rejectMutation.mutate({ id: rejectTarget.id, reason: rejectReason })}
                disabled={rejectReason.length < 20 || rejectMutation.isPending}
                className="flex-1 py-2.5 bg-destructive text-white font-medium rounded-btn hover:bg-destructive/90 disabled:opacity-50 transition-colors"
              >
                {rejectMutation.isPending ? 'Rejecting...' : 'Reject'}
              </button>
              <button onClick={() => { setRejectTarget(null); setRejectReason(''); }} className="flex-1 py-2.5 border border-border text-body rounded-btn hover:bg-accent transition-colors">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {previewUrl && previewType === 'image' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80" onClick={() => { setPreviewUrl(null); setPreviewType(null); }}>
          <div className="relative max-w-3xl max-h-[85vh]" onClick={(e) => e.stopPropagation()}>
            <button onClick={() => { setPreviewUrl(null); setPreviewType(null); }} className="absolute -top-10 right-0 text-white/80 hover:text-white">
              <X size={24} />
            </button>
            <img src={previewUrl} alt="ID Document" className="max-w-full max-h-[85vh] rounded-card object-contain" />
            <a href={previewUrl} target="_blank" rel="noopener noreferrer" className="absolute -bottom-8 left-0 flex items-center gap-1 text-sm text-white/80 hover:text-white">
              <ExternalLink size={14} /> Open in new tab
            </a>
          </div>
        </div>
      )}

      {previewUrl && previewType === 'video' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80" onClick={() => { setPreviewUrl(null); setPreviewType(null); }}>
          <div className="relative max-w-2xl w-full" onClick={(e) => e.stopPropagation()}>
            <button onClick={() => { setPreviewUrl(null); setPreviewType(null); }} className="absolute -top-10 right-0 text-white/80 hover:text-white">
              <X size={24} />
            </button>
            <video src={previewUrl} controls className="w-full rounded-card" autoPlay>
              Your browser does not support the video tag.
            </video>
          </div>
        </div>
      )}
    </div>
  );
}
