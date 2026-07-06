'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { AlertTriangle, Search, Loader2, CheckCircle, XCircle, Scale, ChevronDown, ChevronUp, Clock, User, BookOpen, DollarSign, MessageCircle } from 'lucide-react';
import { BackButton } from '@frontend/components/shared/back-button';
import { api } from '@backend/lib/api';
import { StatusBadge } from '@frontend/components/shared/status-badge';
import { ConfirmationDialog } from '@frontend/components/shared/confirmation-dialog';
import { EmptyState } from '@frontend/components/shared/empty-state';
import { ErrorState } from '@frontend/components/shared/error-state';
import { CardSkeleton } from '@frontend/components/shared/loading-skeleton';
import { OfflineBanner } from '@frontend/components/shared/offline-banner';
import { formatCurrency, formatDateTime } from '@backend/lib/utils';
import { toast } from 'sonner';

const TABS = ['OPEN', 'UNDER_REVIEW', 'RESOLVED', 'ALL'] as const;

function DisputeDetailModal({ dispute, onClose, onResolve }: { dispute: any; onClose: () => void; onResolve: (id: string, resolution: string, notes: string) => void }) {
  const [resolution, setResolution] = useState('trainer');
  const [customTrainer, setCustomTrainer] = useState('');
  const [customTrainee, setCustomTrainee] = useState('');
  const [notes, setNotes] = useState('');
  const [confirm, setConfirm] = useState(false);

  if (!dispute) return null;

  const enr = dispute.enrolment || {};
  const milestone = dispute.milestone || {};

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={onClose}>
      <div className="bg-white rounded-card shadow-modal w-full max-w-3xl max-h-[85vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="p-6 space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-warning/10 rounded-full flex items-center justify-center">
                <AlertTriangle size={20} className="text-warning" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-dark">Dispute #{dispute.id?.slice(0, 8)}</h2>
                <p className="text-xs text-muted-foreground">Raised {dispute.createdAt ? formatDateTime(dispute.createdAt) : ''}</p>
              </div>
            </div>
            <StatusBadge status={dispute.status || 'OPEN'} />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="space-y-4">
              <section>
                <h3 className="text-sm font-semibold text-dark mb-2">Dispute Details</h3>
                <div className="bg-accent/50 rounded-card p-3 space-y-2 text-sm">
                  <div className="flex items-center gap-2">
                    <User size={14} className="text-muted-foreground" />
                    <span className="text-body">Raised by: <strong className="text-dark">{dispute.raisedBy?.fullName || 'Unknown'}</strong> ({dispute.raisedByRole || 'N/A'})</span>
                  </div>
                  {dispute.raisedBy?.email && (
                    <p className="text-xs text-muted-foreground ml-6">{dispute.raisedBy.email}</p>
                  )}
                  <div className="flex items-start gap-2">
                    <MessageCircle size={14} className="text-muted-foreground mt-0.5" />
                    <p className="text-body">{dispute.reason || 'No reason provided'}</p>
                  </div>
                  {milestone.label && (
                    <div className="flex items-center gap-2">
                      <DollarSign size={14} className="text-muted-foreground" />
                      <span className="text-body">{milestone.label} — {milestone.amountKes ? formatCurrency(milestone.amountKes) : ''}</span>
                    </div>
                  )}
                </div>
              </section>

              <section>
                <h3 className="text-sm font-semibold text-dark mb-2">Enrolment Summary</h3>
                <div className="bg-accent/50 rounded-card p-3 space-y-1.5 text-sm">
                  <p className="text-body"><strong className="text-dark">Course:</strong> {enr.course?.title || 'N/A'}</p>
                  <p className="text-body"><strong className="text-dark">Trainer:</strong> {enr.course?.trainer?.user?.fullName || enr.trainerName || 'N/A'}</p>
                  <p className="text-body"><strong className="text-dark">Trainee:</strong> {enr.trainee?.fullName || 'N/A'}</p>
                  <p className="text-body"><strong className="text-dark">Price:</strong> {formatCurrency(enr.pricePaidKes || enr.totalPaid || 0)}</p>
                  <p className="text-body"><strong className="text-dark">Progress:</strong> {(enr.milestones || []).filter((m: any) => m.status === 'RELEASED').length}/{(enr.milestones || []).length || 3} milestones</p>
                </div>
              </section>

              <section>
                <h3 className="text-sm font-semibold text-dark mb-2">Milestone Confirmation Timeline</h3>
                <div className="bg-accent/50 rounded-card p-3 space-y-2 text-sm">
                  {(enr.milestones || []).map((m: any) => (
                    <div key={m.id} className="flex items-center justify-between">
                      <span className="text-body">{m.label}</span>
                      <span className={`text-xs font-medium ${m.status === 'RELEASED' ? 'text-primary' : m.status === 'DISPUTED' ? 'text-destructive' : 'text-muted-foreground'}`}>
                        {m.status === 'RELEASED' ? 'Released' : m.status === 'DISPUTED' ? 'Disputed' : m.status === 'TRAINEE_CONFIRMED' ? 'Confirmed (cool-off)' : 'Pending'}
                      </span>
                    </div>
                  ))}
                </div>
              </section>
            </div>

            <div className="space-y-4">
              {dispute.status !== 'RESOLVED' && (
                <section className="bg-white border border-border rounded-card p-4">
                  <h3 className="text-sm font-semibold text-dark mb-3">Resolution</h3>
                  <div className="space-y-3">
                    {[
                      { value: 'trainer', label: 'Release funds to trainer', desc: 'Full milestone amount released to trainer' },
                      { value: 'trainee', label: 'Refund trainee', desc: 'Full milestone amount refunded to trainee' },
                      { value: 'split', label: 'Split 50/50', desc: 'Half to trainer, half refunded' },
                      { value: 'custom', label: 'Custom split', desc: 'Admin enters amounts for each party' },
                    ].map(o => (
                      <label key={o.value} className={`flex items-start gap-3 p-3 rounded-btn border cursor-pointer transition-colors ${resolution === o.value ? 'border-primary bg-primary/5' : 'border-border hover:bg-accent'}`}>
                        <input type="radio" name="resolution" value={o.value} checked={resolution === o.value} onChange={(e) => setResolution(e.target.value)} className="mt-0.5" />
                        <div>
                          <p className="text-sm font-medium text-dark">{o.label}</p>
                          <p className="text-xs text-muted-foreground">{o.desc}</p>
                        </div>
                      </label>
                    ))}
                    {resolution === 'custom' && (
                      <div className="grid grid-cols-2 gap-3 pl-7">
                        <div>
                          <label className="text-xs text-muted-foreground mb-1 block">Trainer (KES)</label>
                          <input type="number" value={customTrainer} onChange={(e) => setCustomTrainer(e.target.value)} className="w-full px-2 py-1.5 border border-border rounded-btn text-sm" />
                        </div>
                        <div>
                          <label className="text-xs text-muted-foreground mb-1 block">Trainee (KES)</label>
                          <input type="number" value={customTrainee} onChange={(e) => setCustomTrainee(e.target.value)} className="w-full px-2 py-1.5 border border-border rounded-btn text-sm" />
                        </div>
                      </div>
                    )}
                    <div>
                      <label className="text-sm font-medium text-dark mb-1 block">Admin Notes <span className="text-destructive">*</span></label>
                      <textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Internal notes about this resolution..."
                        rows={3} className="w-full px-3 py-2 border border-border rounded-btn text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 resize-none" />
                    </div>
                    <button onClick={() => setConfirm(true)} disabled={!notes.trim()}
                      className="w-full py-2.5 bg-primary text-white font-medium rounded-btn hover:bg-primary/90 disabled:opacity-50 transition-colors flex items-center justify-center gap-2">
                      <Scale size={16} /> Resolve Dispute
                    </button>
                  </div>
                </section>
              )}
              {dispute.status === 'RESOLVED' && (
                <section className="bg-accent/50 rounded-card p-4">
                  <div className="flex items-center gap-2">
                    <CheckCircle size={18} className="text-primary" />
                    <span className="text-sm font-medium text-dark">Dispute resolved</span>
                  </div>
                  {dispute.resolution && (
                    <p className="text-xs text-muted-foreground mt-1">
                      Resolution: {dispute.resolution === 'trainer' ? 'Funds released to trainer' :
                        dispute.resolution === 'trainee' ? 'Refunded to trainee' :
                        dispute.resolution === 'split' ? 'Split 50/50' : 'Custom split'}
                    </p>
                  )}
                </section>
              )}
            </div>
          </div>

          <div className="flex justify-end">
            <button onClick={onClose} className="px-4 py-2 border border-border text-body rounded-btn hover:bg-accent transition-colors">
              Close
            </button>
          </div>
        </div>
      </div>
      <ConfirmationDialog
        isOpen={confirm}
        onClose={() => setConfirm(false)}
        onConfirm={() => { onResolve(dispute.id, resolution, notes); setConfirm(false); }}
        title="Resolve Dispute"
        message="This action will immediately release or refund funds. Are you sure?"
        confirmLabel="Resolve"
        confirmColor="primary"
      />
    </div>
  );
}

export default function AdminDisputesPage() {
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState('OPEN');
  const [search, setSearch] = useState('');
  const [selectedDispute, setSelectedDispute] = useState<any>(null);

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['admin', 'disputes', filter],
    queryFn: () => api.get<any>('/admin/disputes', { status: filter !== 'ALL' ? filter : undefined }),
  });

  const resolveMutation = useMutation({
    mutationFn: ({ id, resolution, notes }: { id: string; resolution: string; notes: string }) =>
      api.post(`/admin/disputes/${id}/resolve`, { resolution, notes }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'disputes'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'stats'] });
      toast.success('Dispute resolved');
      setSelectedDispute(null);
    },
    onError: (err: any) => toast.error(err.message),
  });

  const items: any[] = data?.data || [];
  const filtered = items.filter((d: any) =>
    !search || d.enrolment?.trainee?.fullName?.toLowerCase().includes(search.toLowerCase()) ||
    d.enrolment?.course?.title?.toLowerCase().includes(search.toLowerCase()) ||
    d.id?.toLowerCase().includes(search.toLowerCase())
  );

  const openCount = items.filter((d: any) => d.status === 'OPEN' || d.status === 'UNDER_REVIEW').length;

  return (
    <div className="space-y-6">
      <OfflineBanner />
      <BackButton href="/admin" label="Back to Admin" />
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-dark">Disputes</h1>
        <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search dispute, name, or course..."
          className="px-3 py-1.5 border border-border rounded-btn text-sm w-64 focus:outline-none focus:ring-2 focus:ring-primary/20" />
      </div>

      <div className="flex gap-2">
        {TABS.map(f => (
          <button key={f} onClick={() => setFilter(f)}
            className={`px-4 py-1.5 text-sm font-medium rounded-btn transition-colors relative ${
              filter === f ? 'bg-primary text-white' : 'bg-white text-body border border-border hover:bg-accent'
            }`}>
            {f === 'ALL' ? 'All' : f.split('_').map(w => w.charAt(0) + w.slice(1).toLowerCase()).join(' ')}
            {(f === 'OPEN' || f === 'UNDER_REVIEW') && openCount > 0 && (
              <span className="ml-1.5 w-4 h-4 bg-destructive text-white text-[10px] font-bold rounded-full inline-flex items-center justify-center">{openCount > 9 ? '9+' : openCount}</span>
            )}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="space-y-3">{[1,2,3].map(i => <CardSkeleton key={i} />)}</div>
      ) : isError ? (
        <ErrorState message="Failed to load disputes" onRetry={() => refetch()} />
      ) : filtered.length === 0 ? (
        <EmptyState icon={AlertTriangle} title={filter === 'OPEN' ? 'No open disputes' : 'No disputes found'} subtitle="The platform is running smoothly!" />
      ) : (
        <div className="space-y-3">
          {filtered.map((d: any) => (
            <div key={d.id} className="bg-white rounded-card shadow-card p-4 hover:shadow-cardHover transition-shadow cursor-pointer" onClick={() => setSelectedDispute(d)}>
              <div className="flex items-start gap-4">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                  d.status === 'OPEN' || d.status === 'UNDER_REVIEW' ? 'bg-destructive/10 text-destructive' : 'bg-primary/10 text-primary'
                }`}>
                  <AlertTriangle size={20} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium text-dark truncate">
                      {d.enrolment?.trainee?.fullName || 'Trainee'} vs {d.enrolment?.course?.trainer?.user?.fullName || 'Trainer'}
                    </p>
                    <StatusBadge status={d.status || 'OPEN'} />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {d.enrolment?.course?.title} &middot; {d.createdAt ? formatDateTime(d.createdAt) : ''} &middot; #{d.id?.slice(0, 8)}
                  </p>
                  <p className="text-sm text-body mt-1 line-clamp-2">{d.reason}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <DisputeDetailModal
        dispute={selectedDispute}
        onClose={() => setSelectedDispute(null)}
        onResolve={(id, resolution, notes) => resolveMutation.mutate({ id, resolution, notes })}
      />
    </div>
  );
}
