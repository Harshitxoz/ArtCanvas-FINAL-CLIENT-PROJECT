import { getStoreProducts } from "@/lib/queries";
import { ShopClient, ShopClientSkeleton } from "@/components/products/ShopClient";
import { Suspense } from "react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Shop Artwork — Original Hand-Painted & Printed Canvas | ArtCanvas",
  description: "Browse our full collection of original hand-painted artwork and premium printed canvas wall art."
};

export default async function ShopPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const params = await searchParams;
  const filters = {
    artType: typeof params.type === "string" ? params.type : undefined,
    category: typeof params.category === "string" ? params.category : undefined,
    search: typeof params.q === "string" ? params.q : undefined,
    minPrice: typeof params.minPrice === "string" ? params.minPrice : undefined,
    maxPrice: typeof params.maxPrice === "string" ? params.maxPrice : undefined,
    frame: typeof params.frame === "string" ? params.frame : undefined,
    availability: typeof params.availability === "string" ? params.availability : undefined,
    sizes: typeof params.size === "string" ? [params.size] : Array.isArray(params.size) ? params.size : undefined,
    sort: typeof params.sort === "string" ? params.sort : undefined,
    featured: typeof params.featured === "string" ? true : undefined,
    bestseller: typeof params.bestseller === "string" ? true : undefined
  };
  const products = await getStoreProducts(filters);
  return (
    <Suspense fallback={<ShopClientSkeleton />}>
      <ShopClient products={products} />
    </Suspense>
  );
}

