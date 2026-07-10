import { useState, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Loader2, Upload, X, Plus } from 'lucide-react';
import { toast } from 'sonner';
import { useAuthStore } from '@/stores/auth-store';
import { getMyTrainerProfile, updateTrainerProfile } from '@/services/trainerService';
import { supabase } from '@/lib/supabase';
import { CardSkeleton } from '@/components/shared/loading-skeleton';

export default function ProfileEdit() {
  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  const coverInputRef = useRef<HTMLInputElement>(null);
  const avatarInputRef = useRef<HTMLInputElement>(null);

  const [bio, setBio] = useState('');
  const [skills, setSkills] = useState<string[]>([]);
  const [skillInput, setSkillInput] = useState('');
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [coverPreview, setCoverPreview] = useState<string | null>(null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);

  const { data: profile, isLoading } = useQuery({
    queryKey: ['trainer', 'profile-edit', user?.id],
    queryFn: async () => {
      const p = await getMyTrainerProfile(user!.id);
      if (p) {
        setBio(p.bio || '');
        setSkills(p.skills || []);
        if (p.coverPhoto) setCoverPreview(p.coverPhoto);
      }
      if (user?.avatarUrl) setAvatarPreview(user.avatarUrl);
      return p;
    },
    enabled: !!user?.id,
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
      let coverPhoto = profile?.coverPhoto || null;
      if (coverFile) {
        const reader = new FileReader();
        coverPhoto = await new Promise<string>((resolve) => {
          reader.onload = () => resolve(reader.result as string);
          reader.readAsDataURL(coverFile);
        });
      }
      let avatarUrl = user?.avatarUrl || null;
      if (avatarFile) {
        const reader = new FileReader();
        avatarUrl = await new Promise<string>((resolve) => {
          reader.onload = () => resolve(reader.result as string);
          reader.readAsDataURL(avatarFile);
        });
        await supabase.from('User').update({ avatarUrl }).eq('id', user!.id);
      }
      return updateTrainerProfile(profile!.id, { bio, skills, coverPhoto });
    },
    onSuccess: () => {
      toast.success('Profile updated successfully');
      queryClient.invalidateQueries({ queryKey: ['trainer', 'profile-edit', user?.id] });
      useAuthStore.getState().checkAuth();
    },
    onError: (err: any) => toast.error(err.message || 'Failed to update profile'),
  });

  const addSkill = () => {
    const trimmed = skillInput.trim();
    if (!trimmed) return;
    if (skills.includes(trimmed)) {
      toast.error('Skill already added');
      return;
    }
    setSkills([...skills, trimmed]);
    setSkillInput('');
  };

  const removeSkill = (s: string) => setSkills(skills.filter((x) => x !== s));

  const handleFile = (file: File, type: 'cover' | 'avatar') => {
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image too large. Max 5MB');
      return;
    }
    const url = URL.createObjectURL(file);
    if (type === 'cover') {
      setCoverFile(file);
      setCoverPreview(url);
    } else {
      setAvatarFile(file);
      setAvatarPreview(url);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile?.id) {
      let { data: newTrainer } = await supabase.from('Trainer').select('id').eq('userId', user!.id).maybeSingle();
      if (!newTrainer) {
        const r = await supabase.from('Trainer').insert({ userId: user!.id, updatedAt: new Date().toISOString() }).select('id').maybeSingle();
        newTrainer = r.data ?? null;
      }
      if (!newTrainer) {
        toast.error('Trainer profile not found — please contact support');
        return;
      }
      useAuthStore.getState().checkAuth();
      await new Promise((r) => setTimeout(r, 500));
      window.location.reload();
      return;
    }
    saveMutation.mutate();
  };

  if (isLoading)
    return (
      <div className="max-w-2xl mx-auto">
        <CardSkeleton />
      </div>
    );

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold text-dark mb-6">Edit Profile</h1>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-white rounded-card shadow-card overflow-hidden">
          <div onClick={() => coverInputRef.current?.click()} className="h-40 bg-surface cursor-pointer relative group">
            {coverPreview ? (
              <img src={coverPreview} alt="Cover" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-body-foreground">
                <Upload size={24} />
              </div>
            )}
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center">
              <span className="text-white text-sm font-medium opacity-0 group-hover:opacity-100">
                Change Cover Photo
              </span>
            </div>
            <input
              ref={coverInputRef}
              type="file"
              accept="image/*"
              onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0], 'cover')}
              className="hidden"
            />
          </div>

          <div className="px-6 pb-6 -mt-12 flex items-end gap-4">
            <div
              onClick={() => avatarInputRef.current?.click()}
              className="w-24 h-24 rounded-full border-4 border-white bg-surface flex items-center justify-center text-primary text-3xl font-bold flex-shrink-0 cursor-pointer relative group overflow-hidden"
            >
              {avatarPreview ? (
                <img src={avatarPreview} alt="Avatar" className="w-full h-full object-cover" />
              ) : (
                user?.fullName?.[0]
              )}
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                <Upload size={16} className="text-white opacity-0 group-hover:opacity-100" />
              </div>
              <input
                ref={avatarInputRef}
                type="file"
                accept="image/*"
                onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0], 'avatar')}
                className="hidden"
              />
            </div>
            <div className="pb-1">
              <h2 className="text-lg font-bold text-dark">{user?.fullName}</h2>
              <p className="text-sm text-body-foreground">Trainer</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-card shadow-card p-6 space-y-4">
          <div>
            <label className="text-sm font-medium text-dark mb-1 block">Bio</label>
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              rows={4}
              className="w-full px-3 py-2.5 border border-border rounded-btn text-sm resize-none"
              placeholder="Tell students about yourself, your experience, and what you teach..."
            />
          </div>

          <div>
            <label className="text-sm font-medium text-dark mb-1 block">Expertise</label>
            <div className="flex flex-wrap gap-2 mb-2">
              {skills.map((s) => (
                <span
                  key={s}
                  className="inline-flex items-center gap-1 px-3 py-1 bg-surface text-primary text-sm rounded-full"
                >
                  {s}
                  <button type="button" onClick={() => removeSkill(s)} className="hover:text-primary">
                    <X size={12} />
                  </button>
                </span>
              ))}
            </div>
            <div className="flex gap-2">
              <input
                value={skillInput}
                onChange={(e) => setSkillInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    addSkill();
                  }
                }}
                className="flex-1 px-3 py-2 border border-border rounded-btn text-sm"
                placeholder="Type a skill and press Enter or Add"
              />
              <button
                type="button"
                onClick={addSkill}
                className="px-3 py-2 bg-primary text-white rounded-btn text-sm hover:bg-surface"
              >
                <Plus size={16} />
              </button>
            </div>
          </div>
        </div>

        <button
          type="submit"
          disabled={saveMutation.isPending}
          className="w-full py-2.5 bg-primary text-white font-medium rounded-btn hover:bg-surface disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {saveMutation.isPending && <Loader2 size={16} className="animate-spin" />}
          {saveMutation.isPending ? 'Saving...' : 'Save Profile'}
        </button>
      </form>
    </div>
  );
}
