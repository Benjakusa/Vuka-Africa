'use client';

import { X, Copy, Check } from 'lucide-react';
import { useState } from 'react';

interface RawJsonModalProps {
  isOpen: boolean;
  onClose: () => void;
  data: unknown;
  title?: string;
}

export function RawJsonModal({ isOpen, onClose, data, title }: RawJsonModalProps) {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const formatted = JSON.stringify(data, null, 2);

  const handleCopy = () => {
    navigator.clipboard.writeText(formatted);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={onClose}>
      <div className="bg-white rounded-card shadow-modal w-full max-w-2xl max-h-[80vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between p-4 border-b border-border">
          <h3 className="text-lg font-semibold text-dark">{title || 'Raw Data'}</h3>
          <div className="flex items-center gap-2">
            <button
              onClick={handleCopy}
              className="p-1.5 text-muted-foreground hover:text-dark hover:bg-accent rounded-btn transition-colors"
              title="Copy to clipboard"
            >
              {copied ? <Check size={16} className="text-primary" /> : <Copy size={16} />}
            </button>
            <button onClick={onClose} className="p-1.5 text-muted-foreground hover:text-dark hover:bg-accent rounded-btn transition-colors">
              <X size={20} />
            </button>
          </div>
        </div>
        <div className="p-4 overflow-y-auto">
          <pre className="text-xs font-mono bg-accent/50 rounded-btn p-4 overflow-x-auto whitespace-pre-wrap break-all">
            {formatted}
          </pre>
        </div>
      </div>
    </div>
  );
}
