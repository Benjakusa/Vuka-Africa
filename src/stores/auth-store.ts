import { create } from 'zustand';
import { supabase } from '@/lib/supabase';

export interface User {
  id: string;
  email: string;
  phone: string;
  fullName: string;
  role: 'TRAINEE' | 'TRAINER' | 'ADMIN';
  avatarUrl: string | null;
  trainer?: {
    id: string;
    userId: string;
    isVerified: boolean;
    verificationStatus: string;
    verificationFeePaid: boolean;
    verificationFeeAmount: number;
    commissionRate: number;
    availableBalance: number;
    averageRating: number;
    totalReviews: number;
    totalStudents: number;
    bio: string | null;
    skills: string[];
    coverPhoto: string | null;
    idDocumentUrl: string | null;
    kraPinUrl: string | null;
    passportPhotoUrl: string | null;
    verificationVideoUrl: string | null;
    location: string | null;
    alternativeContact: string | null;
    createdAt: string;
    updatedAt: string;
  } | null;
}

const TRAINER_FIELDS =
  'id, userId, isVerified, verificationStatus, verificationFeePaid, verificationFeeAmount, verificationVideoUrl, commissionRate, availableBalance, averageRating, totalReviews, totalStudents, bio, skills, coverPhoto, idDocumentUrl, kraPinUrl, passportPhotoUrl, location, alternativeContact, createdAt, updatedAt';

function extractTrainer(val: unknown) {
  if (!val) return null;
  if (Array.isArray(val)) return (val as any[])[0] || null;
  return val as any;
}

interface AuthState {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  setUser: (user: User | null) => void;
  checkAuth: () => Promise<void>;
  login: (email: string, password: string) => Promise<User>;
  register: (data: { fullName: string; email: string; phone: string; password: string; role: string }) => Promise<User>;
  logout: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isLoading: true,
  isAuthenticated: false,

  setUser: (user) => set({ user, isAuthenticated: !!user }),

  checkAuth: async () => {
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) {
        set({ user: null, isAuthenticated: false, isLoading: false });
        return;
      }
      const {
        data: { user: authUser },
      } = await supabase.auth.getUser();
      if (!authUser) {
        set({ user: null, isAuthenticated: false, isLoading: false });
        return;
      }

      let { data: dbUser, error: userErr } = await supabase
        .from('User')
        .select(`*, trainer:Trainer(${TRAINER_FIELDS})`)
        .eq('id', authUser.id)
        .maybeSingle();
      if (userErr) console.error('checkAuth/User:', userErr);

      if (!dbUser) {
        const meta = authUser.user_metadata || {};
        const role = (meta['role'] as string) || 'TRAINEE';
        const now = new Date().toISOString();
        const { error: upsertErr } = await supabase
          .from('User')
          .upsert({
            id: authUser.id,
            email: (authUser.email || '').toLowerCase().trim(),
            phone: ((meta['phone'] as string) || '').replace(/[^0-9]/g, ''),
            fullName: (meta['full_name'] as string) || authUser.email?.split('@')[0] || 'User',
            role,
            lastLoginAt: now,
            updatedAt: now,
          })
          .maybeSingle();
        if (upsertErr) console.error('checkAuth/User-upsert:', upsertErr);

        let trainer = null;
        if (role === 'TRAINER') {
          const { data: existing } = await supabase
            .from('Trainer')
            .select(TRAINER_FIELDS)
            .eq('userId', authUser.id)
            .maybeSingle();
          if (existing) {
            trainer = extractTrainer(existing);
          } else {
            const { data: inserted, error: insErr } = await supabase
              .from('Trainer')
              .insert({ userId: authUser.id, updatedAt: now })
              .select(TRAINER_FIELDS)
              .maybeSingle();
            if (insErr) console.error('checkAuth/Trainer-insert:', insErr);
            trainer = extractTrainer(inserted);
          }
        }
        dbUser = {
          id: authUser.id,
          email: authUser.email,
          phone: meta['phone'] || '',
          fullName: meta['full_name'] || '',
          role,
          avatarUrl: null,
          trainer,
        } as any;
      } else {
        const now = new Date().toISOString();
        await supabase.from('User').update({ lastLoginAt: now, updatedAt: now }).eq('id', authUser.id).maybeSingle();

        let trainer = extractTrainer((dbUser as any).trainer);
        if (!trainer && dbUser.role === 'TRAINER') {
          const { data: inserted, error: insErr } = await supabase
            .from('Trainer')
            .insert({ userId: dbUser.id, updatedAt: now })
            .select(TRAINER_FIELDS)
            .maybeSingle();
          if (insErr) console.error('checkAuth/Trainer-insert2:', insErr);
          trainer = extractTrainer(inserted);
        }
        dbUser = { ...dbUser, trainer };
      }

      if (!dbUser) {
        set({ user: null, isAuthenticated: false, isLoading: false });
        return;
      }

      set({
        user: {
          id: dbUser.id,
          email: dbUser.email,
          phone: dbUser.phone,
          fullName: dbUser.fullName,
          role: dbUser.role,
          avatarUrl: dbUser.avatarUrl,
          trainer: extractTrainer(dbUser.trainer),
        },
        isAuthenticated: true,
        isLoading: false,
      });
    } catch (err) {
      console.error('checkAuth error:', err);
      set({ user: null, isAuthenticated: false, isLoading: false });
    }
  },

  login: async (email: string, password: string) => {
    const { data, error: authError } = await supabase.auth.signInWithPassword({ email, password });
    if (authError || !data.user) throw new Error(authError?.message || 'Invalid email or password');

    let { data: dbUser } = await supabase
      .from('User')
      .select(`*, trainer:Trainer(${TRAINER_FIELDS})`)
      .eq('id', data.user.id)
      .maybeSingle();

    const now = new Date().toISOString();

    if (!dbUser) {
      const meta = data.user.user_metadata || {};
      const role = (meta['role'] as string) || 'TRAINEE';
      await supabase
        .from('User')
        .upsert({
          id: data.user.id,
          email: (data.user.email || '').toLowerCase().trim(),
          phone: ((meta['phone'] as string) || '').replace(/[^0-9]/g, ''),
          fullName: (meta['full_name'] as string) || data.user.email?.split('@')[0] || 'User',
          role,
          lastLoginAt: now,
          updatedAt: now,
        })
        .maybeSingle();

      let trainer = null;
      if (role === 'TRAINER') {
        const { data: existing } = await supabase
          .from('Trainer')
          .select(TRAINER_FIELDS)
          .eq('userId', data.user.id)
          .maybeSingle();
        if (existing) {
          trainer = extractTrainer(existing);
        } else {
          const { data: inserted } = await supabase
            .from('Trainer')
            .insert({ userId: data.user.id, updatedAt: now })
            .select(TRAINER_FIELDS)
            .maybeSingle();
          trainer = extractTrainer(inserted);
        }
      }
      dbUser = {
        id: data.user.id,
        email: data.user.email,
        phone: meta['phone'] || '',
        fullName: meta['full_name'] || '',
        role,
        avatarUrl: null,
        trainer,
      } as any;
    } else {
      await supabase.from('User').update({ lastLoginAt: now, updatedAt: now }).eq('id', data.user.id).maybeSingle();

      let trainer = extractTrainer((dbUser as any).trainer);
      if (!trainer && dbUser.role === 'TRAINER') {
        const { data: t } = await supabase
          .from('Trainer')
          .insert({ userId: dbUser.id, updatedAt: now })
          .select(TRAINER_FIELDS)
          .maybeSingle();
        trainer = extractTrainer(t);
      }
      dbUser = { ...dbUser, trainer };
    }

    const user: User = {
      id: dbUser.id,
      email: dbUser.email,
      phone: dbUser.phone,
      fullName: dbUser.fullName,
      role: dbUser.role,
      avatarUrl: dbUser.avatarUrl,
      trainer: extractTrainer(dbUser.trainer),
    };
    set({ user, isAuthenticated: true });
    return user;
  },

  register: async ({ fullName, email, phone, password, role }) => {
    const { data, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: fullName, phone, role } },
    });
    if (authError || !data.user) throw new Error(authError?.message || 'Registration failed');

    const now = new Date().toISOString();
    const cleanPhone = phone.replace(/[^0-9]/g, '');
    const cleanEmail = email.toLowerCase().trim();
    const cleanName = fullName.trim();

    await supabase
      .from('User')
      .upsert({
        id: data.user.id,
        email: cleanEmail,
        phone: cleanPhone,
        fullName: cleanName,
        role: role || 'TRAINEE',
        lastLoginAt: now,
        updatedAt: now,
      })
      .maybeSingle();

    let trainer = null;
    if (role === 'TRAINER') {
      let { data: t } = await supabase.from('Trainer').select(TRAINER_FIELDS).eq('userId', data.user.id).maybeSingle();
      if (!t) {
        const { data: inserted } = await supabase
          .from('Trainer')
          .insert({ userId: data.user.id, updatedAt: now })
          .select(TRAINER_FIELDS)
          .maybeSingle();
        t = inserted;
      }
      trainer = t || null;
    }

    const user: User = {
      id: data.user.id,
      email: cleanEmail,
      phone: cleanPhone,
      fullName: cleanName,
      role: (role as User['role']) || 'TRAINEE',
      avatarUrl: null,
      trainer,
    };
    set({ user, isAuthenticated: true });
    return user;
  },

  logout: async () => {
    await supabase.auth.signOut();
    set({ user: null, isAuthenticated: false });
  },
}));
