export type Locale = 'hy' | 'en' | 'ru';

export interface Localized {
  hy: string;
  en?: string;
  ru?: string;
}

export type DeliveryMethod = 'quick' | 'parcel' | 'pickup';

export type OrderStatus =
  | 'pending'
  | 'confirmed'
  | 'preparing'
  | 'delivering'
  | 'delivered'
  | 'completed'
  | 'cancelled';

export type PaymentStatus = 'pending' | 'paid' | 'refunded';
export type UserRole = 'user' | 'admin';
export type ProductBadge = 'new' | 'best' | 'sale' | 'today' | 'subscription_only';
export type PostType = 'magazine' | 'notice' | 'faq' | 'event';
export type SortOption = 'recommended' | 'newest' | 'price_asc' | 'price_desc' | 'popular' | 'review';

export interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export interface ApiSuccess<T> {
  success: true;
  data: T;
  meta?: { pagination?: Pagination; [key: string]: unknown };
}

export interface ApiFailure {
  success: false;
  message: string;
  code?: string;
  errors?: Record<string, string[]>;
}

export interface User {
  id: string;
  email: string;
  name: string;
  phone?: string;
  role: UserRole;
  grade: string;
  gradeDiscountRate: number;
  pointRate: number;
  points: number;
  totalSpend: number;
  marketingOptIn: boolean;
  createdAt: string;
}

export interface Category {
  id: string;
  code: string;
  slug: string;
  name: Localized;
  description?: Localized;
  image?: string;
  icon?: string;
  order: number;
  productCount: number;
  children: Category[];
}

export interface ProductOption {
  key: string;
  label: Localized;
  priceDelta: number;
  isAvailable: boolean;
  order: number;
}

export interface ProductOptionGroup {
  key: string;
  label: Localized;
  helpText?: Localized;
  type: 'select' | 'text' | 'textarea' | 'date' | 'time';
  required: boolean;
  maxLength?: number;
  order: number;
  options: ProductOption[];
}

export interface ProductImage {
  url: string;
  alt?: string;
  order: number;
}

export interface Product {
  id: string;
  sku: string;
  slug: string;
  name: Localized;
  shortDescription?: Localized;
  description?: Localized;
  careGuide?: Localized;
  category: Category | string;
  price: number;
  compareAtPrice?: number;
  images: ProductImage[];
  thumbnail?: string;
  optionGroups: ProductOptionGroup[];
  deliveryMethods: DeliveryMethod[];
  badges: ProductBadge[];
  origin?: Localized;
  composition?: Localized;
  size?: Localized;
  stock: number;
  trackStock: boolean;
  isActive: boolean;
  isFeatured: boolean;
  sameDayAvailable: boolean;
  minOrderQty: number;
  maxOrderQty: number;
  ratingAverage: number;
  ratingCount: number;
  soldCount: number;
  wishlistCount: number;
  createdAt: string;
}

export interface Collection {
  id: string;
  slug: string;
  title: Localized;
  subtitle?: Localized;
  description?: Localized;
  coverImage?: string;
  bannerImage?: string;
  products: Product[];
  showOnHome: boolean;
  order: number;
}

export interface DeliveryOption {
  method: DeliveryMethod;
  earliestDate: string;
  timeSlots: string[];
  calendar: { date: string; available: boolean; reason?: string }[];
}

export interface ProductDetailResponse {
  product: Product;
  breadcrumb: { id: string; slug: string; name: Localized }[];
  delivery: DeliveryOption[];
  related: Product[];
}

export interface SelectedOption {
  groupKey: string;
  groupLabel: string;
  optionKey?: string;
  value: string;
  priceDelta: number;
}

export interface CartItem {
  id: string;
  product: {
    id: string;
    slug: string;
    name: string;
    thumbnail?: string;
    isActive: boolean;
    inStock: boolean;
  } | null;
  quantity: number;
  unitPrice: number;
  options: SelectedOption[];
  optionsTotal: number;
  lineTotal: number;
  deliveryMethod: DeliveryMethod;
  deliveryDate?: string;
  timeSlot?: string;
  ribbonText?: string;
  senderName?: string;
  cardMessage?: string;
}

export interface CartTotals {
  subtotal: number;
  optionsTotal: number;
  merchandiseTotal: number;
  gradeDiscount: number;
  gradeDiscountRate: number;
  deliveryFee: number;
  deliverySurcharge: number;
  pointsUsed: number;
  total: number;
  pointsEarned: number;
}

export interface Cart {
  id: string;
  items: CartItem[];
  totals: CartTotals;
  itemCount: number;
}

export interface Address {
  id: string;
  label?: string;
  recipient: string;
  phone: string;
  region: string;
  city: string;
  street: string;
  building?: string;
  apartment?: string;
  postalCode?: string;
  notes?: string;
  isDefault: boolean;
}

export interface OrderItem {
  product: string;
  name: string;
  sku: string;
  thumbnail?: string;
  unitPrice: number;
  quantity: number;
  options: SelectedOption[];
  optionsTotal: number;
  lineTotal: number;
  ribbonText?: string;
  senderName?: string;
  cardMessage?: string;
}

export interface OrderDelivery {
  method: DeliveryMethod;
  recipient: string;
  phone: string;
  region: string;
  city: string;
  street: string;
  building?: string;
  apartment?: string;
  postalCode?: string;
  notes?: string;
  requestedDate?: string;
  timeSlot?: string;
  fee: number;
  surcharge: number;
  deliveredAt?: string;
}

export interface Order {
  id: string;
  code: string;
  user?: string;
  isGuest: boolean;
  customer: { name: string; email: string; phone: string };
  items: OrderItem[];
  delivery: OrderDelivery;
  subtotal: number;
  optionsTotal: number;
  deliveryFee: number;
  gradeDiscount: number;
  pointsUsed: number;
  total: number;
  pointsEarned: number;
  paymentMethod: 'cash_on_delivery';
  paymentStatus: PaymentStatus;
  status: OrderStatus;
  statusHistory: { status: OrderStatus; note?: string; changedAt: string }[];
  customerNote?: string;
  adminNote?: string;
  createdAt: string;
}

export interface Review {
  id: string;
  product: string | Product;
  user: { id: string; name: string; grade?: string } | string;
  rating: number;
  title?: string;
  body: string;
  images: string[];
  isVerified: boolean;
  isApproved: boolean;
  helpfulCount: number;
  createdAt: string;
}

export interface Inquiry {
  id: string;
  product?: string | Product;
  user: { id: string; name: string } | string;
  topic: 'product' | 'order' | 'delivery' | 'general';
  subject: string | null;
  body: string | null;
  isSecret: boolean;
  status: 'open' | 'answered' | 'closed';
  answer?: { body: string; answeredAt: string };
  redacted?: boolean;
  createdAt: string;
}

export interface Post {
  id: string;
  type: PostType;
  slug: string;
  title: Localized;
  excerpt?: Localized;
  body: Localized;
  coverImage?: string;
  tags: string[];
  category?: string;
  isPinned: boolean;
  viewCount: number;
  publishedAt: string;
}

export interface SubscriptionPlan {
  id: string;
  slug: string;
  name: Localized;
  description?: Localized;
  image?: string;
  pricePerDelivery: number;
  cycle: 'weekly' | 'biweekly' | 'monthly';
  order: number;
}

export interface Subscription {
  id: string;
  code: string;
  plan: SubscriptionPlan | string;
  cycle: 'weekly' | 'biweekly' | 'monthly';
  status: 'active' | 'paused' | 'cancelled';
  pricePerDelivery: number;
  deliveriesDone: number;
  nextDeliveryAt?: string;
  recipient: string;
  phone: string;
  region: string;
  city: string;
  street: string;
}

export interface HeroSlide {
  image: string;
  mobileImage?: string;
  title?: Localized;
  subtitle?: Localized;
  ctaLabel?: Localized;
  href?: string;
  theme: 'light' | 'dark';
  order: number;
}

export interface ThemeTile {
  image?: string;
  title: Localized;
  subtitle?: Localized;
  href: string;
  animated: boolean;
  order: number;
}

export interface StoreSettings {
  promoBar?: { enabled: boolean; text?: Localized; href?: string };
  heroSlides?: HeroSlide[];
  themeTiles?: ThemeTile[];
  counters?: { reviews: number; deliveries: number; awardYears: number };
  contact?: {
    phone: string;
    overseasPhone?: string;
    email: string;
    hours?: Localized;
    address?: Localized;
  };
  social?: { instagram?: string; facebook?: string; youtube?: string; telegram?: string };
}

export interface AppConfig {
  currency: { code: string; symbol: string; position: 'after' | 'before' };
  delivery: {
    parcelFee: number;
    freeParcelThreshold: number;
    quickFee: number;
    ruralSurcharge: number;
  };
  regions: { key: string; quick: boolean; remote: boolean }[];
  grades: { key: string; order: number; discountRate: number; pointRate: number; minSpend: number }[];
  timeSlots: string[];
}

export interface AdminStats {
  totals: {
    users: number;
    products: number;
    activeProducts: number;
    orders: number;
    revenue: number;
    openInquiries: number;
    pendingReviews: number;
  };
  month: { orders: number; revenue: number };
  statusCounts: Record<OrderStatus, number>;
  daily: { date: string; orders: number; revenue: number }[];
  recentOrders: Order[];
  topProducts: Product[];
}

export interface Paged<T> {
  items: T[];
  pagination: Pagination;
}
