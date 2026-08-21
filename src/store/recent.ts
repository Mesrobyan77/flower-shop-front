'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface RecentItem {
  slug: string;
  name: string;
  thumbnail?: string;
  price: number;
}

interface RecentState {
  items: RecentItem[];
  searches: string[];
  push: (item: RecentItem) => void;
  pushSearch: (term: string) => void;
  clearSearches: () => void;
  clear: () => void;
}

/** Mirrors the reference "recently viewed" and "recent searches" side rails. */
export const useRecentStore = create<RecentState>()(
  persist(
    (set) => ({
      items: [],
      searches: [],

      push: (item) =>
        set((s) => ({ items: [item, ...s.items.filter((i) => i.slug !== item.slug)].slice(0, 12) })),

      pushSearch: (term) =>
        set((s) => {
          const clean = term.trim();
          if (!clean) return s;
          return { searches: [clean, ...s.searches.filter((t) => t !== clean)].slice(0, 8) };
        }),

      clearSearches: () => set({ searches: [] }),
      clear: () => set({ items: [] }),
    }),
    { name: 'xf-recent' },
  ),
);
