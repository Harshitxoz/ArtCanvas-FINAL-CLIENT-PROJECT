"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Heart, Trash2, ArrowRight } from "lucide-react";
import { useWishlistStore } from "@/store/wishlist-store";
import { ProductCard } from "@/components/products/ProductCard";
import type { Product } from "@/types";
import { Button } from "@/components/ui/Button";

export function WishlistClient({ products }: { products: Product[] }) {
  const [mounted, setMounted] = useState(false);
  const ids = useWishlistStore((s) => s.ids);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-16 text-center sm:px-6 lg:px-8">
        <div className="h-8 w-48 bg-neutral-200 rounded-full mx-auto animate-pulse" />
      </div>
    );
  }

  const wishlistProducts = products.filter(
    (p) => ids.includes(String(p._id)) || ids.includes(p.slug)
  );

  if (wishlistProducts.length === 0) {
    return (
      <section className="mx-auto max-w-3xl px-4 py-20 text-center sm:px-6 lg:px-8">
        <div className="mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-full bg-[#f6f1ea] text-[#9a5d19]">
          <Heart size={36} strokeWidth={1.5} />
        </div>
        <h1 className="font-serif text-3xl font-bold text-neutral-900 sm:text-4xl">
          Your Wishlist is Empty
        </h1>
        <p className="mt-3 text-sm sm:text-base text-neutral-600 max-w-md mx-auto leading-relaxed">
          Save pieces you adore while browsing our gallery and return to them anytime to compare sizes or order.
        </p>
        <div className="mt-8">
          <Link href="/shop">
            <Button className="bg-[#9a5d19] px-7 py-3 text-white hover:bg-[#834e15] inline-flex items-center gap-2">
              Explore Artwork
              <ArrowRight size={16} />
            </Button>
          </Link>
        </div>
      </section>
    );
  }

  const clearAll = () => {
    ids.forEach((id) => useWishlistStore.getState().toggle(id));
  };

  return (
    <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between border-b border-neutral-200 pb-6">
        <div>
          <p className="text-xs font-bold uppercase tracking-[.25em] text-[#9a5d19]">Your Curation</p>
          <h1 className="mt-2 font-serif text-3xl font-bold sm:text-4xl">Saved Artworks</h1>
          <p className="mt-1 text-sm text-neutral-500">
            {wishlistProducts.length} {wishlistProducts.length === 1 ? "piece" : "pieces"} saved in your collection
          </p>
        </div>
        <button
          onClick={clearAll}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-neutral-500 hover:text-red-600 transition"
        >
          <Trash2 size={14} />
          Clear Wishlist
        </button>
      </div>

      <div className="mt-8 grid grid-cols-2 gap-x-4 gap-y-8 sm:gap-x-6 lg:grid-cols-4 lg:gap-8">
        {wishlistProducts.map((product) => (
          <ProductCard key={String(product._id || product.slug)} product={product} />
        ))}
      </div>
    </section>
  );
}
