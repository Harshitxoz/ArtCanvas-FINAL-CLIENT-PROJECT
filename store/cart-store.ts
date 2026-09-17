"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { CartItem } from "@/types";

interface CartState {
  items: CartItem[];
  addItem: (item: CartItem) => void;
  removeItem: (productId: string, size: string, frame?: CartItem["frame"]) => void;
  updateQuantity: (productId: string, size: string, quantity: number, frame?: CartItem["frame"]) => void;
  clear: () => void;
}

function frameOf(item: Pick<CartItem, "frame">): string {
  return item.frame ?? "unframed";
}

export const useCartStore = create<CartState>()(
  persist(
    (set) => ({
      items: [],
      addItem: (item) => set((state) => {
        const existing = state.items.find(i => i.productId === item.productId && i.size === item.size && frameOf(i) === frameOf(item));
        if (existing) {
          return { items: state.items.map(i => i === existing ? { ...i, quantity: Math.min(i.quantity + item.quantity, 20) } : i) };
        }
        return { items: [...state.items, item] };
      }),
      removeItem: (productId, size, frame) => set(state => ({ items: state.items.filter(i => !(i.productId === productId && i.size === size && (frame === undefined || frameOf(i) === frameOf({ frame })))) })),
      updateQuantity: (productId, size, quantity, frame) => set(state => ({
        items: state.items.map(i => i.productId === productId && i.size === size && (frame === undefined || frameOf(i) === frameOf({ frame })) ? { ...i, quantity: Math.max(1, Math.min(quantity, 20)) } : i)
      })),
      clear: () => set({ items: [] })
    }),
    { name: "artcanvas-cart" }
  )
);
