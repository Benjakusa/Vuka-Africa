'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { AlertTriangle, Loader2, CheckCircle, XCircle, Search } from 'lucide-react';
import { BackButton } from '@frontend/components/shared/back-button';
import { api } from '@backend/lib/api';
import { EmptyState } from '@frontend/components/shared/empty-state';
import { CardSkeleton } from '@frontend/components/shared/loading-skeleton';
import { formatDateTime, formatCurrency } from '@backend/lib/utils';
import { toast } from 'sonner';
import { useState } from 'react';

export default function AdminDisputesPage() {
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState('ACTIVE');
  const [search, setSearch] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'disputes', filter],
    queryFn: () => api.get<any>('/admin/disputes', { status: filter !== 'ALL' ? filter : undefined }),
  });

  const resolveMutation = useMutation({
    mutationFn: ({ id, resolution }: { id: string; resolution: 'REFUND_TRAINEE' | 'RELEASE_TRAINER' }) =>
      api.post(`/admin/disputes/${id}/resolve`, { resolution }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'disputes'] });
      toast.success('Dispute resolved');
    },
    onError: (err: any) => toast.error(err.message),
  });

  const items: any[] = data?.data || [];
  const filtered = items.filter((d: any) =>
    d.enrolment?.trainee?.fullName?.toLowerCase().includes(search.toLowerCase()) ||
    d.enrolment?.course?.title?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <BackButton href="/dashboard/admin" label="Back to Admin" />
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-dark">Disputes</h1>
        <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search..."
          className="px-3 py-1.5 border border-border rounded-btn text-sm w-52 focus:outline-none focus:ring-2 focus:ring-primary/20" />
      </div>

      <div className="flex gap-2">
        {['ACTIVE', 'RESOLVED', 'ALL'].map(f => (
          <button key={f} onClick={() => setFilter(f)}
            className={`px-4 py-1.5 text-sm font-medium rounded-btn transition-colors ${
              filter === f ? 'bg-primary text-white' : 'bg-white text-body border border-border hover:bg-accent'
            }`}>{f === 'ALL' ? 'All' : f.charAt(0) + f.slice(1).toLowerCase()}</button>
        ))}
      </div>

      {isLoading ? (
        <div className="space-y-3">{[1,2,3].map(i => <CardSkeleton key={i} />)}</div>
      ) : filtered.length === 0 ? (
        <EmptyState icon={AlertTriangle} title="No disputes" subtitle="No disputes match your filter" />
      ) : (
        <div className="space-y-3">
          {filtered.map((d: any) => (
            <div key={d.id} className="bg-white rounded-card shadow-card p-4">
              <div className="flex items-start gap-4">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                  d.status === 'ACTIVE' ? 'bg-destructive/10 text-destructive' : 'bg-primary/10 text-primary'
                }`}>
                  <AlertTriangle size={20} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium text-dark">{d.enrolment?.trainee?.fullName}</p>
                    <span className="text-xs text-muted-foreground">vs {d.enrolment?.course?.trainer?.fullName}</span>
                  </div>
                  <p className="text-xs text-muted-foreground">{d.enrolment?.course?.title} &middot; {formatDateTime(d.createdAt)}</p>
                  <p className="text-sm text-body mt-1">{d.reason}</p>
                  {d.status === 'ACTIVE' && (
                    <div className="mt-3 flex gap-2">
                      <button onClick={() => resolveMutation.mutate({ id: d.id, resolution: 'REFUND_TRAINEE' })}
                        disabled={resolveMutation.isPending}
                        className="flex items-center gap-1 px-3 py-1 bg-destructive/10 text-destructive text-xs font-medium rounded-btn hover:bg-destructive/20 transition-colors">
                        {resolveMutation.isPending ? <Loader2 size={12} className="animate-spin" /> : <XCircle size={12} />}
                        Refund Trainee
                      </button>
                      <button onClick={() => resolveMutation.mutate({ id: d.id, resolution: 'RELEASE_TRAINER' })}
                        disabled={resolveMutation.isPending}
                        className="flex items-center gap-1 px-3 py-1 bg-primary/10 text-primary text-xs font-medium rounded-btn hover:bg-primary/20 transition-colors">
                        <CheckCircle size={12} /> Release to Trainer
                      </button>
                    </div>
                  )}
                  {d.resolution && (
                    <p className="text-xs text-muted-foreground mt-2">
                      Resolved: {d.resolution === 'REFUND_TRAINEE' ? 'Refunded to trainee' : 'Released to trainer'}
                    </p>
                  )}
                </div>
                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                  d.status === 'ACTIVE' ? 'bg-destructive/10 text-destructive' : 'bg-primary/10 text-primary'
                }`}>{d.status}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
