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
    isVerified: boolean;
    verificationStatus: string;
    commissionRate: number;
    availableBalance: number;
    averageRating: number;
    totalReviews: number;
    totalStudents: number;
    bio: string | null;
    skills: string[];
  } | null;
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

async function ensureUserRecord(userId: string, email: string, meta: Record<string, any>): Promise<void> {
  const { data: existing } = await supabase.from('User').select('id').eq('id', userId).maybeSingle();
  if (!existing) {
    await supabase
      .from('User')
      .upsert({
        id: userId,
        email: email.toLowerCase().trim(),
        phone: ((meta['phone'] as string) || '').replace(/[^0-9]/g, ''),
        fullName: (meta['full_name'] as string) || email.split('@')[0] || 'User',
        role: (meta['role'] as string) || 'TRAINEE',
        lastLoginAt: new Date().toISOString(),
      })
      .maybeSingle();
  }
}

async function tryCreateTrainer(
  userId: string,
  role: string,
  email?: string,
  meta?: Record<string, any>,
): Promise<{
  id: string;
  isVerified: boolean;
  verificationStatus: string;
  commissionRate: number;
  availableBalance: number;
  averageRating: number;
  totalReviews: number;
  totalStudents: number;
  bio: string | null;
  skills: string[];
} | null> {
  if (role !== 'TRAINER') return null;
  if (email && meta) await ensureUserRecord(userId, email, meta);
  const { data: existing } = await supabase
    .from('Trainer')
    .select(
      'id, isVerified, verificationStatus, commissionRate, availableBalance, averageRating, totalReviews, totalStudents, bio, skills',
    )
    .eq('userId', userId)
    .maybeSingle();
  if (existing) return existing;
  const { data: created } = await supabase
    .from('Trainer')
    .insert({ userId, updatedAt: new Date().toISOString() })
    .select(
      'id, isVerified, verificationStatus, commissionRate, availableBalance, averageRating, totalReviews, totalStudents, bio, skills',
    )
    .maybeSingle();
  return created || null;
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

      const { data: dbUser } = await supabase
        .from('User')
        .select(
          '*, trainer:Trainer!userId(id, isVerified, verificationStatus, commissionRate, availableBalance, averageRating, totalReviews, totalStudents, bio, skills)',
        )
        .eq('id', authUser.id)
        .maybeSingle();

      if (dbUser) {
        let trainer = dbUser.trainer || null;
        if (!trainer && dbUser.role === 'TRAINER') {
          trainer = await tryCreateTrainer(dbUser.id, dbUser.role);
        }
        set({
          user: {
            id: dbUser.id,
            email: dbUser.email,
            phone: dbUser.phone,
            fullName: dbUser.fullName,
            role: dbUser.role,
            avatarUrl: dbUser.avatarUrl,
            trainer,
          },
          isAuthenticated: true,
          isLoading: false,
        });
        return;
      }

      const meta = authUser.user_metadata || {};
      const role = (meta['role'] as string) || 'TRAINEE';
      let trainer: User['trainer'] = null;
      if (role === 'TRAINER') {
        trainer = await tryCreateTrainer(authUser.id, role, authUser.email, meta);
      }
      set({
        user: {
          id: authUser.id,
          email: authUser.email || '',
          phone: (meta['phone'] as string) || '',
          fullName: (meta['full_name'] as string) || authUser.email?.split('@')[0] || 'User',
          role: role as User['role'],
          avatarUrl: null,
          trainer,
        },
        isAuthenticated: true,
        isLoading: false,
      });
    } catch {
      set({ user: null, isAuthenticated: false, isLoading: false });
    }
  },

  login: async (email: string, password: string) => {
    const { data, error: authError } = await supabase.auth.signInWithPassword({ email, password });
    if (authError || !data.user) {
      throw new Error(authError?.message || 'Invalid email or password');
    }

    const { data: dbUser } = await supabase
      .from('User')
      .select(
        '*, trainer:Trainer!userId(id, isVerified, verificationStatus, commissionRate, availableBalance, averageRating, totalReviews, totalStudents, bio, skills)',
      )
      .eq('id', data.user.id)
      .maybeSingle();

    if (dbUser) {
      await supabase
        .from('User')
        .update({ lastLoginAt: new Date().toISOString() })
        .eq('id', data.user.id)
        .maybeSingle();
      let trainer = dbUser.trainer || null;
      if (!trainer && dbUser.role === 'TRAINER') {
        trainer = await tryCreateTrainer(dbUser.id, dbUser.role);
      }
      const user: User = {
        id: dbUser.id,
        email: dbUser.email,
        phone: dbUser.phone,
        fullName: dbUser.fullName,
        role: dbUser.role,
        avatarUrl: dbUser.avatarUrl,
        trainer,
      };
      set({ user, isAuthenticated: true });
      return user;
    }

    const meta = data.user.user_metadata || {};
    const role = (meta['role'] as string) || 'TRAINEE';
    await ensureUserRecord(data.user.id, data.user.email || '', meta);
    let trainer: User['trainer'] = null;
    if (role === 'TRAINER') {
      trainer = await tryCreateTrainer(data.user.id, role, data.user.email, meta);
    }
    const { data: refreshed } = await supabase
      .from('User')
      .select(
        '*, trainer:Trainer!userId(id, isVerified, verificationStatus, commissionRate, availableBalance, averageRating, totalReviews, totalStudents, bio, skills)',
      )
      .eq('id', data.user.id)
      .maybeSingle();
    const user: User = {
      id: data.user.id,
      email: refreshed?.email || data.user.email || '',
      phone: refreshed?.phone || (meta['phone'] as string) || '',
      fullName: refreshed?.fullName || (meta['full_name'] as string) || data.user.email?.split('@')[0] || 'User',
      role: refreshed?.role || (role as User['role']),
      avatarUrl: refreshed?.avatarUrl || null,
      trainer: refreshed?.trainer || trainer,
    };
    set({ user, isAuthenticated: true });
    return user;
  },

  register: async ({ fullName, email, phone, password, role }) => {
    const { data, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName, phone, role },
      },
    });
    if (authError || !data.user) {
      throw new Error(authError?.message || 'Registration failed');
    }

    const meta = { full_name: fullName, phone, role };
    const now = new Date().toISOString();
    await supabase
      .from('User')
      .upsert({
        id: data.user.id,
        email: email.toLowerCase().trim(),
        phone: phone.replace(/[^0-9]/g, ''),
        fullName: fullName.trim(),
        role: role || 'TRAINEE',
        lastLoginAt: now,
      })
      .maybeSingle();

    const trainer = await tryCreateTrainer(data.user.id, role, email, meta);

    const user: User = {
      id: data.user.id,
      email: email.toLowerCase().trim(),
      phone: phone.replace(/[^0-9]/g, ''),
      fullName: fullName.trim(),
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
