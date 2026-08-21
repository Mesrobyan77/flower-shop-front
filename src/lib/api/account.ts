import { del, get, patch, post } from './client';
import type { Address, Product, Subscription } from '@/types';

export interface AccountSummary {
  points: number;
  totalSpend: number;
  grade: {
    key: string;
    order: number;
    discountRate: number;
    pointRate: number;
    minSpend: number;
    next: { key: string; minSpend: number } | null;
  };
  orderCount: number;
  activeCount: number;
  wishlistCount: number;
}

export type AddressBody = Omit<Address, 'id'>;

export const accountApi = {
  summary: () => get<AccountSummary>('/account/summary'),

  addresses: () => get<Address[]>('/account/addresses'),
  createAddress: (body: AddressBody) => post<Address>('/account/addresses', body),
  updateAddress: (id: string, body: Partial<AddressBody>) => patch<Address>(`/account/addresses/${id}`, body),
  deleteAddress: (id: string) => del(`/account/addresses/${id}`),

  wishlist: () => get<Product[]>('/account/wishlist'),
  toggleWishlist: (productId: string) =>
    post<{ productId: string; inWishlist: boolean }>(`/account/wishlist/${productId}`, {}),
  recentlyViewed: () => get<Product[]>('/account/recently-viewed'),

  subscriptions: () => get<Subscription[]>('/account/subscriptions'),
  subscribe: (body: {
    planId: string;
    cycle: string;
    recipient: string;
    phone: string;
    region: string;
    city: string;
    street: string;
    building?: string;
    apartment?: string;
    notes?: string;
    startDate?: string;
  }) => post<Subscription>('/account/subscriptions', body),
  setSubscriptionStatus: (id: string, action: 'pause' | 'resume' | 'cancel') =>
    post<Subscription>(`/account/subscriptions/${id}/${action}`, {}),
};
