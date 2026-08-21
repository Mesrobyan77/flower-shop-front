'use client';

import { create } from 'zustand';

interface UiState {
  megaMenuOpen: boolean;
  mobileNavOpen: boolean;
  searchOpen: boolean;
  todayMenuOpen: boolean;
  cartDrawerOpen: boolean;
  toast: { id: number; message: string; tone: 'success' | 'error' | 'info' } | null;

  toggleMegaMenu: (open?: boolean) => void;
  toggleMobileNav: (open?: boolean) => void;
  toggleSearch: (open?: boolean) => void;
  toggleTodayMenu: (open?: boolean) => void;
  toggleCartDrawer: (open?: boolean) => void;
  closeAll: () => void;
  notify: (message: string, tone?: 'success' | 'error' | 'info') => void;
  dismissToast: () => void;
}

export const useUiStore = create<UiState>((set) => ({
  megaMenuOpen: false,
  mobileNavOpen: false,
  searchOpen: false,
  todayMenuOpen: false,
  cartDrawerOpen: false,
  toast: null,

  toggleMegaMenu: (open) => set((s) => ({ megaMenuOpen: open ?? !s.megaMenuOpen, todayMenuOpen: false })),
  toggleMobileNav: (open) => set((s) => ({ mobileNavOpen: open ?? !s.mobileNavOpen })),
  toggleSearch: (open) => set((s) => ({ searchOpen: open ?? !s.searchOpen })),
  toggleTodayMenu: (open) => set((s) => ({ todayMenuOpen: open ?? !s.todayMenuOpen, megaMenuOpen: false })),
  toggleCartDrawer: (open) => set((s) => ({ cartDrawerOpen: open ?? !s.cartDrawerOpen })),

  closeAll: () =>
    set({ megaMenuOpen: false, mobileNavOpen: false, searchOpen: false, todayMenuOpen: false, cartDrawerOpen: false }),

  notify: (message, tone = 'success') => set({ toast: { id: Date.now(), message, tone } }),
  dismissToast: () => set({ toast: null }),
}));
