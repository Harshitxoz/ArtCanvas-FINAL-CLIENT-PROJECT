"use client";
import type { Product } from "@/types";
import { ProductCard } from "./ProductCard";
import { Button } from "@/components/ui/Button";

export function ProductGrid({ products }: { products: Product[] }) {
  if (!products.length) {
    return (
      <div className="rounded-2xl border border-dashed border-black/15 p-12 text-center text-black/60">
        <p className="mb-2 text-lg font-semibold">No artwork found for these filters.</p>
        <p className="text-sm">Try adjusting your search, price range, or availability selection.</p>
      </div>
    );
  }
  return <div className="grid gap-x-4 gap-y-8 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">{products.map(p => <ProductCard key={String(p._id || p.slug)} product={p} />)}</div>;
}

export function ProductGridSkeleton({ count = 8 }: { count?: number }) {
  return <div className="grid gap-x-4 gap-y-8 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">{Array.from({ length: count }).map((_, i) => (<div key={i} className="aspect-[4/5] animate-pulse rounded-2xl bg-black/5" />))}</div>;
}

