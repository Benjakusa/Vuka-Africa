import { useState } from 'react';
import { X, AlertTriangle, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface DisputeModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: { reason: string; description: string }) => Promise<void>;
}

export function DisputeModal({ open, onClose, onSubmit }: DisputeModalProps) {
  const [reason, setReason] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);

  if (!open) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason) return;
    setLoading(true);
    try {
      await onSubmit({ reason, description });
      toast.success('Dispute raised successfully');
      onClose();
    } catch (err: any) {
      toast.error(err.message || 'Failed to raise dispute');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="bg-white rounded-2xl -modal max-w-md w-full p-6 relative">
        <button onClick={onClose} className="absolute top-4 right-4 p-1 text-body-foreground hover:text-dark">
          <X size={20} />
        </button>

        <div className="flex items-center gap-3 mb-4">
          <AlertTriangle size={24} className="text-primary" />
          <h2 className="text-lg font-bold text-dark">Raise a Dispute</h2>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-sm font-medium text-dark mb-1 block">Reason</label>
            <select
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              required
              className="w-full px-3 py-2.5 border border-border rounded-btn text-sm"
            >
              <option value="">Select a reason</option>
              <option value="SESSION_NOT_DELIVERED">Session not delivered</option>
              <option value="QUALITY_NOT_AS_EXPECTED">Quality not as expected</option>
              <option value="TRAINER_NO_SHOW">Trainer did not show up</option>
              <option value="INCORRECT_AMOUNT">Incorrect amount charged</option>
              <option value="OTHER">Other</option>
            </select>
          </div>
          <div>
            <label className="text-sm font-medium text-dark mb-1 block">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              required
              className="w-full px-3 py-2.5 border border-border rounded-btn text-sm resize-none"
              placeholder="Describe the issue in detail..."
            />
          </div>
          <button
            type="submit"
            disabled={loading || !reason}
            className="w-full py-2.5 bg-primary text-white text-white font-medium rounded-btn hover:bg-primary text-white/90 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
          >
            {loading && <Loader2 size={16} className="animate-spin" />}
            Submit Dispute
          </button>
        </form>
      </div>
    </div>
  );
}
