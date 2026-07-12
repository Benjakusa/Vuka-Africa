import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useSearchParams } from 'react-router-dom';
import { ShieldCheck, Search } from 'lucide-react';
import { toast } from 'sonner';
import { getVerifications, approveVerification, rejectVerification } from '@/services/adminService';
import { adminKeys } from '@/lib/query-keys';
import { Pagination } from '@/components/shared/pagination';
import { EmptyState } from '@/components/shared/empty-state';
import { ErrorState } from '@/components/shared/error-state';
import { TableSkeleton } from '@/components/shared/loading-skeleton';
import { formatDate, getInitials } from '@/lib/utils';
import { VerificationReviewModal } from '@/components/admin/verification-review-modal';

const TABS = [
  { label: 'Pending', value: 'PENDING' },
  { label: 'Approved', value: 'APPROVED' },
  { label: 'Rejected', value: 'REJECTED' },
  { label: 'All', value: '' },
];

export default function Verifications() {
  const queryClient = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();
  const status = searchParams.get('status') || 'PENDING';
  const page = Number(searchParams.get('page')) || 1;
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [selectedVerification, setSelectedVerification] = useState<any>(null);

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: adminKeys.verifications(status || undefined, page),
    queryFn: () => getVerifications(status || undefined, page),
  });

  const verifications = data?.data || [];
  const total = data?.total || 0;
  const totalPages = Math.ceil(total / 20);

  const handleApprove = async (trainerId: string) => {
    setActionLoading(trainerId);
    try {
      await approveVerification(trainerId);
      toast.success('Trainer verified successfully');
      queryClient.invalidateQueries({ queryKey: adminKeys.verifications() });
    } catch (err: any) {
      toast.error(err.message || 'Failed to approve');
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async (trainerId: string) => {
    setActionLoading(trainerId);
    try {
      await rejectVerification(trainerId);
      toast.success('Verification rejected');
      queryClient.invalidateQueries({ queryKey: adminKeys.verifications() });
    } catch (err: any) {
      toast.error(err.message || 'Failed to reject');
    } finally {
      setActionLoading(null);
    }
  };

  const handleTabChange = (value: string) => {
    const params = new URLSearchParams();
    if (value) params.set('status', value);
    params.set('page', '1');
    setSearchParams(params, { replace: true });
  };

  if (isLoading) {
    return (
      <div className="max-w-6xl mx-auto">
        <TableSkeleton rows={8} />
      </div>
    );
  }

  if (isError) {
    return <ErrorState message="Failed to load verifications" onRetry={() => refetch()} />;
  }

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <ShieldCheck size={24} className="text-primary" />
        <div>
          <h1 className="text-2xl font-bold text-dark">Trainer Verifications</h1>
          <p className="text-body text-sm">Review and approve trainer verification requests</p>
        </div>
      </div>

      <div className="flex gap-1 mb-6 bg-white rounded-card p-1 shadow-card">
        {TABS.map((tab) => (
          <button
            key={tab.value}
            onClick={() => handleTabChange(tab.value)}
            className={`flex-1 py-2 text-sm font-medium rounded-btn transition-colors ${
              status === tab.value ? 'bg-primary text-white' : 'text-body-foreground hover:text-dark'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {verifications.length === 0 ? (
        <EmptyState
          icon={Search}
          title="No verification requests"
          subtitle={status ? `No ${status.toLowerCase()} requests` : 'All requests have been processed'}
        />
      ) : (
        <div className="bg-white rounded-card shadow-card overflow-hidden">
          <div className="overflow-x-auto hidden md:block">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-surface">
                  <th className="text-left p-3 font-medium text-dark">Trainer</th>
                  <th className="text-left p-3 font-medium text-dark">Email</th>
                  <th className="text-left p-3 font-medium text-dark">Phone</th>
                  <th className="text-left p-3 font-medium text-dark">Submitted</th>
                  <th className="text-left p-3 font-medium text-dark">Status</th>
                  <th className="text-left p-3 font-medium text-dark">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {verifications.map((v: any) => {
                  const userData = v.user || {};
                  return (
                    <tr key={v.id}>
                      <td className="p-3">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-surface flex items-center justify-center text-primary font-bold text-xs">
                            {getInitials(userData.fullName || 'T')}
                          </div>
                          <span className="font-medium text-dark">{userData.fullName || 'Unknown'}</span>
                        </div>
                      </td>
                      <td className="p-3 text-body-foreground">{userData.email || 'N/A'}</td>
                      <td className="p-3 text-body-foreground">{userData.phone || 'N/A'}</td>
                      <td className="p-3 text-body-foreground whitespace-nowrap">
                        {formatDate(v.updatedAt || v.createdAt)}
                      </td>
                      <td className="p-3">
                        <span
                          className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                            v.verificationStatus === 'APPROVED'
                              ? 'bg-surface text-foreground'
                              : v.verificationStatus === 'REJECTED'
                                ? 'bg-surface text-primary'
                                : 'bg-surface text-body'
                          }`}
                        >
                          {v.verificationStatus}
                        </span>
                      </td>
                      <td className="p-3">
                        {v.verificationStatus === 'PENDING' && (
                          <button
                            onClick={() => setSelectedVerification(v)}
                            className="inline-flex items-center px-3 py-1.5 bg-dark text-white text-xs font-medium rounded hover:bg-surface"
                          >
                            Review
                          </button>
                        )}
                        {v.verificationStatus === 'APPROVED' && (
                          <span className="text-xs text-foreground">Approved</span>
                        )}
                        {v.verificationStatus === 'REJECTED' && <span className="text-xs text-primary">Rejected</span>}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div className="divide-y divide-border md:hidden">
            {verifications.map((v: any) => {
              const userData = v.user || {};
              return (
                <div key={v.id} className="p-4 space-y-2">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-surface flex items-center justify-center text-primary font-bold text-xs">
                      {getInitials(userData.fullName || 'T')}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-dark text-sm truncate">{userData.fullName || 'Unknown'}</p>
                      <p className="text-xs text-body-foreground truncate">{userData.email || 'N/A'}</p>
                    </div>
                    <span
                      className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                        v.verificationStatus === 'APPROVED'
                          ? 'bg-surface text-foreground'
                          : v.verificationStatus === 'REJECTED'
                            ? 'bg-surface text-primary'
                            : 'bg-surface text-body'
                      }`}
                    >
                      {v.verificationStatus}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs text-body-foreground">
                    <span>Phone: {userData.phone || 'N/A'}</span>
                    <span>{formatDate(v.updatedAt || v.createdAt)}</span>
                  </div>
                  {v.verificationStatus === 'PENDING' && (
                    <div className="pt-1">
                      <button
                        onClick={() => setSelectedVerification(v)}
                        className="w-full py-2 bg-dark text-white text-xs font-medium rounded hover:bg-surface"
                      >
                        Review Documents
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      <Pagination page={page} totalPages={totalPages} total={total} />

      <VerificationReviewModal
        open={!!selectedVerification}
        onClose={() => setSelectedVerification(null)}
        verification={selectedVerification}
        onApprove={handleApprove}
        onReject={handleReject}
        actionLoading={actionLoading}
      />
    </div>
  );
}
