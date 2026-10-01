'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { authApi } from '@/lib/api/auth';
import { qk } from '@/lib/queryKeys';
import { useAuthStore } from '@/store/auth';
import { useUiStore } from '@/store/ui';

export function useSession() {
  const { user, accessToken, hydrated, bootstrapping } = useAuthStore();
  return { user, isAuthenticated: Boolean(user && accessToken), hydrated, booting: bootstrapping };
}

/** Revalidates the cached user against the API once the app mounts. */
export function useSyncSession() {
  const { accessToken, setUser, clear } = useAuthStore();

  return useQuery({
    queryKey: qk.me,
    queryFn: async () => {
      try {
        const user = await authApi.me();
        setUser(user);
        return user;
      } catch {
        clear();
        return null;
      }
    },
    enabled: Boolean(accessToken),
    staleTime: 5 * 60_000,
    retry: false,
  });
}

export function useLogin() {
  const setSession = useAuthStore((s) => s.setSession);
  const client = useQueryClient();

  return useMutation({
    mutationFn: authApi.login,
    onSuccess: (data) => {
      setSession(data.user, data.accessToken);
      client.invalidateQueries({ queryKey: qk.cart });
      client.invalidateQueries({ queryKey: qk.me });
    },
  });
}

export function useRegister() {
  const setSession = useAuthStore((s) => s.setSession);
  const client = useQueryClient();

  return useMutation({
    mutationFn: authApi.register,
    onSuccess: (data) => {
      setSession(data.user, data.accessToken);
      client.invalidateQueries({ queryKey: qk.cart });
    },
  });
}

export function useLogout(locale: string) {
  const clear = useAuthStore((s) => s.clear);
  const client = useQueryClient();
  const router = useRouter();
  const notify = useUiStore((s) => s.notify);

  return useMutation({
    mutationFn: authApi.logout,
    onSettled: () => {
      clear();
      client.clear();
      router.push(`/${locale}`);
      router.refresh();
      notify('OK', 'info');
    },
  });
}
