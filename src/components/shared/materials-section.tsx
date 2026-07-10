import { useState, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { FileText, Link, Upload, Trash2, ExternalLink, Loader2, Plus, X } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/stores/auth-store';
import { getCourseMaterials, addCourseMaterial, deleteCourseMaterial } from '@/services/enrolmentService';
import { formatDate } from '@/lib/utils';
import { CardSkeleton } from './loading-skeleton';

interface MaterialsSectionProps {
  enrolmentId: string;
  isTrainer: boolean;
  enrolmentStatus: string;
}

export function MaterialsSection({ enrolmentId, isTrainer, enrolmentStatus }: MaterialsSectionProps) {
  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [linkUrl, setLinkUrl] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const { data: materials, isLoading } = useQuery({
    queryKey: ['materials', enrolmentId],
    queryFn: () => getCourseMaterials(enrolmentId),
    enabled: !!enrolmentId,
  });

  const deleteMutation = useMutation({
    mutationFn: deleteCourseMaterial,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['materials', enrolmentId] });
      toast.success('Material deleted');
    },
    onError: (err: any) => {
      toast.error(err.message || 'Failed to delete material');
    },
  });

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    setUploading(true);
    let fileUrl = linkUrl.trim();
    let fileType = 'link';

    if (file) {
      fileType = file.type.startsWith('image/') ? 'image' : 'pdf';
      const filePath = `materials/${enrolmentId}/${Date.now()}-${file.name}`;
      const { error: uploadError } = await supabase.storage.from('course-materials').upload(filePath, file);
      if (uploadError) {
        toast.error(uploadError.message || 'Upload failed');
        setUploading(false);
        return;
      }
      const { data: urlData } = supabase.storage.from('course-materials').getPublicUrl(filePath);
      fileUrl = urlData?.publicUrl || '';
    }

    try {
      await addCourseMaterial({
        enrolmentId,
        title: title.trim(),
        description: description.trim() || undefined,
        fileUrl: fileUrl || undefined,
        fileType,
        uploadedBy: user!.id,
      });
      queryClient.invalidateQueries({ queryKey: ['materials', enrolmentId] });
      setTitle('');
      setDescription('');
      setLinkUrl('');
      setFile(null);
      setShowForm(false);
      toast.success('Material added');
    } catch (err: any) {
      toast.error(err.message || 'Failed to add material');
    } finally {
      setUploading(false);
    }
  };

  const canAdd = isTrainer && enrolmentStatus === 'ACTIVE';

  return (
    <div className="bg-white rounded-card shadow-card p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-bold text-dark">Course Materials</h2>
        {canAdd && !showForm && (
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-primary text-white text-xs font-medium rounded-btn hover:bg-primary/90"
          >
            <Plus size={14} />
            Add Material
          </button>
        )}
      </div>

      {canAdd && showForm && (
        <form onSubmit={handleAdd} className="mb-6 p-4 bg-surface rounded-card space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-dark">New Material</span>
            <button type="button" onClick={() => setShowForm(false)} className="text-muted-foreground hover:text-dark">
              <X size={16} />
            </button>
          </div>

          <div>
            <label htmlFor="material-title" className="block text-sm font-medium text-dark mb-1">
              Title <span className="text-destructive">*</span>
            </label>
            <input
              id="material-title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Chapter 1 Notes"
              required
              className="w-full px-3 py-2 border border-border rounded-btn text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>

          <div>
            <label htmlFor="material-description" className="block text-sm font-medium text-dark mb-1">
              Description <span className="text-muted-foreground">(optional)</span>
            </label>
            <textarea
              id="material-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Brief description of the material..."
              rows={2}
              className="w-full px-3 py-2 border border-border rounded-btn text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 resize-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-dark mb-1">Upload File or Add Link</label>
            <div className="flex gap-2">
              <input
                ref={fileRef}
                type="file"
                accept=".pdf,.doc,.docx,.png,.jpg,.jpeg"
                onChange={(e) => {
                  setFile(e.target.files?.[0] || null);
                  setLinkUrl('');
                }}
                className="hidden"
              />
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                className={`flex items-center gap-1.5 px-3 py-2 border rounded-btn text-sm ${file ? 'bg-primary text-white border-primary' : 'border-border text-body hover:bg-accent'}`}
              >
                <Upload size={14} />
                {file ? file.name : 'Upload File'}
              </button>
              {file && (
                <button
                  type="button"
                  onClick={() => setFile(null)}
                  className="px-2 py-2 text-destructive hover:bg-red-50 rounded-btn"
                  aria-label="Remove file"
                >
                  <X size={14} />
                </button>
              )}
            </div>
            {!file && (
              <input
                type="url"
                value={linkUrl}
                onChange={(e) => {
                  setLinkUrl(e.target.value);
                  setFile(null);
                }}
                placeholder="Or paste a URL (YouTube, Google Doc, etc.)"
                className="w-full mt-2 px-3 py-2 border border-border rounded-btn text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            )}
          </div>

          <button
            type="submit"
            disabled={uploading || !title.trim() || (!file && !linkUrl.trim())}
            className="w-full py-2 bg-primary text-white font-medium rounded-btn hover:bg-primary/90 disabled:opacity-50 text-sm"
          >
            {uploading ? (
              <span className="flex items-center justify-center gap-2">
                <Loader2 size={16} className="animate-spin" />
                Uploading...
              </span>
            ) : (
              'Add Material'
            )}
          </button>
        </form>
      )}

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <CardSkeleton key={i} />
          ))}
        </div>
      ) : !materials || materials.length === 0 ? (
        <p className="text-sm text-muted-foreground py-6 text-center">
          {isTrainer
            ? 'No materials shared yet. Add your first resource above.'
            : 'No materials have been shared yet.'}
        </p>
      ) : (
        <div className="space-y-2">
          {materials.map((m: any) => (
            <div key={m.id} className="flex items-center gap-3 p-3 rounded-card hover:bg-accent transition-colors group">
              <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                {m.fileType === 'pdf' || m.fileType === 'doc' ? (
                  <FileText size={16} className="text-primary" />
                ) : m.fileType === 'image' ? (
                  <FileText size={16} className="text-primary" />
                ) : (
                  <Link size={16} className="text-primary" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-dark truncate">{m.title}</p>
                {m.description && <p className="text-xs text-muted-foreground truncate">{m.description}</p>}
                <p className="text-xs text-muted-foreground mt-0.5">{formatDate(m.createdAt)}</p>
              </div>
              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                {m.fileUrl && (
                  <a
                    href={m.fileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 text-primary hover:bg-primary/10 rounded-btn"
                    aria-label="Open material"
                  >
                    <ExternalLink size={14} />
                  </a>
                )}
                {isTrainer && m.uploadedBy === user?.id && (
                  <button
                    onClick={() => deleteMutation.mutate(m.id)}
                    className="p-2 text-muted-foreground hover:text-destructive hover:bg-red-50 rounded-btn"
                    aria-label="Delete material"
                  >
                    <Trash2 size={14} />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
