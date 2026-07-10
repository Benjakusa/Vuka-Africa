import { useState } from 'react';
import { X, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';

interface AcceptEnrolmentModalProps {
  open: boolean;
  mode: 'accept' | 'reject';
  onClose: () => void;
  onConfirm: (reason?: string) => Promise<void>;
  traineeName?: string;
  courseTitle?: string;
}

export function AcceptEnrolmentModal({
  open,
  mode,
  onClose,
  onConfirm,
  traineeName,
  courseTitle,
}: AcceptEnrolmentModalProps) {
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (mode === 'reject' && !reason.trim()) return;
    setSubmitting(true);
    setError('');
    try {
      await onConfirm(mode === 'reject' ? reason.trim() : undefined);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Something went wrong');
    } finally {
      setSubmitting(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="bg-white rounded-2xl -modal max-w-md w-full p-6 relative">
        <button onClick={onClose} className="absolute top-4 right-4 p-1 text-body-foreground hover:text-dark">
          <X size={20} />
        </button>

        <div className="text-center mb-6">
          <div
            className={`w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-3 ${mode === 'accept' ? 'bg-surface' : 'bg-primary'}`}
          >
            {mode === 'accept' ? (
              <CheckCircle size={28} className="text-foreground" />
            ) : (
              <AlertCircle size={28} className="text-primary" />
            )}
          </div>
          <h2 className="text-xl font-bold text-dark">{mode === 'accept' ? 'Accept Enrolment' : 'Reject Enrolment'}</h2>
          <p className="text-sm text-body mt-1">
            {mode === 'accept'
              ? `Accept ${traineeName || 'the trainee'} into ${courseTitle || 'this course'}?`
              : `Reject ${traineeName || 'the trainee'} from ${courseTitle || 'this course'}?`}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === 'reject' && (
            <div>
              <label htmlFor="rejection-reason" className="block text-sm font-medium text-dark mb-1">
                Reason for rejection <span className="text-primary">*</span>
              </label>
              <textarea
                id="rejection-reason"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Explain why this enrolment is being rejected..."
                rows={3}
                required
                className="w-full px-3 py-2.5 border border-border rounded-btn text-sm focus: focus:/20 resize-none"
              />
            </div>
          )}

          {error && <p className="text-sm text-primary">{error}</p>}

          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 border border-border text-dark font-medium rounded-btn hover:bg-accent transition-colors text-sm"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting || (mode === 'reject' && !reason.trim())}
              className={`flex-1 py-2.5 text-white font-medium rounded-btn hover:opacity-90 transition-colors text-sm disabled:opacity-50 ${mode === 'accept' ? 'bg-surface' : 'bg-primary text-white'}`}
            >
              {submitting ? (
                <span className="flex items-center justify-center gap-2">
                  <Loader2 size={16} className="animate-spin" />
                  {mode === 'accept' ? 'Accepting...' : 'Rejecting...'}
                </span>
              ) : mode === 'accept' ? (
                'Accept'
              ) : (
                'Reject'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
