'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { accountApi, type AddressBody } from '@/lib/api/account';
import { orderApi } from '@/lib/api/commerce';
import { useApiError } from '@/lib/hooks/useApiError';
import { qk } from '@/lib/queryKeys';
import { useAuthStore } from '@/store/auth';
import type { OrderStatus } from '@/types';

export function useAccountSummary() {
  const enabled = Boolean(useAuthStore((s) => s.accessToken));
  return useQuery({ queryKey: qk.accountSummary, queryFn: accountApi.summary, enabled });
}

export function useAddresses() {
  const enabled = Boolean(useAuthStore((s) => s.accessToken));
  return useQuery({ queryKey: qk.addresses, queryFn: accountApi.addresses, enabled });
}

export function useSaveAddress() {
  const client = useQueryClient();
  const showApiError = useApiError();

  return useMutation({
    mutationFn: ({ id, body }: { id?: string; body: AddressBody }) =>
      id ? accountApi.updateAddress(id, body) : accountApi.createAddress(body),
    onSuccess: () => client.invalidateQueries({ queryKey: qk.addresses }),
    onError: (error: Error) => showApiError(error),
  });
}

export function useDeleteAddress() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => accountApi.deleteAddress(id),
    onSuccess: () => client.invalidateQueries({ queryKey: qk.addresses }),
  });
}

export function useWishlist() {
  const enabled = Boolean(useAuthStore((s) => s.accessToken));
  return useQuery({ queryKey: qk.wishlist, queryFn: accountApi.wishlist, enabled });
}

export function useToggleWishlist() {
  const client = useQueryClient();
  const showApiError = useApiError();
  return useMutation({
    mutationFn: (productId: string) => accountApi.toggleWishlist(productId),
    onSuccess: () => client.invalidateQueries({ queryKey: qk.wishlist }),
    onError: (error: Error) => showApiError(error),
  });
}

export function useMyOrders(page = 1, status?: OrderStatus) {
  const enabled = Boolean(useAuthStore((s) => s.accessToken));
  return useQuery({
    queryKey: qk.myOrders(page, status),
    queryFn: () => orderApi.mine({ page, status }),
    enabled,
  });
}

export function useMyOrder(code: string) {
  const enabled = Boolean(useAuthStore((s) => s.accessToken)) && Boolean(code);
  return useQuery({ queryKey: qk.myOrder(code), queryFn: () => orderApi.detail(code), enabled });
}

export function useCancelOrder() {
  const client = useQueryClient();
  const showApiError = useApiError();

  return useMutation({
    mutationFn: ({ code, reason }: { code: string; reason?: string }) => orderApi.cancel(code, reason),
    onSuccess: (order) => {
      client.invalidateQueries({ queryKey: qk.myOrder(order.code) });
      client.invalidateQueries({ queryKey: ['my-orders'] });
    },
    onError: (error: Error) => showApiError(error),
  });
}

export function useSubscriptions() {
  const enabled = Boolean(useAuthStore((s) => s.accessToken));
  return useQuery({ queryKey: qk.subscriptions, queryFn: accountApi.subscriptions, enabled });
}
