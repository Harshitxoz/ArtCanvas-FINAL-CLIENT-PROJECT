"use client";

import Link from "next/link";
import { Heart, Search, ShoppingBag, UserRound, Menu } from "lucide-react";
import { useCartStore } from "@/store/cart-store";
import { useState } from "react";

export function Navbar({ announcement, freeShippingThreshold, storeName, tagline }: { announcement?: string; freeShippingThreshold?: number; storeName?: string; tagline?: string }) {
  const count = useCartStore(s => s.items.reduce((sum, i) => sum + i.quantity, 0));
  const [open, setOpen] = useState(false);
  const name = storeName || "ArtCanvas";
  const parts = name.match(/^(.*?)(Canvas)$/i);
  const threshold = typeof freeShippingThreshold === "number" ? freeShippingThreshold : 999;
  const banner = announcement?.trim() ? announcement.trim() : `Free shipping on orders above ₹${threshold} · Original art, made to last`;
  return (
    <>
      <div className="bg-[#17130f] px-4 py-2 text-center text-xs font-medium text-white">
        {banner}
      </div>
      <header className="sticky top-0 z-40 border-b border-black/5 bg-[#fffdf9]/95 backdrop-blur">
        <div className="mx-auto flex h-20 max-w-7xl items-center gap-5 px-4 sm:px-6 lg:px-8">
          <button className="lg:hidden" onClick={() => setOpen(!open)} aria-label="Open menu"><Menu size={22}/></button>
          <Link href="/" className="mr-auto shrink-0">
            <div className="font-serif text-2xl font-bold tracking-tight">{parts ? <>{parts[1]}<span className="text-[#9a5d19]">{parts[2]}</span></> : name}</div>
            <div className="text-[9px] font-semibold uppercase tracking-[0.35em] text-black/55">{tagline || "Art lives forever"}</div>
          </Link>
          <nav className="hidden items-center gap-7 text-sm font-medium lg:flex">
            <Link href="/">Home</Link><Link href="/shop">Shop</Link><Link href="/hand-painted">Hand-Painted</Link><Link href="/printed-canvas">Printed Canvas</Link><Link href="/categories">Categories</Link><Link href="/custom-artwork">Custom Art</Link><Link href="/about">About</Link>
          </nav>
          <form action="/search" className="hidden max-w-xs flex-1 items-center rounded-full bg-black/5 px-4 lg:flex">
            <Search size={18} /><input name="q" placeholder="Search art, artists..." className="w-full bg-transparent px-3 py-2 text-sm outline-none"/>
          </form>
          <div className="flex items-center gap-3">
            <Link href="/wishlist" aria-label="Wishlist"><Heart size={21}/></Link>
            <Link href="/account" aria-label="Account"><UserRound size={21}/></Link>
            <Link href="/cart" className="relative" aria-label="Cart"><ShoppingBag size={22}/>{count > 0 && <span className="absolute -right-2 -top-2 grid h-5 min-w-5 place-items-center rounded-full bg-[#9a5d19] px-1 text-[10px] font-bold text-white">{count}</span>}</Link>
          </div>
        </div>
        {open && <div className="border-t border-black/5 bg-[#fffdf9] px-5 py-5 lg:hidden">
          <div className="grid gap-4 text-sm"><Link onClick={() => setOpen(false)} href="/shop">Shop All</Link><Link onClick={() => setOpen(false)} href="/hand-painted">Hand-Painted</Link><Link onClick={() => setOpen(false)} href="/printed-canvas">Printed Canvas</Link><Link onClick={() => setOpen(false)} href="/categories">Categories</Link><Link onClick={() => setOpen(false)} href="/custom-artwork">Custom Art</Link><Link onClick={() => setOpen(false)} href="/about">About</Link></div>
        </div>}
      </header>
    </>
  );
}
