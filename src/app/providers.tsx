'use client';

import { QueryClient, QueryClientProvider, useQueryClient } from '@tanstack/react-query';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState, type ReactNode } from 'react';
import { ApiClientError, setUnauthorizedHandler } from '@/lib/api/client';
import { getLocalizedApiError } from '@/lib/api/errors';
import { normalizeLocale } from '@/lib/i18n';
import { useSyncSession } from '@/lib/hooks/useAuth';
import { qk } from '@/lib/queryKeys';
import { useAuthStore } from '@/store/auth';
import { useUiStore } from '@/store/ui';
import { ToastHost } from '@/components/ui/Feedback';
import { ImageGuard } from '@/components/ui/ImageGuard';

function makeQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 30_000,
        gcTime: 5 * 60_000,
        refetchOnWindowFocus: false,
        retry: (failureCount, error) => {
          // 4xx responses are the server saying "do not retry".
          if (error instanceof ApiClientError && error.status >= 400 && error.status < 500) return false;
          return failureCount < 2;
        },
      },
      mutations: { retry: 0 },
    },
  });
}

function SessionBridge({ children }: { children: ReactNode }) {
  const clear = useAuthStore((s) => s.clear);
  const accessToken = useAuthStore((s) => s.accessToken);
  const client = useQueryClient();
  const router = useRouter();
  const pathname = usePathname();
  const notify = useUiStore((s) => s.notify);

  useSyncSession();

  useEffect(() => {
    setUnauthorizedHandler(() => {
      clear();
      // Providers sit outside [locale], so the segment is read from the path
      // (admin routes are unprefixed and resolve to the default locale).
      const locale = normalizeLocale(pathname?.split('/').filter(Boolean)[0]);
      notify(getLocalizedApiError({ message: '', status: 401, code: 'TOKEN_EXPIRED' }, locale), 'error');
      router.refresh();
    });
    return () => setUnauthorizedHandler(null);
  }, [clear, router, pathname, notify]);

  // The identity behind the cart changes with the access token (bootstrap
  // resolving on load, silent rotation, sign-out): refetch so the badge and
  // the checkout summary never keep showing the other identity's basket.
  useEffect(() => {
    client.invalidateQueries({ queryKey: qk.cart });
  }, [accessToken, client]);

  return <>{children}</>;
}

export function Providers({ children }: { children: ReactNode }) {
  const [client] = useState(makeQueryClient);

  return (
    <QueryClientProvider client={client}>
      <SessionBridge>{children}</SessionBridge>
      <ImageGuard />
      <ToastHost />
    </QueryClientProvider>
  );
}
