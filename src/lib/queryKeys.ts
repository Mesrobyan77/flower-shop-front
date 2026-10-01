import type { ProductListParams } from './api/catalog';

/** Central key registry so invalidation never guesses at a string. */
export const qk = {
  config: ['config'] as const,
  settings: ['settings'] as const,

  categories: (nav?: boolean) => ['categories', { nav: !!nav }] as const,
  category: (slug: string) => ['category', slug] as const,

  collections: (home?: boolean) => ['collections', { home: !!home }] as const,
  collection: (slug: string) => ['collection', slug] as const,

  products: (params: ProductListParams) => ['products', params] as const,
  product: (slug: string) => ['product', slug] as const,
  productReviews: (slug: string, page: number) => ['product-reviews', slug, page] as const,
  productInquiries: (slug: string, page: number) => ['product-inquiries', slug, page] as const,

  cart: ['cart'] as const,
  deliveryOptions: ['delivery-options'] as const,
  deliveryQuote: (method: string, region: string, subtotal: number) =>
    ['delivery-quote', method, region, subtotal] as const,
  paymentMethods: ['payment-methods'] as const,
  paymentStatus: (token: string) => ['payment-status', token] as const,

  me: ['me'] as const,
  accountSummary: ['account-summary'] as const,
  addresses: ['addresses'] as const,
  wishlist: ['wishlist'] as const,
  recentlyViewed: ['recently-viewed'] as const,
  myOrders: (page: number, status?: string) => ['my-orders', page, status ?? 'all'] as const,
  myOrder: (code: string) => ['my-order', code] as const,
  myInquiries: (page: number) => ['my-inquiries', page] as const,
  subscriptions: ['subscriptions'] as const,
  plans: ['subscription-plans'] as const,

  posts: (type: string, page: number) => ['posts', type, page] as const,
  post: (slug: string) => ['post', slug] as const,

  adminStats: ['admin-stats'] as const,
  adminProducts: (params: Record<string, unknown>) => ['admin-products', params] as const,
  adminProduct: (id: string) => ['admin-product', id] as const,
  adminCategories: ['admin-categories'] as const,
  adminCollections: ['admin-collections'] as const,
  adminOrders: (params: Record<string, unknown>) => ['admin-orders', params] as const,
  adminOrder: (id: string) => ['admin-order', id] as const,
  adminUsers: (params: Record<string, unknown>) => ['admin-users', params] as const,
  adminUser: (id: string) => ['admin-user', id] as const,
  adminPosts: (params: Record<string, unknown>) => ['admin-posts', params] as const,
  adminReviews: (params: Record<string, unknown>) => ['admin-reviews', params] as const,
  adminInquiries: (params: Record<string, unknown>) => ['admin-inquiries', params] as const,
  adminMedia: (params: Record<string, unknown>) => ['admin-media', params] as const,
  adminSettings: ['admin-settings'] as const,
};
