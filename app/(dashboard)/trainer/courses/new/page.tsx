'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useMutation } from '@tanstack/react-query';
import { Plus, X, Loader2 } from 'lucide-react';
import { api } from '@backend/lib/api';
import { FileUpload } from '@frontend/components/shared/file-upload';
import { toast } from 'sonner';
import Link from 'next/link';

export default function CreateCoursePage() {
  const router = useRouter();
  const [form, setForm] = useState({
    title: '', description: '', category: '', mode: 'VIRTUAL',
    duration: '', sessionCount: 1, priceKes: '',
    maxStudents: '', location: '', prerequisites: '',
  });
  const [outcomes, setOutcomes] = useState<string[]>(['']);
  const [imageUrl, setImageUrl] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const mutation = useMutation({
    mutationFn: () => api.post('/courses', {
      title: form.title,
      description: form.description,
      category: form.category,
      mode: form.mode,
      duration: form.duration,
      sessionCount: Number(form.sessionCount),
      priceKes: Number(form.priceKes),
      maxStudents: form.maxStudents ? Number(form.maxStudents) : undefined,
      location: form.location || undefined,
      prerequisites: form.prerequisites || undefined,
      learningOutcomes: outcomes.filter(Boolean),
      imageUrl: imageUrl || undefined,
    }),
    onSuccess: () => { toast.success('Course created!'); router.push('/dashboard/trainer/courses'); },
    onError: (err: any) => toast.error(err.message),
  });

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <Link href="/dashboard/trainer/courses" className="text-sm text-primary hover:underline">&larr; Back to Courses</Link>
      <h1 className="text-2xl font-bold text-dark">Create New Course</h1>

      <div className="bg-white rounded-card shadow-card p-6 space-y-4">
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
            <input name="duration" value={form.duration} onChange={handleChange} placeholder="e.g. 4 weeks" className="w-full px-3 py-2 border border-border rounded-btn text-sm focus:outline-none focus:ring-2 focus:ring-primary/20" />
          </div>
          <div>
            <label className="text-sm font-medium text-dark mb-1 block">Sessions</label>
            <input name="sessionCount" type="number" value={form.sessionCount} onChange={handleChange} min={1} className="w-full px-3 py-2 border border-border rounded-btn text-sm focus:outline-none focus:ring-2 focus:ring-primary/20" />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium text-dark mb-1 block">Price (KES)</label>
            <input name="priceKes" type="number" value={form.priceKes} onChange={handleChange} className="w-full px-3 py-2 border border-border rounded-btn text-sm focus:outline-none focus:ring-2 focus:ring-primary/20" />
          </div>
          <div>
            <label className="text-sm font-medium text-dark mb-1 block">Max Students</label>
            <input name="maxStudents" type="number" value={form.maxStudents} onChange={handleChange} placeholder="Unlimited" className="w-full px-3 py-2 border border-border rounded-btn text-sm focus:outline-none focus:ring-2 focus:ring-primary/20" />
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
          <input name="prerequisites" value={form.prerequisites} onChange={handleChange} placeholder="None" className="w-full px-3 py-2 border border-border rounded-btn text-sm focus:outline-none focus:ring-2 focus:ring-primary/20" />
        </div>
        <div>
          <label className="text-sm font-medium text-dark mb-1 block">Learning Outcomes</label>
          <div className="space-y-2">
            {outcomes.map((o, i) => (
              <div key={i} className="flex items-center gap-2">
                <input value={o} onChange={(e) => { const u = [...outcomes]; u[i] = e.target.value; setOutcomes(u); }}
                  placeholder="By the end, you'll know how to..."
                  className="flex-1 px-3 py-2 border border-border rounded-btn text-sm focus:outline-none focus:ring-2 focus:ring-primary/20" />
                {outcomes.length > 1 && (
                  <button onClick={() => setOutcomes(outcomes.filter((_, j) => j !== i))} className="p-1 text-muted-foreground hover:text-destructive"><X size={16} /></button>
                )}
              </div>
            ))}
            <button onClick={() => setOutcomes([...outcomes, ''])} className="flex items-center gap-1 text-sm text-primary"><Plus size={14} /> Add outcome</button>
          </div>
        </div>
        <div>
          <label className="text-sm font-medium text-dark mb-1 block">Course Image</label>
          <FileUpload accept="image/*" onUpload={setImageUrl} label="Upload course image" />
        </div>
        <button
          onClick={() => mutation.mutate()}
          disabled={mutation.isPending || !form.title || !form.description || !form.priceKes || !form.category}
          className="w-full py-2.5 bg-primary text-white font-medium rounded-btn hover:bg-primary/90 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
        >
          {mutation.isPending && <Loader2 size={16} className="animate-spin" />}
          Create Course
        </button>
      </div>
    </div>
  );
}
