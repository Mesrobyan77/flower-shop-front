'use client';

import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { catalogApi, type ProductListParams } from '@/lib/api/catalog';
import { contentApi } from '@/lib/api/content';
import { deliveryApi } from '@/lib/api/commerce';
import { qk } from '@/lib/queryKeys';

export function useProducts(params: ProductListParams) {
  return useQuery({
    queryKey: qk.products(params),
    queryFn: () => catalogApi.products(params),
    placeholderData: keepPreviousData,
    staleTime: 60_000,
  });
}

export function useCategories(navOnly = false) {
  return useQuery({
    queryKey: qk.categories(navOnly),
    queryFn: () => catalogApi.categories(navOnly),
    staleTime: 10 * 60_000,
  });
}

export function useProduct(slug: string) {
  return useQuery({
    queryKey: qk.product(slug),
    queryFn: () => catalogApi.product(slug),
    staleTime: 60_000,
  });
}

export function useProductReviews(slug: string, page = 1) {
  return useQuery({
    queryKey: qk.productReviews(slug, page),
    queryFn: () => catalogApi.reviews(slug, { page, limit: 5 }),
    placeholderData: keepPreviousData,
  });
}

export function useProductInquiries(slug: string, page = 1) {
  return useQuery({
    queryKey: qk.productInquiries(slug, page),
    queryFn: () => catalogApi.inquiries(slug, { page, limit: 5 }),
    placeholderData: keepPreviousData,
  });
}

export function useAppConfig() {
  return useQuery({ queryKey: qk.config, queryFn: contentApi.config, staleTime: Infinity });
}

export function useStoreSettings() {
  return useQuery({ queryKey: qk.settings, queryFn: contentApi.settings, staleTime: 10 * 60_000 });
}

export function useDeliveryOptions() {
  return useQuery({ queryKey: qk.deliveryOptions, queryFn: deliveryApi.options, staleTime: 5 * 60_000 });
}
