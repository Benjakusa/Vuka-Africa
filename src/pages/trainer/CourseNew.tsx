import { useState, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Loader2, ArrowLeft, Upload, X } from 'lucide-react';
import { toast } from 'sonner';
import { useAuthStore } from '@/stores/auth-store';
import { createCourse } from '@/services/courseService';
import { supabaseData as supabase } from '@/lib/supabase';

const CATEGORIES = [
  'Baking & Cake Decoration',
  'Photography & Videography',
  'Programming & Web Dev',
  'Fitness & Wellness',
  'Music & Instruments',
  'Languages',
  'Art & Painting',
  'Fashion & Design',
  'Cooking & Culinary Arts',
  'Beauty & Makeup',
  'Business & Entrepreneurship',
  'Marketing & Social Media',
  'Writing & Content Creation',
  'Dance & Performing Arts',
  'Sports & Coaching',
  'Finance & Accounting',
  'Personal Development',
  'Home & Garden',
  'Technology & IT',
  'Crafts & DIY',
];

export default function CourseNew() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(false);
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
    if (imageInputRef.current) imageInputRef.current.value = '';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.trainer?.id) {
      toast.error('Trainer profile not found');
      return;
    }
    setLoading(true);
    try {
      let imageUrl: string | null = null;

      if (imageFile) {
        const ext = imageFile.name.split('.').pop();
        const filePath = `courses/${user.trainer.id}/${Date.now()}.${ext}`;
        const { error: uploadError } = await supabase.storage.from('courses').upload(filePath, imageFile, {
          cacheControl: '3600',
          upsert: false,
        });
        if (uploadError) throw new Error(uploadError.message);
        const { data: urlData } = supabase.storage.from('courses').getPublicUrl(filePath);
        imageUrl = urlData.publicUrl;
      }

      const slug = form.title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');
      await createCourse({
        trainerId: user.trainer.id,
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
      navigate('/trainer/courses');
    } catch (err: any) {
      toast.error(err.message || 'Failed to create course');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <Link
        to="/trainer/courses"
        className="inline-flex items-center gap-1.5 text-sm text-primary hover:underline mb-4"
      >
        <ArrowLeft size={16} /> Back to Courses
      </Link>

      <h1 className="text-2xl font-bold text-dark mb-6">Create New Course</h1>

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
              value={form.category}
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
          className="w-full py-2.5 bg-primary text-white font-medium rounded-btn hover:bg-primary/90 disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {loading && <Loader2 size={16} className="animate-spin" />}
          {loading ? 'Creating...' : 'Create Course'}
        </button>
      </form>
    </div>
  );
}
