'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { DeliveryMethod } from '@/types';

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
    { name: 'xf-checkout' },
  ),
);
