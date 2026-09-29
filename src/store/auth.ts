'use client';

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { setAccessToken } from '@/lib/api/client';
import type { User } from '@/types';

interface AuthState {
  user: User | null;
  accessToken: string | null;
  hydrated: boolean;
  setSession: (user: User, accessToken: string) => void;
  setUser: (user: User | null) => void;
  clear: () => void;
  markHydrated: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      accessToken: null,
      hydrated: false,

      setSession: (user, accessToken) => {
        setAccessToken(accessToken);
        set({ user, accessToken });
      },

      setUser: (user) => set({ user }),

      clear: () => {
        setAccessToken(null);
        set({ user: null, accessToken: null });
      },

      markHydrated: () => set({ hydrated: true }),
    }),
    {
      name: 'xf-auth',
      storage: createJSONStorage(() => 
        typeof window !== 'undefined' ? localStorage : ({} as Storage)
      ),
      partialize: (state) => ({ user: state.user, accessToken: state.accessToken }),
      onRehydrateStorage: () => (state) => {
        if (state?.accessToken) setAccessToken(state.accessToken);
        state?.markHydrated();
      },
    },
  ),
);

export const useCurrentUser = () => useAuthStore((s) => s.user);
export const useIsAdmin = () => useAuthStore((s) => s.user?.role === 'admin');