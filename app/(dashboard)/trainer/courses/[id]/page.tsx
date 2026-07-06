'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useState } from 'react';
import { ArrowLeft, Loader2, Plus, X, Trash2 } from 'lucide-react';
import { api } from '@backend/lib/api';
import { FileUpload } from '@frontend/components/shared/file-upload';
import { ProfileSkeleton } from '@frontend/components/shared/loading-skeleton';
import { toast } from 'sonner';

export default function EditCoursePage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['course', id],
    queryFn: () => api.get<any>(`/courses/${id}`),
  });

  const course = data?.data;

  const [form, setForm] = useState<any>(null);

  const mutation = useMutation({
    mutationFn: () => api.patch(`/courses/${id}`, form),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['course', id] });
      queryClient.invalidateQueries({ queryKey: ['trainer-courses'] });
      toast.success('Course updated');
      router.push('/dashboard/trainer/courses');
    },
    onError: (err: any) => toast.error(err.message),
  });

  const deleteMutation = useMutation({
    mutationFn: () => api.delete(`/courses/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trainer-courses'] });
      toast.success('Course deleted');
      router.push('/dashboard/trainer/courses');
    },
    onError: (err: any) => toast.error(err.message),
  });

  if (isLoading) return <ProfileSkeleton />;
  if (!course) return <div className="p-8 text-center text-muted-foreground">Course not found</div>;
  if (!form) {
    setForm({
      title: course.title, description: course.description, category: course.category,
      mode: course.mode, duration: course.duration, sessionCount: course.sessionCount,
      priceKes: course.priceKes.toString(), maxStudents: course.maxStudents?.toString() || '',
      location: course.location || '', prerequisites: course.prerequisites || '',
      isPublished: course.isPublished, learningOutcomes: course.learningOutcomes || [''],
      imageUrl: course.imageUrl || '',
    });
    return <ProfileSkeleton />;
  }

  const handleChange = (e: any) => setForm({ ...form, [e.target.name]: e.target.value });

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <Link href="/dashboard/trainer/courses" className="flex items-center gap-1.5 text-sm text-primary hover:underline">
        <ArrowLeft size={16} /> Back to Courses
      </Link>

      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-dark">Edit Course</h1>
        <button onClick={() => { if (confirm('Delete this course?')) deleteMutation.mutate(); }}
          disabled={deleteMutation.isPending}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-red-100 text-red-700 text-sm font-medium rounded-btn hover:bg-red-200 disabled:opacity-50">
          <Trash2 size={14} /> Delete
        </button>
      </div>

      <div className="bg-white rounded-card shadow-card p-6 space-y-4">
        <div className="flex items-center gap-3 mb-2">
          <label className="relative inline-flex items-center cursor-pointer">
            <input type="checkbox" checked={form.isPublished} onChange={(e) => setForm({ ...form, isPublished: e.target.checked })} className="sr-only peer" />
            <div className="w-9 h-5 bg-border peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-primary/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:bg-primary after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all" />
          </label>
          <span className="text-sm text-dark">{form.isPublished ? 'Published' : 'Draft'}</span>
        </div>

        <div>
          <label className="text-sm font-medium text-dark mb-1 block">Title</label>
          <input name="title" value={form.title} onChange={handleChange} className="w-full px-3 py-2 border border-border rounded-btn text-sm focus:outline-none focus:ring-2 focus:ring-primary/20" />
        </div>
        <div>
          <label className="text-sm font-medium text-dark mb-1 block">Description</label>
          <textarea name="description" value={form.description} onChange={handleChange} rows={4} className="w-full px-3 py-2 border border-border rounded-btn text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 resize-none" />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium text-dark mb-1 block">Category</label>
            <select name="category" value={form.category} onChange={handleChange} className="w-full px-3 py-2 border border-border rounded-btn text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary/20">
              <option value="">Select...</option>
              <option value="Baking & Cake Decoration">Baking & Cake Decoration</option>
              <option value="Photography & Videography">Photography & Videography</option>
              <option value="Programming & Web Dev">Programming & Web Dev</option>
              <option value="Fitness & Wellness">Fitness & Wellness</option>
              <option value="Music & Instruments">Music & Instruments</option>
              <option value="Languages">Languages</option>
            </select>
          </div>
          <div>
            <label className="text-sm font-medium text-dark mb-1 block">Mode</label>
            <div className="flex gap-2">
              {['PHYSICAL', 'VIRTUAL', 'HYBRID'].map(m => (
                <button key={m} type="button" onClick={() => setForm({ ...form, mode: m })}
                  className={`flex-1 py-2 text-xs font-medium rounded-btn border transition-colors ${
                    form.mode === m ? 'bg-primary text-white border-primary' : 'bg-white text-body border-border hover:bg-accent'
                  }`}>
                  {m.charAt(0) + m.slice(1).toLowerCase()}
                </button>
              ))}
            </div>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium text-dark mb-1 block">Duration</label>
            <input name="duration" value={form.duration} onChange={handleChange} className="w-full px-3 py-2 border border-border rounded-btn text-sm focus:outline-none focus:ring-2 focus:ring-primary/20" />
          </div>
          <div>
            <label className="text-sm font-medium text-dark mb-1 block">Sessions</label>
            <input name="sessionCount" type="number" value={form.sessionCount} onChange={handleChange} className="w-full px-3 py-2 border border-border rounded-btn text-sm focus:outline-none focus:ring-2 focus:ring-primary/20" />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium text-dark mb-1 block">Price (KES)</label>
            <input name="priceKes" type="number" value={form.priceKes} onChange={handleChange} className="w-full px-3 py-2 border border-border rounded-btn text-sm focus:outline-none focus:ring-2 focus:ring-primary/20" />
          </div>
          <div>
            <label className="text-sm font-medium text-dark mb-1 block">Max Students</label>
            <input name="maxStudents" type="number" value={form.maxStudents} onChange={handleChange} className="w-full px-3 py-2 border border-border rounded-btn text-sm focus:outline-none focus:ring-2 focus:ring-primary/20" />
          </div>
        </div>
        {form.mode === 'PHYSICAL' && (
          <div>
            <label className="text-sm font-medium text-dark mb-1 block">Location</label>
            <input name="location" value={form.location} onChange={handleChange} className="w-full px-3 py-2 border border-border rounded-btn text-sm focus:outline-none focus:ring-2 focus:ring-primary/20" />
          </div>
        )}
        <div>
          <label className="text-sm font-medium text-dark mb-1 block">Prerequisites</label>
          <input name="prerequisites" value={form.prerequisites} onChange={handleChange} className="w-full px-3 py-2 border border-border rounded-btn text-sm focus:outline-none focus:ring-2 focus:ring-primary/20" />
        </div>
        <div>
          <label className="text-sm font-medium text-dark mb-1 block">Learning Outcomes</label>
          <div className="space-y-2">
            {form.learningOutcomes.map((o: string, i: number) => (
              <div key={i} className="flex items-center gap-2">
                <input value={o} onChange={(e) => {
                  const u = [...form.learningOutcomes];
                  u[i] = e.target.value;
                  setForm({ ...form, learningOutcomes: u });
                }} className="flex-1 px-3 py-2 border border-border rounded-btn text-sm focus:outline-none focus:ring-2 focus:ring-primary/20" />
                {form.learningOutcomes.length > 1 && (
                  <button onClick={() => setForm({ ...form, learningOutcomes: form.learningOutcomes.filter((_: any, j: number) => j !== i) })} className="p-1 text-muted-foreground hover:text-destructive"><X size={16} /></button>
                )}
              </div>
            ))}
            <button onClick={() => setForm({ ...form, learningOutcomes: [...form.learningOutcomes, ''] })}
              className="flex items-center gap-1 text-sm text-primary"><Plus size={14} /> Add outcome</button>
          </div>
        </div>
        <div>
          <label className="text-sm font-medium text-dark mb-1 block">Course Image</label>
          {form.imageUrl && <img src={form.imageUrl} alt="" className="w-full h-40 object-cover rounded-card mb-2" />}
          <FileUpload accept="image/*" onUpload={(url) => setForm({ ...form, imageUrl: url })} label="Change image" />
        </div>
        <button onClick={() => mutation.mutate()} disabled={mutation.isPending || !form.title || !form.priceKes}
          className="w-full py-2.5 bg-primary text-white font-medium rounded-btn hover:bg-primary/90 disabled:opacity-50 transition-colors flex items-center justify-center gap-2">
          {mutation.isPending && <Loader2 size={16} className="animate-spin" />}
          Save Changes
        </button>
      </div>
    </div>
  );
}
