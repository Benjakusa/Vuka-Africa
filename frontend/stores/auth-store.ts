import { create } from 'zustand';

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

async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(path, {
    credentials: 'include',
    headers: { 'Content-Type': 'application/json', ...options?.headers },
    ...options,
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({ error: { message: 'Unknown error' } }));
    throw new Error(body.error?.message || 'Request failed');
  }
  return res.json();
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isLoading: true,
  isAuthenticated: false,

  setUser: (user) => set({ user, isAuthenticated: !!user }),

  checkAuth: async () => {
    try {
      const res = await apiFetch<{ data: User }>('/api/auth/me');
      set({ user: res.data, isAuthenticated: true, isLoading: false });
    } catch {
      set({ user: null, isAuthenticated: false, isLoading: false });
    }
  },

  logout: async () => {
    try {
      await apiFetch('/api/auth/logout', { method: 'POST' });
    } catch {}
    set({ user: null, isAuthenticated: false });
  },
}));
