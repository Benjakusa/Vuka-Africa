import { X, CheckCircle, XCircle, ExternalLink } from 'lucide-react';

interface VerificationReviewModalProps {
  open: boolean;
  onClose: () => void;
  verification: any;
  onApprove: (id: string) => void;
  onReject: (id: string) => void;
  actionLoading: string | null;
}

export function VerificationReviewModal({
  open,
  onClose,
  verification,
  onApprove,
  onReject,
  actionLoading,
}: VerificationReviewModalProps) {
  if (!open || !verification) return null;

  const userData = verification.user || {};

  const DocumentPreview = ({ title, url }: { title: string; url?: string }) => (
    <div className="border border-border rounded-card p-4 bg-surface">
      <h3 className="text-sm font-semibold text-dark mb-3">{title}</h3>
      {url ? (
        <div className="space-y-3">
          <div className="aspect-video bg-white rounded flex items-center justify-center overflow-hidden border border-border">
            {url.toLowerCase().endsWith('.pdf') ? (
              <span className="text-sm text-body font-medium">PDF Document</span>
            ) : (
              <img src={url} alt={title} className="max-w-full max-h-full object-contain" />
            )}
          </div>
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 w-full py-2 bg-white border border-border rounded-btn text-sm font-medium text-dark hover:bg-surface transition-colors"
          >
            <ExternalLink size={14} /> Open in new tab
          </a>
        </div>
      ) : (
        <div className="aspect-video bg-white rounded flex items-center justify-center border border-border">
          <span className="text-sm text-body-foreground">Not provided</span>
        </div>
      )}
    </div>
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-modal max-w-4xl w-full p-6 relative my-8">
        <button onClick={onClose} className="absolute top-4 right-4 p-1 text-body-foreground hover:text-dark">
          <X size={20} />
        </button>

        <div className="mb-6">
          <h2 className="text-xl font-bold text-dark">Review Verification</h2>
          <p className="text-sm text-body mt-1">Review documents for {userData.fullName || 'Unknown Trainer'}</p>
        </div>

        <div className="grid md:grid-cols-2 gap-4 mb-6 p-4 bg-surface rounded-card">
          <div>
            <h3 className="text-sm font-semibold text-dark mb-1">Location</h3>
            <p className="text-sm text-body">{verification.location || 'Not provided'}</p>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-dark mb-1">Alternative Contact</h3>
            <p className="text-sm text-body">{verification.alternativeContact || 'Not provided'}</p>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <DocumentPreview title="National ID / Passport" url={verification.idDocumentUrl} />
          <DocumentPreview title="KRA PIN" url={verification.kraPinUrl} />
          <DocumentPreview title="Passport Photo" url={verification.passportPhotoUrl} />
        </div>

        <div className="flex items-center justify-end gap-3 pt-6 border-t border-border">
          <button
            onClick={onClose}
            className="px-6 py-2.5 text-sm font-medium text-dark hover:bg-surface rounded-btn transition-colors"
          >
            Cancel
          </button>
          {verification.verificationStatus === 'PENDING' && (
            <>
              <button
                onClick={() => {
                  onReject(verification.id);
                  onClose();
                }}
                disabled={actionLoading === verification.id}
                className="inline-flex items-center gap-2 px-6 py-2.5 bg-primary text-white text-sm font-medium rounded-btn hover:bg-surface disabled:opacity-50"
              >
                <XCircle size={16} /> Reject
              </button>
              <button
                onClick={() => {
                  onApprove(verification.id);
                  onClose();
                }}
                disabled={actionLoading === verification.id}
                className="inline-flex items-center gap-2 px-6 py-2.5 bg-dark text-white text-sm font-medium rounded-btn hover:bg-surface disabled:opacity-50"
              >
                <CheckCircle size={16} /> Approve
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
