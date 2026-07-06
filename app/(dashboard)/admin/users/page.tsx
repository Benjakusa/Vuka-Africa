'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { Search, Loader2, Ban, CheckCircle, Eye, X, User, Mail, Phone, Calendar, Shield, BookOpen, Star, DollarSign, MessageCircle } from 'lucide-react';
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

const ROLES = ['ALL', 'TRAINER', 'TRAINEE', 'ADMIN'];
const STATUSES = ['ALL', 'ACTIVE', 'SUSPENDED'];
const SORTS = [
  { value: 'newest', label: 'Newest' },
  { value: 'oldest', label: 'Oldest' },
  { value: 'name', label: 'Name A-Z' },
];

function UserDetailModal({ user, onClose, onSuspend, onActivate }: { user: any; onClose: () => void; onSuspend: (id: string) => void; onActivate: (id: string) => void }) {
  if (!user) return null;

  const isAdmin = user.role === 'ADMIN';
  const isSuspended = !!user.suspendedAt;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={onClose}>
      <div className="bg-white rounded-card shadow-modal w-full max-w-lg max-h-[85vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="p-6 space-y-5">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-lg">
                {user.fullName?.[0] || '?'}
              </div>
              <div>
                <h2 className="text-lg font-semibold text-dark">{user.fullName || 'User'}</h2>
                <div className="flex items-center gap-2 mt-0.5">
                  <StatusBadge status={user.role} />
                  {isSuspended ? <StatusBadge status="CANCELLED" /> : <StatusBadge status="ACTIVE" />}
                </div>
              </div>
            </div>
            <button onClick={onClose} className="p-1 text-muted-foreground hover:text-dark">
              <X size={20} />
            </button>
          </div>

          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="flex items-center gap-2">
              <Mail size={14} className="text-muted-foreground" />
              <span className="text-body">{user.email || 'N/A'}</span>
            </div>
            <div className="flex items-center gap-2">
              <Phone size={14} className="text-muted-foreground" />
              <span className="text-body">{user.phone || 'N/A'}</span>
            </div>
            <div className="flex items-center gap-2">
              <Calendar size={14} className="text-muted-foreground" />
              <span className="text-body">Joined {user.createdAt ? formatDateTime(user.createdAt) : 'N/A'}</span>
            </div>
            <div className="flex items-center gap-2">
              <Shield size={14} className="text-muted-foreground" />
              <span className="text-body">{user.role}</span>
            </div>
          </div>

          {user.role === 'TRAINER' && user.trainerProfile && (
            <div className="bg-accent/50 rounded-card p-3 space-y-2 text-sm">
              <p className="font-medium text-dark">Trainer Stats</p>
              <div className="grid grid-cols-2 gap-2">
                <div className="flex items-center gap-1"><BookOpen size={14} className="text-muted-foreground" /> {user.trainerProfile.courseCount || 0} courses</div>
                <div className="flex items-center gap-1"><Users size={14} className="text-muted-foreground" /> {user.trainerProfile.studentCount || 0} students</div>
                <div className="flex items-center gap-1"><Star size={14} className="text-muted-foreground" /> {user.trainerProfile.averageRating?.toFixed(1) || '0.0'} rating</div>
                <div className="flex items-center gap-1"><DollarSign size={14} className="text-muted-foreground" /> {formatCurrency(user.trainerProfile.totalEarnings || 0)} earned</div>
              </div>
              <p className="text-xs text-muted-foreground">Commission: {user.trainerProfile.commissionRate || 20}% &middot; Verification: {user.trainerProfile.verificationStatus || 'NONE'}</p>
            </div>
          )}

          {user.role === 'TRAINEE' && (
            <div className="bg-accent/50 rounded-card p-3 space-y-1 text-sm">
              <p className="font-medium text-dark">Trainee Stats</p>
              <p><span className="text-muted-foreground">Enrolments:</span> {user.traineeStats?.activeEnrolments || 0} active, {user.traineeStats?.completedEnrolments || 0} completed</p>
              <p><span className="text-muted-foreground">Total spent:</span> {formatCurrency(user.traineeStats?.totalSpent || 0)}</p>
              <p><span className="text-muted-foreground">Reviews written:</span> {user.traineeStats?.reviewCount || 0}</p>
            </div>
          )}

          <div className="flex gap-3 pt-2">
            {!isAdmin && (
              isSuspended ? (
                <button onClick={() => onActivate(user.id)}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-primary text-white font-medium rounded-btn hover:bg-primary/90 transition-colors">
                  <CheckCircle size={16} /> Activate User
                </button>
              ) : (
                <button onClick={() => onSuspend(user.id)}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-destructive text-white font-medium rounded-btn hover:bg-destructive/90 transition-colors">
                  <Ban size={16} /> Suspend User
                </button>
              )
            )}
            <button onClick={onClose} className="flex-1 py-2.5 border border-border text-body rounded-btn hover:bg-accent transition-colors">
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function AdminUsersPage() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [role, setRole] = useState('ALL');
  const [status, setStatus] = useState('ALL');
  const [sort, setSort] = useState('newest');
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [confirmAction, setConfirmAction] = useState<{ id: string; action: 'suspend' | 'activate' } | null>(null);

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['admin', 'users', page, role, status, sort, search],
    queryFn: () => api.get<any>('/admin/users', {
      page, perPage: 20,
      role: role !== 'ALL' ? role : undefined,
      status: status !== 'ALL' ? status : undefined,
      sort,
      q: search || undefined,
    }),
  });

  const suspendMutation = useMutation({
    mutationFn: (userId: string) => api.post(`/admin/users/${userId}/suspend`, {}),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
      toast.success('User suspended');
      setConfirmAction(null);
    },
    onError: (err: any) => toast.error(err.message),
  });

  const activateMutation = useMutation({
    mutationFn: (userId: string) => api.post(`/admin/users/${userId}/activate`, {}),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
      toast.success('User activated');
      setConfirmAction(null);
    },
    onError: (err: any) => toast.error(err.message),
  });

  const users = data?.data?.data || [];
  const meta = data?.data?.meta;

  return (
    <div className="space-y-6">
      <OfflineBanner />
      <BackButton href="/admin" label="Back to Admin" />
      <h1 className="text-2xl font-bold text-dark">Users</h1>

      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 max-w-xs">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} placeholder="Search name, email, or phone..."
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
        <select value={sort} onChange={(e) => { setSort(e.target.value); setPage(1); }}
          className="px-3 py-1.5 border border-border rounded-btn text-sm bg-white focus:outline-none">
          {SORTS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
        </select>
      </div>

      {isLoading ? (
        <div className="space-y-2">{[1,2,3].map(i => <CardSkeleton key={i} />)}</div>
      ) : isError ? (
        <ErrorState message="Failed to load users" onRetry={() => refetch()} />
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
                  <th className="text-left p-3 font-medium text-body">Phone</th>
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
                          {u.fullName?.[0] || '?'}
                        </div>
                        <div>
                          <p className="font-medium text-dark">{u.fullName || 'Unknown'}</p>
                          <p className="text-xs text-muted-foreground">{u.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="p-3">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                        u.role === 'ADMIN' ? 'bg-primary/10 text-primary' :
                        u.role === 'TRAINER' ? 'bg-orange-100 text-orange-700' : 'bg-blue-100 text-blue-700'
                      }`}>{u.role}</span>
                    </td>
                    <td className="p-3 text-muted-foreground">{u.phone ? u.phone.replace(/.(?=.{4})/g, 'X') : '-'}</td>
                    <td className="p-3">
                      <div className="flex items-center gap-1.5">
                        <span className={`w-2 h-2 rounded-full ${u.suspendedAt ? 'bg-destructive' : 'bg-primary'}`} />
                        <span className="text-xs font-medium">{u.suspendedAt ? 'Suspended' : 'Active'}</span>
                      </div>
                    </td>
                    <td className="p-3 text-muted-foreground whitespace-nowrap">{u.createdAt ? formatDateTime(u.createdAt) : '-'}</td>
                    <td className="p-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button onClick={() => setSelectedUser(u)}
                          className="p-1.5 text-muted-foreground hover:text-dark hover:bg-accent rounded-btn transition-colors" title="View Profile">
                          <Eye size={16} />
                        </button>
                        {u.role !== 'ADMIN' && (
                          u.suspendedAt ? (
                            <button onClick={() => setConfirmAction({ id: u.id, action: 'activate' })}
                              className="flex items-center gap-1 px-2.5 py-1 text-xs font-medium bg-primary/10 text-primary rounded-btn hover:bg-primary/20 transition-colors">
                              <CheckCircle size={12} /> Activate
                            </button>
                          ) : (
                            <button onClick={() => setConfirmAction({ id: u.id, action: 'suspend' })}
                              className="flex items-center gap-1 px-2.5 py-1 text-xs font-medium bg-destructive/10 text-destructive rounded-btn hover:bg-destructive/20 transition-colors">
                              <Ban size={12} /> Suspend
                            </button>
                          )
                        )}
                      </div>
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

      <UserDetailModal
        user={selectedUser}
        onClose={() => setSelectedUser(null)}
        onSuspend={(id) => setConfirmAction({ id, action: 'suspend' })}
        onActivate={(id) => setConfirmAction({ id, action: 'activate' })}
      />

      <ConfirmationDialog
        isOpen={!!confirmAction}
        onClose={() => setConfirmAction(null)}
        onConfirm={() => {
          if (!confirmAction) return;
          if (confirmAction.action === 'suspend') suspendMutation.mutate(confirmAction.id);
          else activateMutation.mutate(confirmAction.id);
        }}
        title={confirmAction?.action === 'suspend' ? 'Suspend User' : 'Activate User'}
        message={confirmAction?.action === 'suspend'
          ? `Suspend ${selectedUser?.fullName || 'this user'}? They will be unable to log in or transact.`
          : `Activate ${selectedUser?.fullName || 'this user'}? They will regain full access.`}
        confirmLabel={confirmAction?.action === 'suspend' ? 'Suspend' : 'Activate'}
        confirmColor={confirmAction?.action === 'suspend' ? 'destructive' : 'primary'}
        isPending={confirmAction?.action === 'suspend' ? suspendMutation.isPending : activateMutation.isPending}
      />
    </div>
  );
}
