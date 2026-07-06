'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { Search, Loader2, Ban, CheckCircle, MoreHorizontal } from 'lucide-react';
import { BackButton } from '@frontend/components/shared/back-button';
import { api } from '@backend/lib/api';
import { EmptyState } from '@frontend/components/shared/empty-state';
import { CardSkeleton } from '@frontend/components/shared/loading-skeleton';
import { formatDateTime } from '@backend/lib/utils';
import { toast } from 'sonner';

const ROLES = ['ALL', 'TRAINER', 'TRAINEE', 'ADMIN'];
const STATUSES = ['ALL', 'ACTIVE', 'SUSPENDED'];

export default function AdminUsersPage() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [role, setRole] = useState('ALL');
  const [status, setStatus] = useState('ALL');

  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'users', page, role, status, search],
    queryFn: () => api.get<any>('/admin/users', {
      page, perPage: 20,
      role: role !== 'ALL' ? role : undefined,
      status: status !== 'ALL' ? status : undefined,
      q: search || undefined,
    }),
  });

  const suspendMutation = useMutation({
    mutationFn: (userId: string) => api.post(`/admin/users/${userId}/suspend`, {}),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['admin', 'users'] }); toast.success('User suspended'); },
    onError: (err: any) => toast.error(err.message),
  });

  const activateMutation = useMutation({
    mutationFn: (userId: string) => api.post(`/admin/users/${userId}/activate`, {}),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['admin', 'users'] }); toast.success('User activated'); },
    onError: (err: any) => toast.error(err.message),
  });

  const users = data?.data?.data || [];
  const meta = data?.data?.meta;

  return (
    <div className="space-y-6">
      <BackButton href="/dashboard/admin" label="Back to Admin" />
      <h1 className="text-2xl font-bold text-dark">Users</h1>

      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 max-w-xs">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search name or email..."
            className="w-full pl-9 pr-3 py-1.5 border border-border rounded-btn text-sm focus:outline-none focus:ring-2 focus:ring-primary/20" />
        </div>
        <select value={role} onChange={(e) => { setRole(e.target.value); setPage(1); }}
          className="px-3 py-1.5 border border-border rounded-btn text-sm bg-white focus:outline-none">
          <option value="ALL">All Roles</option>
          <option value="TRAINER">Trainers</option>
          <option value="TRAINEE">Trainees</option>
          <option value="ADMIN">Admins</option>
        </select>
        <select value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }}
          className="px-3 py-1.5 border border-border rounded-btn text-sm bg-white focus:outline-none">
          <option value="ALL">All Status</option>
          <option value="ACTIVE">Active</option>
          <option value="SUSPENDED">Suspended</option>
        </select>
      </div>

      {isLoading ? (
        <div className="space-y-2">{[1,2,3].map(i => <CardSkeleton key={i} />)}</div>
      ) : users.length === 0 ? (
        <EmptyState title="No users found" subtitle="Try adjusting your filters" />
      ) : (
        <div className="bg-white rounded-card shadow-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-accent">
                <tr>
                  <th className="text-left p-3 font-medium text-body">User</th>
                  <th className="text-left p-3 font-medium text-body">Role</th>
                  <th className="text-left p-3 font-medium text-body">Status</th>
                  <th className="text-left p-3 font-medium text-body">Joined</th>
                  <th className="text-right p-3 font-medium text-body">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {users.map((u: any) => (
                  <tr key={u.id} className="hover:bg-accent/50">
                    <td className="p-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xs">
                          {u.fullName?.[0]}
                        </div>
                        <div>
                          <p className="font-medium text-dark">{u.fullName}</p>
                          <p className="text-xs text-muted-foreground">{u.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="p-3">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                        u.role === 'ADMIN' ? 'bg-purple-100 text-purple-700' :
                        u.role === 'TRAINER' ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700'
                      }`}>{u.role}</span>
                    </td>
                    <td className="p-3">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                        u.suspendedAt ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'
                      }`}>{u.suspendedAt ? 'Suspended' : 'Active'}</span>
                    </td>
                    <td className="p-3 text-muted-foreground">{formatDateTime(u.createdAt)}</td>
                    <td className="p-3 text-right">
                      {u.role !== 'ADMIN' && (
                        u.suspendedAt ? (
                          <button onClick={() => activateMutation.mutate(u.id)}
                            disabled={activateMutation.isPending}
                            className="flex items-center gap-1 px-3 py-1 text-xs font-medium bg-green-100 text-green-700 rounded-btn hover:bg-green-200 disabled:opacity-50">
                            <CheckCircle size={12} /> Activate
                          </button>
                        ) : (
                          <button onClick={() => suspendMutation.mutate(u.id)}
                            disabled={suspendMutation.isPending}
                            className="flex items-center gap-1 px-3 py-1 text-xs font-medium bg-red-100 text-red-700 rounded-btn hover:bg-red-200 disabled:opacity-50">
                            <Ban size={12} /> Suspend
                          </button>
                        )
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {meta && (
            <div className="flex items-center justify-between p-3 border-t border-border">
              <p className="text-xs text-muted-foreground">Page {meta.page} of {meta.totalPages} ({meta.total} users)</p>
              <div className="flex gap-2">
                <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={meta.page <= 1}
                  className="px-3 py-1 text-xs font-medium border border-border rounded-btn hover:bg-accent disabled:opacity-50">Prev</button>
                <button onClick={() => setPage(p => p + 1)} disabled={meta.page >= meta.totalPages}
                  className="px-3 py-1 text-xs font-medium border border-border rounded-btn hover:bg-accent disabled:opacity-50">Next</button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
