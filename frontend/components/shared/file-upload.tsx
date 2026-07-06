'use client';

import { useState, useRef } from 'react';
import { Upload, X, File, Image } from 'lucide-react';
import { cn } from '@backend/lib/utils';

interface FileUploadProps {
  accept?: string;
  maxSize?: number;
  onUpload: (url: string) => void;
  label?: string;
  preview?: boolean;
}

export function FileUpload({ accept = 'image/*,application/pdf', maxSize = 10 * 1024 * 1024, onUpload, label = 'Upload file', preview = true }: FileUploadProps) {
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const handleSelect = (f: File) => {
    setError('');
    if (f.size > maxSize) {
      setError(`File exceeds ${Math.round(maxSize / 1024 / 1024)}MB limit`);
      return;
    }
    setFile(f);
    if (preview && f.type.startsWith('image/')) {
      setPreviewUrl(URL.createObjectURL(f));
    }
  };

  const handleUpload = async () => {
    if (!file) return;
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await fetch('/api/v1/upload', {
        method: 'POST',
        credentials: 'include',
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error?.message || 'Upload failed');
      onUpload(data.data.url);
      setFile(null);
      setPreviewUrl(null);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-2">
      <div
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => { e.preventDefault(); handleSelect(e.dataTransfer.files[0]); }}
        className={cn(
          'border-2 border-dashed border-border rounded-card p-6 text-center cursor-pointer hover:border-primary/50 transition-colors',
          uploading && 'opacity-50 pointer-events-none'
        )}
      >
        {previewUrl ? (
          <div className="relative inline-block">
            <img src={previewUrl} alt="Preview" className="max-h-40 rounded" />
            <button
              onClick={(e) => { e.stopPropagation(); setPreviewUrl(null); setFile(null); }}
              className="absolute -top-2 -right-2 p-0.5 bg-destructive text-white rounded-full"
            >
              <X size={14} />
            </button>
          </div>
        ) : (
          <div className="space-y-2">
            <Upload size={32} className="mx-auto text-muted" />
            <p className="text-sm text-body">{label}</p>
            <p className="text-xs text-muted-foreground">
              {accept.includes('video') ? 'MP4, WebM up to 50MB' : 'JPG, PNG, PDF up to 10MB'}
            </p>
          </div>
        )}
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          className="hidden"
          onChange={(e) => e.target.files?.[0] && handleSelect(e.target.files[0])}
        />
      </div>

      {file && !previewUrl && (
        <div className="flex items-center gap-2 p-2 bg-accent rounded text-sm">
          <File size={16} className="text-primary" />
          <span className="flex-1 truncate">{file.name}</span>
          <span className="text-muted-foreground text-xs">{Math.round(file.size / 1024)}KB</span>
        </div>
      )}

      {error && <p className="text-xs text-destructive">{error}</p>}

      {file && (
        <button
          onClick={handleUpload}
          disabled={uploading}
          className="w-full py-2 bg-primary text-white text-sm font-medium rounded-btn hover:bg-primary/90 disabled:opacity-50 transition-colors"
        >
          {uploading ? 'Uploading...' : 'Upload'}
        </button>
      )}
    </div>
  );
}
