import { get, getPaged, getPagedWithMeta, post, del } from './client';
import type {
  Category,
  Collection,
  Inquiry,
  Product,
  ProductDetailResponse,
  Review,
  SortOption,
} from '@/types';

export interface ProductListParams {
  [key: string]: unknown;
  page?: number;
  limit?: number;
  category?: string;
  collection?: string;
  q?: string;
  min?: number;
  max?: number;
  badge?: string;
  delivery?: string;
  sameDay?: boolean;
  featured?: boolean;
  sort?: SortOption;
}

export const catalogApi = {
  categories: (navOnly = false) => get<Category[]>('/categories', { nav: navOnly || undefined }),

  category: (slug: string) =>
    get<{ category: Category; children: Category[]; descendantIds: string[] }>(`/categories/${slug}`),

  collections: (homeOnly = false) => get<Collection[]>('/collections', { home: homeOnly || undefined }),

  collection: (slug: string) => get<Collection>(`/collections/${slug}`),

  products: (params: ProductListParams = {}) => getPaged<Product>('/products', params),

  product: (slug: string) => get<ProductDetailResponse>(`/products/${slug}`),

  facets: (category?: string) => get<{ price: { min: number; max: number } }>('/products/facets', { category }),

  newArrivals: (limit = 8) => getPaged<Product>('/products/new', { limit }),

  bestSellers: (limit = 8) => getPaged<Product>('/products/best', { limit }),

  reviews: (slug: string, params: { page?: number; limit?: number; rating?: number } = {}) =>
    getPagedWithMeta<Review>(`/products/${slug}/reviews`, params),

  inquiries: (slug: string, params: { page?: number; limit?: number } = {}) =>
    getPaged<Inquiry>(`/products/${slug}/inquiries`, params),

  createReview: (body: { product: string; rating: number; title?: string; body: string; images?: string[] }) =>
    post<Review>('/reviews', body),

  deleteReview: (id: string) => del(`/reviews/${id}`),

  markHelpful: (id: string) => post<{ helpfulCount: number }>(`/reviews/${id}/helpful`, {}),

  createInquiry: (body: {
    product?: string;
    topic?: string;
    subject: string;
    body: string;
    isSecret?: boolean;
  }) => post<Inquiry>('/inquiries', body),

  myInquiries: (params: { page?: number } = {}) => getPaged<Inquiry>('/inquiries/mine', params),
};
