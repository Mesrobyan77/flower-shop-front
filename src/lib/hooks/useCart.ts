'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { cartApi, type AddToCartBody } from '@/lib/api/commerce';
import { useApiError } from '@/lib/hooks/useApiError';
import { qk } from '@/lib/queryKeys';
import type { Cart } from '@/types';

export function useCart() {
  return useQuery({
    queryKey: qk.cart,
    queryFn: cartApi.get,
    staleTime: 15_000,
  });
}

export function useCartCount(): number {
  const { data } = useCart();
  return data?.items.reduce((acc, item) => acc + item.quantity, 0) ?? 0;
}

export function useAddToCart() {
  const client = useQueryClient();
  const showApiError = useApiError();

  return useMutation({
    mutationFn: (body: AddToCartBody) => cartApi.add(body),
    onSuccess: (cart: Cart) => {
      client.setQueryData(qk.cart, cart);
    },
    onError: (error: Error) => showApiError(error),
  });
}

export function useUpdateCartItem() {
  const client = useQueryClient();
  const showApiError = useApiError();

  return useMutation({
    mutationFn: ({ itemId, ...body }: { itemId: string; quantity?: number }) => cartApi.update(itemId, body),
    // Quantity steppers must feel instant; the server response reconciles after.
    onMutate: async ({ itemId, quantity }) => {
      if (quantity === undefined) return;
      await client.cancelQueries({ queryKey: qk.cart });
      const previous = client.getQueryData<Cart>(qk.cart);

      if (previous) {
        client.setQueryData<Cart>(qk.cart, {
          ...previous,
          items: previous.items.map((item) =>
            item.id === itemId
              ? {
                  ...item,
                  quantity,
                  lineTotal: (item.unitPrice + item.optionsTotal / Math.max(1, item.quantity)) * quantity,
                }
              : item,
          ),
        });
      }
      return { previous };
    },
    onError: (error: Error, _vars, context) => {
      if (context?.previous) client.setQueryData(qk.cart, context.previous);
      showApiError(error);
    },
    onSuccess: (cart: Cart) => client.setQueryData(qk.cart, cart),
    onSettled: () => client.invalidateQueries({ queryKey: qk.cart }),
  });
}

export function useRemoveCartItem() {
  const client = useQueryClient();
  const showApiError = useApiError();

  return useMutation({
    mutationFn: (itemId: string) => cartApi.remove(itemId),
    onSuccess: (cart: Cart) => client.setQueryData(qk.cart, cart),
    onError: (error: Error) => showApiError(error),
  });
}

export function useClearCart() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: () => cartApi.clear(),
    onSuccess: (cart: Cart) => client.setQueryData(qk.cart, cart),
  });
}
