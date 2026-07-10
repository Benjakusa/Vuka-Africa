import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSearchParams } from 'react-router-dom';
import { Users as UsersIcon, Search, Ban, CheckCircle } from 'lucide-react';
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
        <UsersIcon size={24} className="text-primary" />
        <div>
          <h1 className="text-2xl font-bold text-dark">User Management</h1>
          <p className="text-body text-sm">View and manage platform users</p>
        </div>
      </div>

      <div className="relative mb-6">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-body-foreground" />
        <input
          type="text"
          value={searchInput}
          onChange={handleSearchChange}
          placeholder="Search by name or email..."
          className="w-full pl-9 pr-3 py-2.5 border border-border rounded-btn text-sm focus:border-primary"
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
          <div className="overflow-x-auto hidden md:block">
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
                        <div className="w-8 h-8 rounded-full bg-surface flex items-center justify-center text-primary font-bold text-xs">
                          {getInitials(u.fullName)}
                        </div>
                        <span className="font-medium text-dark">{u.fullName}</span>
                      </div>
                    </td>
                    <td className="p-3 text-body-foreground">{u.email}</td>
                    <td className="p-3">
                      <span
                        className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                          u.role === 'ADMIN'
                            ? 'bg-surface text-foreground'
                            : u.role === 'TRAINER'
                              ? 'bg-surface text-foreground'
                              : 'bg-surface text-foreground'
                        }`}
                      >
                        {u.role}
                      </span>
                    </td>
                    <td className="p-3 text-body-foreground">{u.phone || 'N/A'}</td>
                    <td className="p-3 text-body-foreground whitespace-nowrap">{formatDate(u.createdAt)}</td>
                    <td className="p-3">
                      <span
                        className={`text-xs font-medium ${u.isActive !== false ? 'text-foreground' : 'text-primary'}`}
                      >
                        {u.isActive !== false ? 'Active' : 'Suspended'}
                      </span>
                    </td>
                    <td className="p-3">
                      {u.role !== 'ADMIN' &&
                        (u.isActive !== false ? (
                          <button
                            onClick={() => setConfirmAction({ userId: u.id, action: 'suspend' })}
                            className="inline-flex items-center gap-1 px-2 py-1 text-xs text-primary hover:bg-primary hover:text-white transition-colors rounded"
                          >
                            <Ban size={12} /> Suspend
                          </button>
                        ) : (
                          <button
                            onClick={() => setConfirmAction({ userId: u.id, action: 'activate' })}
                            className="inline-flex items-center gap-1 px-2 py-1 text-xs text-foreground hover:bg-surface transition-colors rounded"
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
          <div className="divide-y divide-border md:hidden">
            {users.map((u: any) => (
              <div key={u.id} className="p-4 space-y-2">
                <div className="flex items-center gap-2">
                  <div className="w-9 h-9 rounded-full bg-surface flex items-center justify-center text-primary font-bold text-xs">
                    {getInitials(u.fullName)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-dark text-sm truncate">{u.fullName}</p>
                      <span
                        className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                          u.role === 'ADMIN'
                            ? 'bg-surface text-foreground'
                            : u.role === 'TRAINER'
                              ? 'bg-surface text-foreground'
                              : 'bg-surface text-foreground'
                        }`}
                      >
                        {u.role}
                      </span>
                    </div>
                    <p className="text-xs text-body-foreground truncate">{u.email}</p>
                  </div>
                </div>
                <div className="flex items-center justify-between text-xs text-body-foreground">
                  <span>{u.phone || 'No phone'}</span>
                  <span className="flex items-center gap-1">
                    {u.isActive !== false ? (
                      <span className="text-foreground">Active</span>
                    ) : (
                      <span className="text-primary">Suspended</span>
                    )}
                    <span>| {formatDate(u.createdAt)}</span>
                  </span>
                </div>
                {u.role !== 'ADMIN' && (
                  <div className="flex gap-2 pt-1">
                    {u.isActive !== false ? (
                      <button
                        onClick={() => setConfirmAction({ userId: u.id, action: 'suspend' })}
                        className="flex-1 py-2 border border-primary text-primary text-xs font-medium rounded hover:bg-primary hover:text-white transition-colors flex items-center justify-center gap-1"
                      >
                        <Ban size={12} /> Suspend
                      </button>
                    ) : (
                      <button
                        onClick={() => setConfirmAction({ userId: u.id, action: 'activate' })}
                        className="flex-1 py-2 border border-border text-foreground text-xs font-medium rounded hover:bg-surface flex items-center justify-center gap-1"
                      >
                        <CheckCircle size={12} /> Activate
                      </button>
                    )}
                  </div>
                )}
              </div>
            ))}
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
