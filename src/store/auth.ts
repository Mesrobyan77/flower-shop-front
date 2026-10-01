'use client';

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { refreshAccessToken, setAccessToken } from '@/lib/api/client';
import type { User } from '@/types';

interface AuthState {
  user: User | null;
  accessToken: string | null;
  hydrated: boolean;
  bootstrapping: boolean;
  setSession: (user: User, accessToken: string) => void;
  setUser: (user: User | null) => void;
  clear: () => void;
  markHydrated: () => void;
}

const PERSIST_KEY = 'xf-auth';

type PersistedAuth = Pick<AuthState, 'user'>;

/** Deletes any access token legacy builds wrote into the persisted entry. */
function scrubLegacyToken() {
  if (typeof window === 'undefined') return;
  try {
    const raw = window.localStorage.getItem(PERSIST_KEY);
    if (!raw) return;
    const parsed = JSON.parse(raw) as { state?: Record<string, unknown> };
    if (parsed?.state && 'accessToken' in parsed.state) {
      delete parsed.state.accessToken;
      window.localStorage.setItem(PERSIST_KEY, JSON.stringify(parsed));
    }
  } catch {
    // A corrupt entry is irrelevant: the store re-initialises on top of it.
  }
}

/**
 * Exchanges the HttpOnly refresh cookie for a fresh in-memory access token.
 * Runs once per page load when a persisted user suggests a live session; it
 * never touches storage, so the token only exists in memory.
 */
async function bootstrapSession() {
  if (typeof window === 'undefined') return;
  const { user, accessToken } = useAuthStore.getState();
  if (accessToken || !user) return;

  useAuthStore.setState({ bootstrapping: true });
  const token = await refreshAccessToken();
  if (token) {
    setAccessToken(token);
    useAuthStore.setState({ accessToken: token, bootstrapping: false });
  } else {
    useAuthStore.getState().clear();
  }
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      accessToken: null,
      hydrated: false,
      bootstrapping: false,

      setSession: (user, accessToken) => {
        setAccessToken(accessToken);
        set({ user, accessToken, bootstrapping: false });
      },

      setUser: (user) => set({ user }),

      clear: () => {
        setAccessToken(null);
        set({ user: null, accessToken: null, bootstrapping: false });
      },

      markHydrated: () => set({ hydrated: true }),
    }),
    {
      name: PERSIST_KEY,
      storage: createJSONStorage(() => 
        typeof window !== 'undefined' ? localStorage : ({} as Storage)
      ),
      version: 2,
      // v0/v1 persisted the access token; sessions are now restored through the
      // refresh-cookie bootstrap, so a legacy token must never re-enter state.
      migrate: (persisted) => {
        if (persisted && typeof persisted === 'object') {
          const state = { ...(persisted as Record<string, unknown>) };
          delete state.accessToken;
          return state as PersistedAuth;
        }
        return persisted as PersistedAuth;
      },
      partialize: (state) => ({ user: state.user }),
      onRehydrateStorage: () => (state) => {
        scrubLegacyToken();
        state?.markHydrated();
        // Deferred so the store const is fully initialised before it is used.
        queueMicrotask(() => void bootstrapSession());
      },
    },
  ),
);

export const useCurrentUser = () => useAuthStore((s) => s.user);
export const useIsAdmin = () => useAuthStore((s) => s.user?.role === 'admin');
