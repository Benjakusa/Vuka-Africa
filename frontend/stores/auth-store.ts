import { create } from 'zustand';
import { api } from '@backend/lib/api';

export interface User {
  id: string;
  email: string;
  phone: string;
  fullName: string;
  role: 'TRAINEE' | 'TRAINER' | 'ADMIN';
  emailVerified: boolean;
  avatarUrl: string | null;
  trainer?: {
    id: string;
    isVerified: boolean;
    verificationStatus: string;
    commissionRate: number;
    availableBalance: number;
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
  logout: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  isLoading: true,
  isAuthenticated: false,

  setUser: (user) => set({ user, isAuthenticated: !!user }),

  checkAuth: async () => {
    try {
      const res = await api.get<{ data: User }>('/auth/me');
      set({ user: res.data, isAuthenticated: true, isLoading: false });
    } catch {
      try {
        const res = await api.post<{ data: User }>('/auth/refresh');
        set({ user: res.data, isAuthenticated: true, isLoading: false });
      } catch {
        set({ user: null, isAuthenticated: false, isLoading: false });
      }
    }
  },

  logout: async () => {
    try {
      await api.post('/auth/logout');
    } catch {}
    set({ user: null, isAuthenticated: false });
  },
}));
