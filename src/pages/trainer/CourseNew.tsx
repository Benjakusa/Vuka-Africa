import { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { Loader2, ArrowLeft, Upload, X } from 'lucide-react';
import { toast } from 'sonner';
import { useAuthStore } from '@/stores/auth-store';
import { supabase } from '@/lib/supabase';
import { createCourse, updateCourse, getTrainerCourses } from '@/services/courseService';

import { CATEGORIES } from '@/lib/categories';

export default function CourseNew() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { user } = useAuthStore();
  const isEdit = !!id;
  const [loading, setLoading] = useState(false);
  const [loadingCourse, setLoadingCourse] = useState(isEdit);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const [categoryOther, setCategoryOther] = useState('');

  const [form, setForm] = useState({
    title: '',
    description: '',
    mode: 'PHYSICAL',
    priceKes: '',
    category: '',
    duration: '',
    sessionCount: '',
    maxStudents: '',
    location: '',
  });

  useEffect(() => {
    if (!isEdit) return;
    (async () => {
      try {
        const courses = await getTrainerCourses(user?.trainer?.id!);
        const course = courses.find((c: any) => c.id === id);
        if (!course) {
          toast.error('Course not found');
          navigate('/trainer/courses');
          return;
        }
        setForm({
          title: course.title || '',
          description: course.description || '',
          mode: course.mode || 'PHYSICAL',
          priceKes: course.priceKes?.toString() || '',
          category: course.category || '',
          duration: course.duration || '',
          sessionCount: course.sessionCount?.toString() || '',
          maxStudents: course.maxStudents?.toString() || '',
          location: course.location || '',
        });
        if (course.imageUrl) setImagePreview(course.imageUrl);
        if (!CATEGORIES.includes(course.category)) setCategoryOther(course.category);
      } catch (err: any) {
        toast.error(err.message || 'Failed to load course');
      } finally {
        setLoadingCourse(false);
      }
    })();
  }, [id, isEdit, navigate, user?.trainer?.id]);

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
      setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    },
    [],
  );

  const handleImageSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image too large. Max 5MB');
      return;
    }
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  }, []);

  const removeImage = useCallback(() => {
    setImageFile(null);
    setImagePreview(null);
    if (imageInputRef.current) imageInputRef.current.value = '';
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.trainer?.id) {
      let { data: newTrainer } = await supabase.from('Trainer').select('id').eq('userId', user!.id).maybeSingle();
      if (!newTrainer) {
        const r = await supabase
          .from('Trainer')
          .insert({ userId: user!.id, updatedAt: new Date().toISOString() })
          .select('id')
          .maybeSingle();
        newTrainer = r.data ?? null;
      }
      if (!newTrainer) {
        toast.error('Trainer profile not found — please contact support');
        return;
      }
      await useAuthStore.getState().checkAuth();
      const updated = useAuthStore.getState().user;
      if (!updated?.trainer?.id) {
        toast.error('Trainer profile not found — please contact support');
        return;
      }
    }
    setLoading(true);
    try {
      let imageUrl = isEdit ? imagePreview : null;

      if (imageFile) {
        const reader = new FileReader();
        imageUrl = await new Promise<string>((resolve) => {
          reader.onload = () => resolve(reader.result as string);
          reader.readAsDataURL(imageFile);
        });
      }

      if (isEdit) {
        await updateCourse(id, {
          title: form.title,
          description: form.description,
          mode: form.mode,
          priceKes: Number(form.priceKes),
          category: form.category === 'OTHER' ? categoryOther : form.category,
          duration: form.duration,
          sessionCount: Number(form.sessionCount),
          maxStudents: Number(form.maxStudents) || null,
          location: form.location || null,
          imageUrl,
        });
        toast.success('Course updated successfully!');
      } else {
        const slug = form.title
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/(^-|-$)/g, '');
        await createCourse({
          trainerId: user!.trainer!.id,
          title: form.title,
          slug,
          description: form.description,
          mode: form.mode,
          priceKes: Number(form.priceKes),
          category: form.category === 'OTHER' ? categoryOther : form.category,
          duration: form.duration,
          sessionCount: Number(form.sessionCount),
          maxStudents: Number(form.maxStudents) || null,
          location: form.location || null,
          imageUrl,
          isPublished: true,
        });
        toast.success('Course created successfully!');
      }
      navigate('/trainer/courses');
    } catch (err: any) {
      toast.error(err.message || 'Failed to save course');
    } finally {
      setLoading(false);
    }
  };

  if (loadingCourse) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-card shadow-card p-6 flex items-center justify-center py-20">
          <Loader2 size={24} className="animate-spin text-primary" />
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <Link
        to="/trainer/courses"
        className="inline-flex items-center gap-1.5 text-sm text-primary hover:underline mb-4"
      >
        <ArrowLeft size={16} /> Back to Courses
      </Link>

      <h1 className="text-2xl font-bold text-dark mb-6">{isEdit ? 'Edit Course' : 'Create New Course'}</h1>

      <form onSubmit={handleSubmit} className="bg-white rounded-card shadow-card p-6 space-y-4">
        <div>
          <label className="text-sm font-medium text-dark mb-1 block">Course Image</label>
          <div
            onClick={() => imageInputRef.current?.click()}
            className="border-2 border-dashed border-border rounded-card p-4 text-center cursor-pointer hover:border-primary/50 transition-colors"
          >
            {imagePreview ? (
              <div className="relative inline-block">
                <img src={imagePreview} alt="Preview" className="max-h-48 rounded-card" />
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    removeImage();
                  }}
                  className="absolute -top-2 -right-2 p-0.5 bg-primary text-white text-white rounded-full"
                >
                  <X size={14} />
                </button>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-2 py-4">
                <Upload size={24} className="text-body-foreground" />
                <p className="text-sm text-body-foreground">Click to upload course image</p>
              </div>
            )}
            <input ref={imageInputRef} type="file" accept="image/*" onChange={handleImageSelect} className="hidden" />
          </div>
        </div>

        <div>
          <label className="text-sm font-medium text-dark mb-1 block">Course Title</label>
          <input
            name="title"
            value={form.title}
            onChange={handleChange}
            required
            className="w-full px-3 py-2.5 border border-border rounded-btn text-sm"
            placeholder="e.g. Professional Cake Baking"
          />
        </div>

        <div>
          <label className="text-sm font-medium text-dark mb-1 block">Description</label>
          <textarea
            name="description"
            value={form.description}
            onChange={handleChange}
            rows={4}
            required
            className="w-full px-3 py-2.5 border border-border rounded-btn text-sm resize-none"
            placeholder="Describe what students will learn..."
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium text-dark mb-1 block">Mode</label>
            <select
              name="mode"
              value={form.mode}
              onChange={handleChange}
              className="w-full px-3 py-2.5 border border-border rounded-btn text-sm"
            >
              <option value="PHYSICAL">Physical</option>
              <option value="VIRTUAL">Virtual</option>
              <option value="HYBRID">Hybrid</option>
            </select>
          </div>
          <div>
            <label className="text-sm font-medium text-dark mb-1 block">Category</label>
            <select
              name="category"
              value={CATEGORIES.some((c) => c.name === form.category) ? form.category : 'OTHER'}
              onChange={(e) => {
                handleChange(e);
                if (e.target.value !== 'OTHER') setCategoryOther('');
              }}
              required
              className="w-full px-3 py-2.5 border border-border rounded-btn text-sm"
            >
              <option value="">Select category</option>
              {CATEGORIES.map((cat) => (
                <option key={cat.name} value={cat.name}>
                  {cat.name}
                </option>
              ))}
              <option value="OTHER">Other</option>
            </select>
            {form.category && !CATEGORIES.some((c) => c.name === form.category) && (
              <input
                type="text"
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
                placeholder="Type your category"
                required
                className="w-full px-3 py-2.5 border border-border rounded-btn text-sm mt-2"
              />
            )}
            {form.category === 'OTHER' && (
              <input
                type="text"
                value={categoryOther}
                onChange={(e) => setCategoryOther(e.target.value)}
                placeholder="Type your category"
                required
                className="w-full px-3 py-2.5 border border-border rounded-btn text-sm mt-2"
              />
            )}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium text-dark mb-1 block">Price (KES)</label>
            <input
              name="priceKes"
              type="number"
              value={form.priceKes}
              onChange={handleChange}
              required
              min={1}
              className="w-full px-3 py-2.5 border border-border rounded-btn text-sm"
              placeholder="e.g. 5000"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-dark mb-1 block">Duration</label>
            <input
              name="duration"
              value={form.duration}
              onChange={handleChange}
              required
              className="w-full px-3 py-2.5 border border-border rounded-btn text-sm"
              placeholder="e.g. 8 weeks"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium text-dark mb-1 block">Sessions</label>
            <input
              name="sessionCount"
              type="number"
              value={form.sessionCount}
              onChange={handleChange}
              required
              min={1}
              className="w-full px-3 py-2.5 border border-border rounded-btn text-sm"
              placeholder="e.g. 8"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-dark mb-1 block">Max Students</label>
            <input
              name="maxStudents"
              type="number"
              value={form.maxStudents}
              onChange={handleChange}
              min={1}
              className="w-full px-3 py-2.5 border border-border rounded-btn text-sm"
              placeholder="Optional"
            />
          </div>
        </div>

        <div>
          <label className="text-sm font-medium text-dark mb-1 block">Location</label>
          <input
            name="location"
            value={form.location}
            onChange={handleChange}
            className="w-full px-3 py-2.5 border border-border rounded-btn text-sm"
            placeholder="e.g. Nairobi, Kenya (optional)"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-2.5 bg-primary text-white font-medium rounded-btn hover:bg-surface disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {loading && <Loader2 size={16} className="animate-spin" />}
          {loading ? 'Saving...' : isEdit ? 'Update Course' : 'Create Course'}
        </button>
      </form>
    </div>
  );
}
