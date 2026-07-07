import { useState, useRef } from 'react';
import { Upload, X, File, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface FileUploadProps {
  accept?: string;
  maxSize?: number;
  onUpload: (file: File) => Promise<string | void>;
  label?: string;
}

export function FileUpload({
  accept = 'image/*',
  maxSize = 10 * 1024 * 1024,
  onUpload,
  label = 'Upload file',
}: FileUploadProps) {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const handleSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (!selected) return;
    if (selected.size > maxSize) {
      setError(`File too large. Max size: ${Math.round(maxSize / 1024 / 1024)}MB`);
      return;
    }
    setError('');
    setFile(selected);
    if (selected.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = () => setPreview(reader.result as string);
      reader.readAsDataURL(selected);
    }
  };

  const handleUpload = async () => {
    if (!file) return;
    setUploading(true);
    try {
      await onUpload(file);
      setFile(null);
      setPreview(null);
    } catch (err: any) {
      setError(err.message || 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-2">
      <div
        onClick={() => inputRef.current?.click()}
        className={cn(
          'border-2 border-dashed border-border rounded-card p-6 text-center cursor-pointer hover:border-primary/50 transition-colors',
          preview && 'p-2',
        )}
      >
        {preview ? (
          <div className="relative inline-block">
            <img src={preview} alt="Preview" className="max-h-48 rounded-card" />
            <button
              onClick={(e) => {
                e.stopPropagation();
                setPreview(null);
                setFile(null);
              }}
              className="absolute -top-2 -right-2 p-0.5 bg-destructive text-white rounded-full"
            >
              <X size={14} />
            </button>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2">
            <Upload size={24} className="text-muted-foreground" />
            <p className="text-sm text-muted-foreground">{label}</p>
          </div>
        )}
        <input ref={inputRef} type="file" accept={accept} onChange={handleSelect} className="hidden" />
      </div>
      {error && <p className="text-xs text-destructive">{error}</p>}
      {file && !preview && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <File size={14} />
          <span className="flex-1 truncate">{file.name}</span>
        </div>
      )}
      {file && (
        <button
          onClick={handleUpload}
          disabled={uploading}
          className="w-full py-2 bg-primary text-white text-sm font-medium rounded-btn hover:bg-primary/90 disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {uploading && <Loader2 size={14} className="animate-spin" />}
          {uploading ? 'Uploading...' : 'Upload'}
        </button>
      )}
    </div>
  );
}
