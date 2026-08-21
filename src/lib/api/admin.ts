import { del, get, getPaged, patch, post, upload } from './client';
import type {
  AdminStats,
  Category,
  Collection,
  Inquiry,
  Order,
  OrderStatus,
  PaymentStatus,
  Post,
  Product,
  Review,
  StoreSettings,
  User,
} from '@/types';

export interface MediaItem {
  id: string;
  key: string;
  url: string;
  originalName: string;
  mimeType: string;
  size: number;
  folder: string;
  createdAt: string;
}

export const adminApi = {
  stats: () => get<AdminStats>('/admin/stats'),

  /* products */
  products: (params: { page?: number; limit?: number; q?: string; sort?: string } = {}) =>
    getPaged<Product>('/admin/products', params),
  product: (id: string) => get<Product>(`/admin/products/${id}`),
  createProduct: (body: Record<string, unknown>) => post<Product>('/admin/products', body),
  updateProduct: (id: string, body: Record<string, unknown>) => patch<Product>(`/admin/products/${id}`, body),
  deleteProduct: (id: string) => del(`/admin/products/${id}`),

  /* categories */
  categories: () => get<Category[]>('/admin/categories'),
  createCategory: (body: Record<string, unknown>) => post<Category>('/admin/categories', body),
  updateCategory: (id: string, body: Record<string, unknown>) => patch<Category>(`/admin/categories/${id}`, body),
  deleteCategory: (id: string) => del(`/admin/categories/${id}`),

  /* collections */
  collections: () => get<Collection[]>('/admin/collections'),
  createCollection: (body: Record<string, unknown>) => post<Collection>('/admin/collections', body),
  updateCollection: (id: string, body: Record<string, unknown>) =>
    patch<Collection>(`/admin/collections/${id}`, body),
  deleteCollection: (id: string) => del(`/admin/collections/${id}`),

  /* orders */
  orders: (
    params: { page?: number; limit?: number; status?: OrderStatus; paymentStatus?: PaymentStatus; q?: string } = {},
  ) => getPaged<Order>('/admin/orders', params),
  order: (id: string) => get<Order>(`/admin/orders/${id}`),
  setOrderStatus: (id: string, status: OrderStatus, note?: string) =>
    patch<Order>(`/admin/orders/${id}/status`, { status, note }),
  setPaymentStatus: (id: string, paymentStatus: PaymentStatus) =>
    patch<Order>(`/admin/orders/${id}/payment`, { paymentStatus }),
  setOrderNote: (id: string, adminNote: string) => patch<Order>(`/admin/orders/${id}/note`, { adminNote }),

  /* users */
  users: (params: { page?: number; limit?: number; q?: string; role?: string } = {}) =>
    getPaged<User>('/admin/users', params),
  user: (id: string) => get<{ user: User; orders: Order[]; subscriptions: unknown[] }>(`/admin/users/${id}`),
  setUserRole: (id: string, role: 'user' | 'admin') => patch<User>(`/admin/users/${id}/role`, { role }),
  setUserActive: (id: string, isActive: boolean) => patch<User>(`/admin/users/${id}/active`, { isActive }),

  /* content */
  posts: (params: { page?: number; type?: string } = {}) => getPaged<Post>('/admin/posts', params),
  createPost: (body: Record<string, unknown>) => post<Post>('/admin/posts', body),
  updatePost: (id: string, body: Record<string, unknown>) => patch<Post>(`/admin/posts/${id}`, body),
  deletePost: (id: string) => del(`/admin/posts/${id}`),

  reviews: (params: { page?: number; approved?: boolean } = {}) => getPaged<Review>('/admin/reviews', params),
  setReviewApproval: (id: string, isApproved: boolean) =>
    patch<Review>(`/admin/reviews/${id}/approval`, { isApproved }),

  inquiries: (params: { page?: number; status?: string } = {}) => getPaged<Inquiry>('/admin/inquiries', params),
  answerInquiry: (id: string, body: string) => post<Inquiry>(`/admin/inquiries/${id}/answer`, { body }),

  /* media */
  media: (params: { page?: number; folder?: string } = {}) => getPaged<MediaItem>('/admin/media', params),
  uploadMedia: (files: File[], folder = 'products') => {
    const form = new FormData();
    files.forEach((file) => form.append('files', file));
    form.append('folder', folder);
    return upload<MediaItem | MediaItem[]>('/admin/media/upload', form);
  },
  deleteMedia: (id: string) => del(`/admin/media/${id}`),

  /* settings */
  settings: () => get<StoreSettings>('/admin/settings'),
  updateSettings: (body: Partial<StoreSettings>) => patch<StoreSettings>('/admin/settings', body),
};
