'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { CheckCircle, XCircle, Loader2, Search } from 'lucide-react';
import { BackButton } from '@frontend/components/shared/back-button';
import { api } from '@backend/lib/api';
import { EmptyState } from '@frontend/components/shared/empty-state';
import { CardSkeleton } from '@frontend/components/shared/loading-skeleton';
import { formatDateTime } from '@backend/lib/utils';
import { toast } from 'sonner';

export default function AdminVerificationsPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'verifications'],
    queryFn: () => api.get<any>('/admin/verifications'),
  });

  const approveMutation = useMutation({
    mutationFn: (id: string) => api.post(`/admin/verifications/${id}/approve`, {}),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'verifications'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'stats'] });
      toast.success('Verification approved');
    },
    onError: (err: any) => toast.error(err.message),
  });

  const rejectMutation = useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) =>
      api.post(`/admin/verifications/${id}/reject`, { reason }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'verifications'] });
      toast.success('Verification rejected');
    },
    onError: (err: any) => toast.error(err.message),
  });

  const items: any[] = data?.data || [];
  const filtered = items.filter((v: any) =>
    v.trainer?.fullName?.toLowerCase().includes(search.toLowerCase()) ||
    v.trainer?.email?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <BackButton href="/dashboard/admin" label="Back to Admin" />
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-dark">Verifications</h1>
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search trainers..."
            className="pl-9 pr-3 py-1.5 border border-border rounded-btn text-sm w-60 focus:outline-none focus:ring-2 focus:ring-primary/20" />
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-3">{[1,2,3].map(i => <CardSkeleton key={i} />)}</div>
      ) : filtered.length === 0 ? (
        <EmptyState title="No verifications" subtitle="All verification requests will appear here" />
      ) : (
        <div className="space-y-3">
          {filtered.map((v: any) => (
            <div key={v.id} className="bg-white rounded-card shadow-card p-4">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm">
                  {v.trainer?.fullName?.[0]}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-dark">{v.trainer?.fullName}</p>
                  <p className="text-xs text-muted-foreground">{v.trainer?.email} &middot; {formatDateTime(v.createdAt)}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {v.trainer?.bio ? `Bio: ${v.trainer.bio.slice(0, 80)}...` : 'No bio'}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => approveMutation.mutate(v.id)}
                    disabled={approveMutation.isPending}
                    className="p-2 bg-primary/10 text-primary rounded-btn hover:bg-primary/20 disabled:opacity-50 transition-colors"
                    title="Approve"
                  >
                    {approveMutation.isPending ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle size={16} />}
                  </button>
                  <button
                    onClick={() => {
                      const reason = window.prompt('Rejection reason:');
                      if (reason) rejectMutation.mutate({ id: v.id, reason });
                    }}
                    disabled={rejectMutation.isPending}
                    className="p-2 bg-destructive/10 text-destructive rounded-btn hover:bg-destructive/20 disabled:opacity-50 transition-colors"
                    title="Reject"
                  >
                    <XCircle size={16} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
