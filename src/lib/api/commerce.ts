import { del, get, getPaged, patch, post } from './client';
import type {
  Cart,
  CheckoutResponse,
  DeliveryMethod,
  DeliveryOption,
  Order,
  OrderStatus,
  PaymentMethod,
  PaymentMethodAvailability,
  PaymentStartResult,
  PaymentStatusResponse,
} from '@/types';

export interface AddToCartBody {
  productId: string;
  quantity: number;
  options: { groupKey: string; optionKey?: string; value?: string }[];
  deliveryMethod: DeliveryMethod;
  deliveryDate?: string;
  timeSlot?: string;
  ribbonText?: string;
  senderName?: string;
  cardMessage?: string;
}

export interface CheckoutBody {
  customer: { name: string; email: string; phone: string };
  delivery: {
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
  };
  customerNote?: string;
  pointsUsed?: number;
  paymentMethod: PaymentMethod;
  agreeTerms: true;
}

export interface DeliveryQuote {
  method: DeliveryMethod;
  fee: number;
  surcharge: number;
  total: number;
  freeThreshold: number | null;
  isFree: boolean;
}

export const cartApi = {
  get: () => get<Cart>('/cart'),
  add: (body: AddToCartBody) => post<Cart>('/cart/items', body),
  update: (
    itemId: string,
    body: Partial<Pick<AddToCartBody, 'quantity' | 'deliveryDate' | 'timeSlot' | 'ribbonText' | 'senderName' | 'cardMessage'>>,
  ) => patch<Cart>(`/cart/items/${itemId}`, body),
  remove: (itemId: string) => del<Cart>(`/cart/items/${itemId}`),
  clear: () => del<Cart>('/cart'),
};

export const deliveryApi = {
  options: () =>
    get<{
      methods: DeliveryOption[];
      regions: { key: string; quick: boolean; remote: boolean; methods: DeliveryMethod[] }[];
    }>('/delivery/options'),

  quote: (params: { method: DeliveryMethod; region: string; subtotal: number }) =>
    get<DeliveryQuote>('/delivery/quote', params),
};

export const orderApi = {
  checkout: (body: CheckoutBody) => post<CheckoutResponse>('/orders/checkout', body),
  mine: (params: { page?: number; limit?: number; status?: OrderStatus } = {}) =>
    getPaged<Order>('/orders', params),
  detail: (code: string) => get<Order>(`/orders/${code}`),
  cancel: (code: string, reason?: string) => post<Order>(`/orders/${code}/cancel`, { reason }),
  lookup: (body: { code: string; email: string }) => post<Order>('/orders/lookup', body),
};

export const paymentApi = {
  methods: () => get<PaymentMethodAvailability[]>('/payments/methods'),
  start: (body: { token: string; locale: string }) => post<PaymentStartResult>('/payments/start', body),
  status: (token: string, locale?: string) =>
    get<PaymentStatusResponse>('/payments/status', { token, ...(locale ? { locale } : {}) }),
};
