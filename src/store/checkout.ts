'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { DeliveryMethod, PaymentMethod } from '@/types';

export interface CheckoutDraft {
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  recipient: string;
  recipientPhone: string;
  region: string;
  city: string;
  street: string;
  building: string;
  apartment: string;
  postalCode: string;
  notes: string;
  method: DeliveryMethod;
  requestedDate: string;
  timeSlot: string;
  customerNote: string;
  pointsUsed: number;
  paymentMethod: PaymentMethod;
}

const EMPTY: CheckoutDraft = {
  customerName: '',
  customerEmail: '',
  customerPhone: '',
  recipient: '',
  recipientPhone: '',
  region: 'yerevan',
  city: '',
  street: '',
  building: '',
  apartment: '',
  postalCode: '',
  notes: '',
  method: 'quick',
  requestedDate: '',
  timeSlot: '',
  customerNote: '',
  pointsUsed: 0,
  paymentMethod: 'cash_on_delivery',
};

interface CheckoutState {
  draft: CheckoutDraft;
  update: (patch: Partial<CheckoutDraft>) => void;
  reset: () => void;
}

/** Survives an accidental refresh mid-checkout, exactly like the reference form did. */
export const useCheckoutStore = create<CheckoutState>()(
  persist(
    (set) => ({
      draft: EMPTY,
      update: (patch) => set((s) => ({ draft: { ...s.draft, ...patch } })),
      reset: () => set({ draft: EMPTY }),
    }),
    {
      name: 'xf-checkout',
      // Drafts persisted before new fields existed must still hydrate: fill every
      // missing key from EMPTY instead of letting an old shape leak through.
      merge: (persisted, current) => {
        const stored = persisted as Partial<CheckoutState> | undefined;
        return { ...current, ...stored, draft: { ...EMPTY, ...(stored?.draft ?? {}) } };
      },
    },
  ),
);
