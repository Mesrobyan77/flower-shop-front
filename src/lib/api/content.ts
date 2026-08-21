import { get, getPaged } from './client';
import type { AppConfig, Post, PostType, StoreSettings, SubscriptionPlan } from '@/types';

export const contentApi = {
  config: () => get<AppConfig>('/config'),
  settings: () => get<StoreSettings>('/settings'),
  posts: (params: { type?: PostType; page?: number; limit?: number; tag?: string; q?: string } = {}) =>
    getPaged<Post>('/posts', params),
  post: (slug: string) => get<Post>(`/posts/${slug}`),
  plans: () => get<SubscriptionPlan[]>('/subscription-plans'),
};
