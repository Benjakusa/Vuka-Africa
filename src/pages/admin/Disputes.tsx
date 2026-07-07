import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSearchParams } from 'react-router-dom';
import { AlertTriangle, Loader2, Search } from 'lucide-react';
import { toast } from 'sonner';
import { useAuthStore } from '@/stores/auth-store';
import { getDisputes, resolveDispute } from '@/services/adminService';
import { adminKeys } from '@/lib/query-keys';
import { Pagination } from '@/components/shared/pagination';
import { StatusBadge } from '@/components/shared/status-badge';
import { EmptyState } from '@/components/shared/empty-state';
import { ErrorState } from '@/components/shared/error-state';
import { TableSkeleton } from '@/components/shared/loading-skeleton';
import { formatDate } from '@/lib/utils';

const TABS = [
  { label: 'Open', value: 'OPEN' },
  { label: 'Resolved', value: 'RESOLVED' },
  { label: 'All', value: '' },
];

export default function Disputes() {
  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();
  const status = searchParams.get('status') || 'OPEN';
  const page = Number(searchParams.get('page')) || 1;
  const [resolution, setResolution] = useState<Record<string, string>>({});
  const [resolving, setResolving] = useState<string | null>(null);

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: adminKeys.disputes(status || undefined, page),
    queryFn: () => getDisputes(status || undefined, page),
  });

  const disputes = data?.data || [];
  const total = data?.total || 0;
  const totalPages = Math.ceil(total / 20);

  const handleResolve = async (disputeId: string) => {
    const note = resolution[disputeId];
    if (!note || !note.trim()) {
      toast.error('Please enter a resolution note');
      return;
    }
    setResolving(disputeId);
    try {
      await resolveDispute(disputeId, note, user!.id);
      toast.success('Dispute resolved');
      queryClient.invalidateQueries({ queryKey: adminKeys.disputes() });
    } catch (err: any) {
      toast.error(err.message || 'Failed to resolve dispute');
    } finally {
      setResolving(null);
    }
  };

  return (
    <div className="max-w-5xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <AlertTriangle size={24} className="text-destructive" />
        <div>
          <h1 className="text-2xl font-bold text-dark">Disputes</h1>
          <p className="text-body text-sm">Manage and resolve disputes</p>
        </div>
      </div>

      <div className="flex gap-1 mb-6 bg-white rounded-card p-1 shadow-card">
        {TABS.map((tab) => (
          <button
            key={tab.value}
            onClick={() => {
              const params = new URLSearchParams();
              if (tab.value) params.set('status', tab.value);
              params.set('page', '1');
              setSearchParams(params, { replace: true });
            }}
            className={`flex-1 py-2 text-sm font-medium rounded-btn transition-colors ${
              status === tab.value ? 'bg-primary text-white' : 'text-muted-foreground hover:text-dark'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {isLoading ? (
        <TableSkeleton rows={8} />
      ) : isError ? (
        <ErrorState message="Failed to load disputes" onRetry={() => refetch()} />
      ) : disputes.length === 0 ? (
        <EmptyState
          icon={Search}
          title="No disputes found"
          subtitle={status ? `No ${status.toLowerCase()} disputes` : 'All disputes have been resolved'}
        />
      ) : (
        <div className="bg-white rounded-card shadow-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-surface">
                  <th className="text-left p-3 font-medium text-dark">Course</th>
                  <th className="text-left p-3 font-medium text-dark">Trainee</th>
                  <th className="text-left p-3 font-medium text-dark">Trainer</th>
                  <th className="text-left p-3 font-medium text-dark">Reason</th>
                  <th className="text-left p-3 font-medium text-dark">Date</th>
                  <th className="text-left p-3 font-medium text-dark">Status</th>
                  <th className="text-left p-3 font-medium text-dark">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {disputes.map((d: any) => (
                  <tr key={d.id}>
                    <td className="p-3 text-dark">{d.enrolment?.course?.title || 'N/A'}</td>
                    <td className="p-3 text-dark">{d.enrolment?.trainee?.fullName || 'N/A'}</td>
                    <td className="p-3 text-dark">{d.enrolment?.trainer?.fullName || 'N/A'}</td>
                    <td className="p-3 text-muted-foreground max-w-[150px] truncate">{d.reason}</td>
                    <td className="p-3 text-muted-foreground whitespace-nowrap">{formatDate(d.createdAt)}</td>
                    <td className="p-3">
                      <StatusBadge status={d.status} />
                    </td>
                    <td className="p-3">
                      {d.status === 'OPEN' ? (
                        <div className="flex items-center gap-2">
                          <input
                            type="text"
                            placeholder="Resolution note..."
                            value={resolution[d.id] || ''}
                            onChange={(e) => setResolution({ ...resolution, [d.id]: e.target.value })}
                            className="px-2 py-1 border border-border rounded text-xs w-28"
                          />
                          <button
                            onClick={() => handleResolve(d.id)}
                            disabled={resolving === d.id}
                            className="px-2 py-1 bg-primary text-white text-xs rounded hover:bg-primary/90 disabled:opacity-50"
                          >
                            {resolving === d.id ? <Loader2 size={12} className="animate-spin" /> : 'Resolve'}
                          </button>
                        </div>
                      ) : (
                        <span className="text-xs text-muted-foreground">{d.resolution}</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <Pagination page={page} totalPages={totalPages} total={total} />
    </div>
  );
}
