import { getStoreProducts } from "@/lib/queries";
import { ShopClient } from "@/components/products/ShopClient";
import { Suspense } from "react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Search Art — ArtCanvas",
  description: "Search our collection of original hand-painted artwork and printed canvas."
};

export default async function SearchPage({ searchParams }: { searchParams: Promise<{ q?: string; type?: string; category?: string; minPrice?: string; maxPrice?: string; frame?: string; availability?: string; size?: string | string[]; sort?: string }> }) {
  const sp = await searchParams;
  const q = sp.q || "";
  const products = await getStoreProducts({
    search: q,
    artType: sp.type,
    category: sp.category,
    minPrice: sp.minPrice,
    maxPrice: sp.maxPrice,
    frame: sp.frame,
    availability: sp.availability,
    sizes: typeof sp.size === "string" ? [sp.size] : sp.size,
    sort: sp.sort || "featured",
  });
  return (
    <Suspense fallback={null}>
      <ShopClient
        products={products}
        title={q ? `Results for \u201C${q}\u201D` : "Search Art"}
        eyebrow="Search"
        intro={`${products.length} ${products.length === 1 ? "piece" : "pieces"} found`}
        basePath="/search"
      />
    </Suspense>
  );
}

