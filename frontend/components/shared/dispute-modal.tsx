'use client';

import { useState } from 'react';
import { X, AlertTriangle } from 'lucide-react';

interface DisputeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (milestoneId: string | null, reason: string) => void;
  isPending?: boolean;
  milestones?: { id: string; label: string; sequence: number }[];
}

export function DisputeModal({ isOpen, onClose, onSubmit, isPending, milestones }: DisputeModalProps) {
  const [milestoneId, setMilestoneId] = useState('');
  const [reason, setReason] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (reason.length < 20) return;
    onSubmit(milestoneId || null, reason.trim());
  };

  const handleClose = () => {
    setMilestoneId('');
    setReason('');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={handleClose}>
      <div
        className="bg-white rounded-card shadow-modal w-full max-w-md p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-warning/10 rounded-full flex items-center justify-center">
            <AlertTriangle size={20} className="text-warning" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-dark">Report an Issue</h3>
            <p className="text-xs text-muted-foreground">Our team will review within 24 hours</p>
          </div>
          <button onClick={handleClose} className="ml-auto p-1 text-muted-foreground hover:text-dark">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {milestones && milestones.length > 0 && (
            <div>
              <label className="text-sm font-medium text-dark mb-1 block">Which milestone?</label>
              <select
                value={milestoneId}
                onChange={(e) => setMilestoneId(e.target.value)}
                className="w-full px-3 py-2 border border-border rounded-btn text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary/20"
              >
                <option value="">Entire enrolment</option>
                {milestones.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.label} (Milestone {m.sequence})
                  </option>
                ))}
              </select>
            </div>
          )}

          <div>
            <label className="text-sm font-medium text-dark mb-1 block">
              Describe the issue <span className="text-destructive">*</span>
            </label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Explain what went wrong (minimum 20 characters)..."
              rows={4}
              className="w-full px-3 py-2 border border-border rounded-btn text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 resize-none"
            />
            <p className="text-xs text-muted-foreground mt-1">{reason.length}/20 characters minimum</p>
          </div>

          <div className="flex gap-3">
            <button
              type="submit"
              disabled={reason.length < 20 || isPending}
              className="flex-1 py-2.5 bg-destructive text-white font-medium rounded-btn hover:bg-destructive/90 disabled:opacity-50 transition-colors"
            >
              {isPending ? 'Submitting...' : 'Submit Dispute'}
            </button>
            <button
              type="button"
              onClick={handleClose}
              className="px-4 py-2.5 border border-border text-body rounded-btn hover:bg-accent transition-colors"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
