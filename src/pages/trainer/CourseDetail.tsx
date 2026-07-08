import { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams, Link } from 'react-router-dom';
import { Loader2, ArrowLeft, Upload, X } from 'lucide-react';
import { toast } from 'sonner';
import { getCourseBySlug, updateCourse } from '@/services/courseService';
import { courseKeys } from '@/lib/query-keys';
import { CardSkeleton } from '@/components/shared/loading-skeleton';
import { ErrorState } from '@/components/shared/error-state';
import { supabaseData as supabase } from '@/lib/supabase';
import { CATEGORIES } from '@/lib/categories';

export default function CourseDetail() {
  const { slug } = useParams<{ slug: string }>();
  const queryClient = useQueryClient();

  const {
    data: course,
    isLoading,
    isError,
  } = useQuery({
    queryKey: courseKeys.detail(slug!),
    queryFn: () => getCourseBySlug(slug!),
    enabled: !!slug,
  });

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

  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [existingImage, setExistingImage] = useState<string | null>(null);
  const [categoryOther, setCategoryOther] = useState('');
  const imageInputRef = useRef<HTMLInputElement>(null);

  const isOther = !CATEGORIES.includes(form.category) && form.category !== '';

  useEffect(() => {
    if (course) {
      setForm({
        title: course.title || '',
        description: course.description || '',
        mode: course.mode || 'PHYSICAL',
        priceKes: String(course.priceKes || ''),
        category: course.category || '',
        duration: course.duration || '',
        sessionCount: String(course.sessionCount || ''),
        maxStudents: String(course.maxStudents || ''),
        location: course.location || '',
      });
      setExistingImage(course.imageUrl || null);
      if (course.category && !CATEGORIES.includes(course.category)) {
        setCategoryOther(course.category);
      }
    }
  }, [course]);

  const updateMutation = useMutation({
    mutationFn: async () => {
      let imageUrl = existingImage;

      if (imageFile) {
        const ext = imageFile.name.split('.').pop();
        const filePath = `courses/${course!.trainerId}/${Date.now()}.${ext}`;
        const { error: uploadError } = await supabase.storage.from('courses').upload(filePath, imageFile, {
          cacheControl: '3600',
          upsert: false,
        });
        if (uploadError) throw new Error(uploadError.message);
        const { data: urlData } = supabase.storage.from('courses').getPublicUrl(filePath);
        imageUrl = urlData.publicUrl;
      }

      return updateCourse(course!.id, {
        title: form.title,
        description: form.description,
        mode: form.mode,
        priceKes: Number(form.priceKes),
        category: isOther ? categoryOther : form.category,
        duration: form.duration,
        sessionCount: Number(form.sessionCount),
        maxStudents: Number(form.maxStudents) || null,
        location: form.location || null,
        imageUrl,
      });
    },
    onSuccess: () => {
      toast.success('Course updated!');
      queryClient.invalidateQueries({ queryKey: courseKeys.detail(slug!) });
      queryClient.invalidateQueries({ queryKey: courseKeys.lists() });
    },
    onError: (err: any) => {
      toast.error(err.message || 'Failed to update course');
    },
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image too large. Max 5MB');
      return;
    }
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const removeImage = () => {
    setImageFile(null);
    setImagePreview(null);
    setExistingImage(null);
    if (imageInputRef.current) imageInputRef.current.value = '';
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateMutation.mutate();
  };

  if (isLoading) {
    return (
      <div className="max-w-2xl mx-auto">
        <CardSkeleton />
        <div className="mt-4">
          <CardSkeleton />
        </div>
      </div>
    );
  }

  if (isError || !course) {
    return <ErrorState message="Course not found" />;
  }

  const currentCategory = isOther ? 'OTHER' : form.category;

  return (
    <div className="max-w-2xl mx-auto">
      <Link
        to="/trainer/courses"
        className="inline-flex items-center gap-1.5 text-sm text-primary hover:underline mb-4"
      >
        <ArrowLeft size={16} /> Back to Courses
      </Link>

      <h1 className="text-2xl font-bold text-dark mb-6">Edit Course</h1>

      <form onSubmit={handleSubmit} className="bg-white rounded-card shadow-card p-6 space-y-4">
        <div>
          <label className="text-sm font-medium text-dark mb-1 block">Course Image</label>
          <div
            onClick={() => imageInputRef.current?.click()}
            className="border-2 border-dashed border-border rounded-card p-4 text-center cursor-pointer hover:border-primary/50 transition-colors"
          >
            {imagePreview || existingImage ? (
              <div className="relative inline-block">
                <img src={imagePreview || existingImage!} alt="Preview" className="max-h-48 rounded-card" />
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    removeImage();
                  }}
                  className="absolute -top-2 -right-2 p-0.5 bg-destructive text-white rounded-full"
                >
                  <X size={14} />
                </button>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-2 py-4">
                <Upload size={24} className="text-muted-foreground" />
                <p className="text-sm text-muted-foreground">Click to upload course image</p>
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
              value={currentCategory}
              onChange={handleChange}
              required
              className="w-full px-3 py-2.5 border border-border rounded-btn text-sm"
            >
              <option value="">Select category</option>
              {CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
              <option value="OTHER">Other</option>
            </select>
            {isOther && (
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
          />
        </div>

        <button
          type="submit"
          disabled={updateMutation.isPending}
          className="w-full py-2.5 bg-primary text-white font-medium rounded-btn hover:bg-primary/90 disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {updateMutation.isPending && <Loader2 size={16} className="animate-spin" />}
          {updateMutation.isPending ? 'Saving...' : 'Save Changes'}
        </button>
      </form>
    </div>
  );
}
