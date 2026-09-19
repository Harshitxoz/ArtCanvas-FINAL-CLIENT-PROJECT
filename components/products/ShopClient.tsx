"use client";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, useEffect, useMemo, useRef } from "react";
import { Filter, Search, X } from "lucide-react";
import { FilterSidebar } from "./ProductFilters";
import { SortSelect } from "./SortSelect";
import { ActiveFilters } from "./ActiveFilters";
import { ProductGrid, ProductGridSkeleton } from "./ProductGrid";
import { FilterDrawer } from "./FilterDrawer";
import type { Product } from "@/types";
import { parseFilters } from "./ProductFilters";

export function ShopClient({ products, title, eyebrow, intro, basePath = "/shop", lockedType, lockedCategory, headingLevel = "h1" }: { products: Product[]; title?: string; eyebrow?: string; intro?: string; basePath?: string; lockedType?: string; lockedCategory?: string; headingLevel?: "h1" | "h2" }) {
  const router = useRouter();
  const params = useSearchParams();
  const [search, setSearch] = useState(params.get("q") || "");
  const paramsRef = useRef<string | null>(null);
  const skippedFirst = useRef(false);

  // Cache the escaped params string once on mount, then reuse across debounced pushes.
  // Skips the very first render so the initial URL (which provided the search value) is not
  // re-pushed/redirected immediately on mount.
  useEffect(() => {
    if (!paramsRef.current) {
      paramsRef.current = encodeURIComponent(params.toString());
    }
    if (!skippedFirst.current) {
      skippedFirst.current = true;
      return;
    }
    const t = setTimeout(() => {
      const p = new URLSearchParams(decodeURIComponent(paramsRef.current || params.toString()));
      search ? p.set("q", search) : p.delete("q");
      const href = basePath + (p.toString() ? "?" + encodeURIComponent(p.toString()) : "");
      router.push(href as never);
    }, 400);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  const fs = useMemo(() => parseFilters(params), [params]);
  const hasFilters = fs.type || fs.category || fs.minPrice || fs.maxPrice || fs.frame || fs.availability || fs.sizes.length || params.get("q") ? 1 : 0;

  return (
    <section className="mx-auto max-w-7xl px-4 pt-12 pb-8 sm:px-6 sm:pt-14 sm:pb-10 lg:px-8">
      {/* Header */}
      <div className="mb-8">
        <p className="text-xs font-bold uppercase tracking-[0.25em] text-[#9a5d19]">{eyebrow ?? "The collection"}</p>
        {headingLevel === "h2" ? (
          <h2 className="mt-2 font-serif text-3xl font-bold tracking-tight sm:text-5xl">{title ?? "Shop Artwork"}</h2>
        ) : (
          <h1 className="mt-2 font-serif text-3xl font-bold tracking-tight sm:text-5xl">{title ?? "Shop Artwork"}</h1>
        )}
        {intro ? <p className="mt-3 max-w-2xl leading-7 text-black/60">{intro}</p> : null}
        <p className="mt-3 text-black/60" role="status" aria-live="polite">{products.length} {products.length === 1 ? "piece" : "pieces"} available</p>
      </div>

      {/* Top controls — mobile */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4 lg:hidden">
        <FilterDrawer activeCount={hasFilters} basePath={basePath} lockedType={lockedType} lockedCategory={lockedCategory} />
        <SortSelect basePath={basePath} />
      </div>

      {/* Desktop search bar */}
      <div className="mb-6 hidden lg:block">
        <form role="search" className="relative max-w-md">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-black/40" />
          <input
            type="search"
            placeholder="Search by title, artist, category, SKU..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full rounded-full border border-black/10 bg-white px-4 py-2.5 pl-10 text-sm outline-none focus:border-[#9a5d19]"
            aria-label="Search artwork"
          />
          {search && (
            <button type="button" onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-black/40 hover:text-black" aria-label="Clear search">
              <X size={16} />
            </button>
          )}
        </form>
      </div>

      {/* Active filter chips */}
      <ActiveFilters basePath={basePath} lockedType={lockedType} lockedCategory={lockedCategory} />

      {/* Main layout: sidebar + grid */}
      <div className="mt-6 grid gap-8 lg:grid-cols-[250px_minmax(0,1fr)]">
        {/* Desktop sidebar */}
        <aside className="hidden lg:block">
          <FilterSidebar basePath={basePath} lockedType={lockedType} lockedCategory={lockedCategory} />
        </aside>
        {/* Product grid */}
        <main className="min-w-0">
          <ProductGrid products={products} />
        </main>
      </div>
    </section>
  );
}

export function ShopClientSkeleton() {
  return (
    <section className="mx-auto max-w-7xl px-4 pt-12 pb-8 sm:px-6 sm:pt-14 sm:pb-10 lg:px-8">
      <div className="mb-8">
        <p className="text-xs font-bold uppercase tracking-[0.25em] text-[#9a5d19]">The collection</p>
        <h1 className="mt-2 font-serif text-3xl font-bold sm:text-5xl">Shop Artwork</h1>
      </div>
      <div className="grid gap-8 lg:grid-cols-[250px_minmax(0,1fr)]">
        <div className="hidden lg:block"><div className="h-96 w-full animate-pulse rounded-3xl bg-black/5" /></div>
        <ProductGridSkeleton count={12} />
      </div>
    </section>
  );
}
