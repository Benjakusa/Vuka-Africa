import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSearchParams } from 'react-router-dom';
import { Users, Search, Loader2, Ban, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';
import { getUsers, suspendUser, activateUser } from '@/services/adminService';
import { adminKeys } from '@/lib/query-keys';
import { Pagination } from '@/components/shared/pagination';
import { ConfirmationDialog } from '@/components/shared/confirmation-dialog';
import { EmptyState } from '@/components/shared/empty-state';
import { ErrorState } from '@/components/shared/error-state';
import { TableSkeleton } from '@/components/shared/loading-skeleton';
import { useDebounce } from '@/hooks/use-debounce';
import { formatDate, getInitials } from '@/lib/utils';

export default function AdminUsers() {
  const queryClient = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();
  const search = searchParams.get('search') || '';
  const page = Number(searchParams.get('page')) || 1;
  const [searchInput, setSearchInput] = useState(search);
  const debouncedSearch = useDebounce(searchInput, 300);

  const [confirmAction, setConfirmAction] = useState<{ userId: string; action: 'suspend' | 'activate' } | null>(null);

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: adminKeys.users(debouncedSearch || undefined, page),
    queryFn: () => getUsers(debouncedSearch || undefined, page),
  });

  const users = data?.data || [];
  const total = data?.total || 0;
  const totalPages = Math.ceil(total / 20);

  const suspendMutation = useMutation({
    mutationFn: () => suspendUser(confirmAction!.userId),
    onSuccess: () => {
      toast.success('User suspended');
      queryClient.invalidateQueries({ queryKey: adminKeys.users() });
      setConfirmAction(null);
    },
    onError: (err: any) => toast.error(err.message || 'Failed to suspend user'),
  });

  const activateMutation = useMutation({
    mutationFn: () => activateUser(confirmAction!.userId),
    onSuccess: () => {
      toast.success('User activated');
      queryClient.invalidateQueries({ queryKey: adminKeys.users() });
      setConfirmAction(null);
    },
    onError: (err: any) => toast.error(err.message || 'Failed to activate user'),
  });

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchInput(e.target.value);
    const params = new URLSearchParams();
    if (e.target.value) params.set('search', e.target.value);
    params.set('page', '1');
    setSearchParams(params, { replace: true });
  };

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <Users size={24} className="text-primary" />
        <div>
          <h1 className="text-2xl font-bold text-dark">User Management</h1>
          <p className="text-body text-sm">View and manage platform users</p>
        </div>
      </div>

      <div className="relative mb-6">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <input
          type="text"
          value={searchInput}
          onChange={handleSearchChange}
          placeholder="Search by name or email..."
          className="w-full pl-9 pr-3 py-2 border border-border rounded-btn text-sm"
        />
      </div>

      {isLoading ? (
        <TableSkeleton rows={8} />
      ) : isError ? (
        <ErrorState message="Failed to load users" onRetry={() => refetch()} />
      ) : users.length === 0 ? (
        <EmptyState
          icon={Search}
          title="No users found"
          subtitle={search ? `No users matching "${search}"` : 'No users registered yet'}
        />
      ) : (
        <div className="bg-white rounded-card shadow-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-surface">
                  <th className="text-left p-3 font-medium text-dark">User</th>
                  <th className="text-left p-3 font-medium text-dark">Email</th>
                  <th className="text-left p-3 font-medium text-dark">Role</th>
                  <th className="text-left p-3 font-medium text-dark">Phone</th>
                  <th className="text-left p-3 font-medium text-dark">Joined</th>
                  <th className="text-left p-3 font-medium text-dark">Status</th>
                  <th className="text-left p-3 font-medium text-dark">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {users.map((u: any) => (
                  <tr key={u.id}>
                    <td className="p-3">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xs">
                          {getInitials(u.fullName)}
                        </div>
                        <span className="font-medium text-dark">{u.fullName}</span>
                      </div>
                    </td>
                    <td className="p-3 text-muted-foreground">{u.email}</td>
                    <td className="p-3">
                      <span
                        className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                          u.role === 'ADMIN'
                            ? 'bg-purple-100 text-purple-700'
                            : u.role === 'TRAINER'
                              ? 'bg-blue-100 text-blue-700'
                              : 'bg-green-100 text-green-700'
                        }`}
                      >
                        {u.role}
                      </span>
                    </td>
                    <td className="p-3 text-muted-foreground">{u.phone || 'N/A'}</td>
                    <td className="p-3 text-muted-foreground whitespace-nowrap">{formatDate(u.createdAt)}</td>
                    <td className="p-3">
                      <span
                        className={`text-xs font-medium ${u.isActive !== false ? 'text-green-600' : 'text-red-600'}`}
                      >
                        {u.isActive !== false ? 'Active' : 'Suspended'}
                      </span>
                    </td>
                    <td className="p-3">
                      {u.role !== 'ADMIN' &&
                        (u.isActive !== false ? (
                          <button
                            onClick={() => setConfirmAction({ userId: u.id, action: 'suspend' })}
                            className="inline-flex items-center gap-1 px-2 py-1 text-xs text-red-600 hover:bg-red-50 rounded"
                          >
                            <Ban size={12} /> Suspend
                          </button>
                        ) : (
                          <button
                            onClick={() => setConfirmAction({ userId: u.id, action: 'activate' })}
                            className="inline-flex items-center gap-1 px-2 py-1 text-xs text-green-600 hover:bg-green-50 rounded"
                          >
                            <CheckCircle size={12} /> Activate
                          </button>
                        ))}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <Pagination page={page} totalPages={totalPages} total={total} />

      <ConfirmationDialog
        open={!!confirmAction}
        onClose={() => setConfirmAction(null)}
        onConfirm={async () => {
          if (confirmAction?.action === 'suspend') await suspendMutation.mutateAsync();
          else await activateMutation.mutateAsync();
        }}
        title={confirmAction?.action === 'suspend' ? 'Suspend User' : 'Activate User'}
        message={
          confirmAction?.action === 'suspend'
            ? 'This user will lose access to the platform.'
            : 'This user will regain access to the platform.'
        }
        confirmLabel={confirmAction?.action === 'suspend' ? 'Suspend' : 'Activate'}
        variant={confirmAction?.action === 'suspend' ? 'destructive' : 'primary'}
      />
    </div>
  );
}
