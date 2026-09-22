"use client";

import Link from "next/link";
import type { Route } from "next";
import { Heart, Search, ShoppingBag, UserRound, Menu, X } from "lucide-react";
import { useCartStore } from "@/store/cart-store";
import { useState } from "react";

export function Navbar({ announcement, freeShippingThreshold, storeName, tagline }: { announcement?: string; freeShippingThreshold?: number; storeName?: string; tagline?: string }) {
  const count = useCartStore(s => s.items.reduce((sum, i) => sum + i.quantity, 0));
  const [open, setOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const name = storeName || "ArtCanvas";
  const parts = name.match(/^(.*?)(Canvas)$/i);
  const threshold = typeof freeShippingThreshold === "number" ? freeShippingThreshold : 999;
  const banner = announcement?.trim() ? announcement.trim() : `Free shipping on orders above ₹${threshold} · Original art, made to last`;
  return (
    <>
      <div className="w-full bg-[#17130f] px-3 py-2 text-center text-[11px] font-medium leading-5 text-white sm:px-4 sm:text-xs">
        {banner}
      </div>
      <header className="sticky top-0 z-40 w-full border-b border-black/5 bg-[#fffdf9]/95 backdrop-blur">
        <div className="mx-auto flex h-16 w-full max-w-7xl items-center gap-2 px-3 sm:h-20 sm:gap-4 sm:px-6 lg:px-8 xl:gap-5">
          <button type="button" className="shrink-0 p-1 lg:hidden" onClick={() => setOpen(!open)} aria-label={open ? "Close menu" : "Open menu"} aria-expanded={open}>
            {open ? <X size={22}/> : <Menu size={22}/>}
          </button>
          <Link href="/" className="mr-auto min-w-0 shrink">
            <div className="truncate font-serif text-xl font-bold tracking-tight sm:text-2xl">{parts ? <>{parts[1]}<span className="text-[#9a5d19]">{parts[2]}</span></> : name}</div>
            <div className="hidden text-[9px] font-semibold uppercase tracking-[0.35em] text-black/55 sm:block">{tagline || "Art lives forever"}</div>
          </Link>
          <nav className="hidden shrink-0 items-center gap-4 text-[13px] font-medium lg:flex xl:gap-6 xl:text-sm">
            <Link href="/">Home</Link><Link href="/shop">Shop</Link><Link href={"/art-finder" as Route} className="font-semibold text-[#9a5d19]">✨ Art Finder</Link><Link href="/hand-painted">Hand-Painted</Link><Link href="/printed-canvas">Printed Canvas</Link><Link href="/categories">Categories</Link><Link href="/custom-artwork">Custom Art</Link><Link href="/about">About</Link>
          </nav>
          <form action="/search" className="hidden max-w-xs flex-1 items-center rounded-full bg-black/5 px-4 xl:flex">
            <Search size={18} className="shrink-0" /><input name="q" placeholder="Search art, artists..." aria-label="Search artwork" className="w-full min-w-0 bg-transparent px-3 py-2 text-sm outline-none"/>
          </form>
          <div className="flex shrink-0 items-center gap-1 sm:gap-3">
            <button type="button" className="p-1 xl:hidden" onClick={() => { setSearchOpen(v => !v); setOpen(false); }} aria-label={searchOpen ? "Close search" : "Search"} aria-expanded={searchOpen}>
              {searchOpen ? <X size={20}/> : <Search size={20}/>}
            </button>
            <Link href="/wishlist" className="p-1" aria-label="Wishlist"><Heart size={20}/></Link>
            <Link href="/account" className="p-1" aria-label="Account"><UserRound size={20}/></Link>
            <Link href="/cart" className="relative p-1" aria-label="Cart"><ShoppingBag size={21}/>{count > 0 && <span className="absolute -right-1.5 -top-1.5 grid h-5 min-w-5 place-items-center rounded-full bg-[#9a5d19] px-1 text-[10px] font-bold text-white">{count}</span>}</Link>
          </div>
        </div>
        {searchOpen && <form action="/search" className="border-t border-black/5 px-3 py-3 sm:px-6 lg:px-8 xl:hidden">
          <div className="mx-auto flex w-full max-w-xl items-center rounded-full bg-black/5 px-4">
            <Search size={18} className="shrink-0 text-black/50" />
            <input name="q" autoFocus placeholder="Search art, artists..." aria-label="Search artwork" className="w-full min-w-0 bg-transparent px-3 py-2.5 text-sm outline-none"/>
          </div>
        </form>}
        {open && <nav className="border-t border-black/5 bg-[#fffdf9] px-5 py-5 lg:hidden">
          <div className="grid gap-4 text-sm"><Link onClick={() => setOpen(false)} href="/shop">Shop All</Link><Link onClick={() => setOpen(false)} href={"/art-finder" as Route} className="font-semibold text-[#9a5d19]">✨ Art Finder Quiz</Link><Link onClick={() => setOpen(false)} href="/hand-painted">Hand-Painted</Link><Link onClick={() => setOpen(false)} href="/printed-canvas">Printed Canvas</Link><Link onClick={() => setOpen(false)} href="/categories">Categories</Link><Link onClick={() => setOpen(false)} href="/custom-artwork">Custom Art</Link><Link onClick={() => setOpen(false)} href="/about">About</Link></div>
        </nav>}
      </header>
    </>
  );
}
