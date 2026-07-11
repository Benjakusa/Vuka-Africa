import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Play, CheckCircle, Plus, Trash2, Pencil, X, Loader2, Clock } from 'lucide-react';
import { toast } from 'sonner';
import { cn, formatDateTime } from '@/lib/utils';
import {
  createMilestone,
  startMilestone,
  completeMilestone,
  deleteMilestone,
  updateMilestone,
} from '@/services/enrolmentService';
import { MilestoneProgress } from './milestone-progress';
import { useAuthStore } from '@/stores/auth-store';
import { enrolmentKeys } from '@/lib/query-keys';

interface MilestoneManagerProps {
  enrolmentId: string;
  role: 'trainer' | 'trainee' | 'admin';
  courseSessionCount: number;
  milestones: any[];
  onRefresh: () => void;
}

export function MilestoneManager({
  enrolmentId,
  role,
  courseSessionCount,
  milestones,
  onRefresh,
}: MilestoneManagerProps) {
  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  const [showCreate, setShowCreate] = useState(false);
  const [newLabel, setNewLabel] = useState('');
  const [newNotes, setNewNotes] = useState('');
  const [editId, setEditId] = useState<string | null>(null);
  const [editLabel, setEditLabel] = useState('');
  const [editNotes, setEditNotes] = useState('');
  const [completeNotes, setCompleteNotes] = useState('');
  const [completeId, setCompleteId] = useState<string | null>(null);

  const isTrainer = role === 'trainer';
  const canAdd = isTrainer && milestones.length < courseSessionCount;
  const completedCount = milestones.filter((m: any) => m.status === 'COMPLETED').length;

  const createMutation = useMutation({
    mutationFn: (data: { label: string; notes?: string }) =>
      createMilestone({
        enrolmentId,
        sequence: milestones.length + 1,
        label: data.label,
        notes: data.notes,
      }),
    onSuccess: () => {
      toast.success('Milestone created');
      setShowCreate(false);
      setNewLabel('');
      setNewNotes('');
      queryClient.invalidateQueries({ queryKey: enrolmentKeys.all });
      onRefresh();
    },
    onError: (err: any) => toast.error(err.message || 'Failed to create milestone'),
  });

  const startMutation = useMutation({
    mutationFn: (milestoneId: string) => startMilestone(milestoneId, user!.id),
    onSuccess: () => {
      toast.success('Session started');
      queryClient.invalidateQueries({ queryKey: enrolmentKeys.all });
      onRefresh();
    },
    onError: (err: any) => toast.error(err.message || 'Failed to start session'),
  });

  const completeMutation = useMutation({
    mutationFn: ({ milestoneId, notes }: { milestoneId: string; notes?: string }) =>
      completeMilestone(milestoneId, user!.id, notes),
    onSuccess: () => {
      toast.success('Session completed');
      setCompleteId(null);
      setCompleteNotes('');
      queryClient.invalidateQueries({ queryKey: enrolmentKeys.all });
      onRefresh();
    },
    onError: (err: any) => toast.error(err.message || 'Failed to complete session'),
  });

  const deleteMutation = useMutation({
    mutationFn: deleteMilestone,
    onSuccess: () => {
      toast.success('Milestone deleted');
      queryClient.invalidateQueries({ queryKey: enrolmentKeys.all });
      onRefresh();
    },
    onError: (err: any) => toast.error(err.message || 'Failed to delete milestone'),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: { label?: string; notes?: string } }) =>
      updateMilestone(id, updates),
    onSuccess: () => {
      toast.success('Milestone updated');
      setEditId(null);
      queryClient.invalidateQueries({ queryKey: enrolmentKeys.all });
      onRefresh();
    },
    onError: (err: any) => toast.error(err.message || 'Failed to update milestone'),
  });

  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'NOT_STARTED':
        return 'border-gray-200 bg-gray-50';
      case 'IN_PROGRESS':
        return 'border-primary/30 bg-surface';
      case 'COMPLETED':
        return 'border-border bg-surface';
      default:
        return 'border-gray-200';
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'NOT_STARTED':
        return { text: 'Not Started', class: 'bg-gray-100 text-gray-600' };
      case 'IN_PROGRESS':
        return { text: 'In Progress', class: 'bg-surface text-foreground' };
      case 'COMPLETED':
        return { text: 'Completed', class: 'bg-surface text-foreground' };
      default:
        return { text: status, class: 'bg-gray-100 text-gray-600' };
    }
  };

  const calcDuration = (startedAt: string, completedAt?: string) => {
    const start = new Date(startedAt).getTime();
    const end = completedAt ? new Date(completedAt).getTime() : Date.now();
    const diffMs = end - start;
    const mins = Math.floor(diffMs / 60000);
    if (mins < 60) return `${mins} min`;
    const hrs = Math.floor(mins / 60);
    const remMins = mins % 60;
    return `${hrs}h ${remMins}m`;
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h3 className="text-lg font-bold text-dark">Training Sessions</h3>
          {milestones.length > 0 && (
            <span className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs font-medium rounded-full">
              {completedCount}/{milestones.length} done
            </span>
          )}
        </div>
        {canAdd && !showCreate && (
          <button
            onClick={() => setShowCreate(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-primary text-white text-xs font-medium rounded-btn hover:bg-surface"
          >
            <Plus size={14} />
            Add Session
          </button>
        )}
      </div>

      {milestones.length > 0 && <MilestoneProgress completed={completedCount} total={courseSessionCount} size="sm" />}

      {isTrainer && !canAdd && milestones.length > 0 && (
        <p className="text-xs text-body-foreground">Maximum {courseSessionCount} sessions reached</p>
      )}

      {showCreate && (
        <div className="p-4 bg-surface rounded-card space-y-3 border border-border">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-dark">
              Session {milestones.length + 1} of {courseSessionCount}
            </span>
            <button type="button" onClick={() => setShowCreate(false)} className="text-body-foreground hover:text-dark">
              <X size={16} />
            </button>
          </div>
          <div>
            <label htmlFor="milestone-label" className="block text-sm font-medium text-dark mb-1">
              Session Title <span className="text-primary">*</span>
            </label>
            <input
              id="milestone-label"
              type="text"
              value={newLabel}
              onChange={(e) => setNewLabel(e.target.value)}
              placeholder={`Session ${milestones.length + 1}: Topic name`}
              required
              className="w-full px-3 py-2 border border-border rounded-btn text-sm"
            />
          </div>
          <div>
            <label htmlFor="milestone-notes" className="block text-sm font-medium text-dark mb-1">
              Notes <span className="text-body-foreground">(optional)</span>
            </label>
            <textarea
              id="milestone-notes"
              value={newNotes}
              onChange={(e) => setNewNotes(e.target.value)}
              placeholder="What this session covers..."
              rows={2}
              className="w-full px-3 py-2 border border-border rounded-btn text-sm resize-none"
            />
          </div>
          <button
            onClick={() => createMutation.mutate({ label: newLabel.trim(), notes: newNotes.trim() || undefined })}
            disabled={!newLabel.trim() || createMutation.isPending}
            className="w-full py-2 bg-primary text-white font-medium rounded-btn hover:bg-surface disabled:opacity-50 text-sm"
          >
            {createMutation.isPending ? (
              <span className="flex items-center justify-center gap-2">
                <Loader2 size={16} className="animate-spin" /> Creating...
              </span>
            ) : (
              'Create Session'
            )}
          </button>
        </div>
      )}

      {milestones.length === 0 ? (
        <div className="text-center py-8 bg-gray-50 rounded-card border border-dashed border-gray-200">
          {isTrainer ? (
            <>
              <Play size={24} className="mx-auto text-body-foreground mb-2" />
              <p className="text-sm text-body-foreground">No sessions created yet. Add the first training session.</p>
            </>
          ) : (
            <>
              <Clock size={24} className="mx-auto text-body-foreground mb-2" />
              <p className="text-sm text-body-foreground">No sessions have been added yet.</p>
            </>
          )}
        </div>
      ) : (
        <div className="space-y-2">
          {milestones.map((m: any) => {
            const badge = getStatusBadge(m.status);
            const isEditing = editId === m.id;
            const isNotStarted = m.status === 'NOT_STARTED';
            const isInProgress = m.status === 'IN_PROGRESS';

            return (
              <div key={m.id} className={cn('rounded-card border p-3 transition-colors', getStatusStyle(m.status))}>
                {isEditing ? (
                  <div className="space-y-2">
                    <input
                      type="text"
                      value={editLabel}
                      onChange={(e) => setEditLabel(e.target.value)}
                      className="w-full px-3 py-2 border border-border rounded-btn text-sm"
                    />
                    <textarea
                      value={editNotes}
                      onChange={(e) => setEditNotes(e.target.value)}
                      rows={2}
                      className="w-full px-3 py-2 border border-border rounded-btn text-sm resize-none"
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={() =>
                          updateMutation.mutate({
                            id: m.id,
                            updates: { label: editLabel.trim(), notes: editNotes.trim() || undefined },
                          })
                        }
                        disabled={!editLabel.trim() || updateMutation.isPending}
                        className="px-3 py-1.5 bg-primary text-white text-xs font-medium rounded-btn hover:bg-surface disabled:opacity-50"
                      >
                        {updateMutation.isPending ? 'Saving...' : 'Save'}
                      </button>
                      <button
                        onClick={() => setEditId(null)}
                        className="px-3 py-1.5 border border-border text-dark text-xs font-medium rounded-btn hover:bg-accent"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <div>
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span
                            className={cn(
                              'text-sm font-medium',
                              m.status === 'COMPLETED' ? 'text-foreground' : 'text-dark',
                            )}
                          >
                            Session {m.sequence}: {m.label}
                          </span>
                          <span className={cn('px-2 py-0.5 text-xs font-medium rounded-full', badge.class)}>
                            {badge.text}
                          </span>
                        </div>
                        {m.notes && <p className="text-xs text-body-foreground mt-0.5">{m.notes}</p>}
                      </div>

                      {isTrainer && (
                        <div className="flex items-center gap-1 flex-shrink-0">
                          {isNotStarted && (
                            <>
                              <button
                                onClick={() => startMutation.mutate(m.id)}
                                disabled={startMutation.isPending}
                                className="flex items-center gap-1 px-2.5 py-1.5 bg-primary text-white text-xs font-medium rounded-btn hover:bg-surface disabled:opacity-50"
                                aria-label="Start session"
                              >
                                {startMutation.isPending ? (
                                  <Loader2 size={12} className="animate-spin" />
                                ) : (
                                  <Play size={12} />
                                )}
                                Start
                              </button>
                              <button
                                onClick={() => {
                                  setEditId(m.id);
                                  setEditLabel(m.label);
                                  setEditNotes(m.notes || '');
                                }}
                                className="p-1.5 text-body-foreground hover:text-dark hover:bg-gray-100 rounded-btn"
                                aria-label="Edit milestone"
                              >
                                <Pencil size={14} />
                              </button>
                              <button
                                onClick={() => deleteMutation.mutate(m.id)}
                                disabled={deleteMutation.isPending}
                                className="p-1.5 text-body-foreground hover:text-primary hover:bg-primary rounded-btn"
                                aria-label="Delete milestone"
                              >
                                {deleteMutation.isPending ? (
                                  <Loader2 size={14} className="animate-spin" />
                                ) : (
                                  <Trash2 size={14} />
                                )}
                              </button>
                            </>
                          )}
                          {isInProgress && (
                            <>
                              <button
                                onClick={() => {
                                  setCompleteId(m.id);
                                  setCompleteNotes('');
                                }}
                                className="flex items-center gap-1 px-2.5 py-1.5 bg-surface text-white text-xs font-medium rounded-btn hover:bg-surface"
                                aria-label="Complete session"
                              >
                                <CheckCircle size={12} />
                                Complete
                              </button>
                            </>
                          )}
                        </div>
                      )}
                    </div>

                    <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1.5 text-xs text-body-foreground">
                      {m.startedAt && (
                        <span className="flex items-center gap-1">
                          <Play size={10} />
                          Started {formatDateTime(m.startedAt)}
                        </span>
                      )}
                      {m.startedAt && !m.completedAt && (
                        <span className="flex items-center gap-1 text-primary">
                          <Clock size={10} />
                          Running ({calcDuration(m.startedAt)})
                        </span>
                      )}
                      {m.completedAt && (
                        <span className="flex items-center gap-1 text-foreground">
                          <CheckCircle size={10} />
                          Completed {formatDateTime(m.completedAt)}
                          {m.startedAt && ` (${calcDuration(m.startedAt, m.completedAt)})`}
                        </span>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {completeId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-2xl -modal max-w-md w-full p-6">
            <h3 className="text-lg font-bold text-dark mb-2">Complete Session</h3>
            <p className="text-sm text-body mb-4">Add any notes about this completed session.</p>
            <textarea
              value={completeNotes}
              onChange={(e) => setCompleteNotes(e.target.value)}
              placeholder="Session summary, what was covered..."
              rows={3}
              className="w-full px-3 py-2 border border-border rounded-btn text-sm resize-none mb-4"
            />
            <div className="flex gap-3">
              <button
                onClick={() => setCompleteId(null)}
                className="flex-1 py-2.5 border border-border text-dark font-medium rounded-btn hover:bg-accent text-sm"
              >
                Cancel
              </button>
              <button
                onClick={() =>
                  completeMutation.mutate({ milestoneId: completeId, notes: completeNotes.trim() || undefined })
                }
                disabled={completeMutation.isPending}
                className="flex-1 py-2.5 bg-surface text-white font-medium rounded-btn hover:bg-surface disabled:opacity-50 text-sm"
              >
                {completeMutation.isPending ? (
                  <span className="flex items-center justify-center gap-2">
                    <Loader2 size={16} className="animate-spin" /> Completing...
                  </span>
                ) : (
                  'Complete Session'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
