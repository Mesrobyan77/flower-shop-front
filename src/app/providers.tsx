'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { useEffect, useState, type ReactNode } from 'react';
import { ApiClientError, setUnauthorizedHandler } from '@/lib/api/client';
import { useSyncSession } from '@/lib/hooks/useAuth';
import { useAuthStore } from '@/store/auth';
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
  const router = useRouter();

  useSyncSession();

  useEffect(() => {
    setUnauthorizedHandler(() => {
      clear();
      router.refresh();
    });
    return () => setUnauthorizedHandler(null);
  }, [clear, router]);

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
