
import { getStoreProducts } from "@/lib/queries";
import { ShopClient } from "@/components/products/ShopClient";
import categories from "@/data/categories.json";
import { notFound } from "next/navigation";
import { Suspense } from "react";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const cat = categories.find(c => c.slug === slug);
  if (!cat) return { title: "Category not found" };
  return { title: cat.name + " Art — " + cat.description + " | ArtCanvas", description: cat.description };
}

export default async function CategoryPage({ params, searchParams }: { params: Promise<{ slug: string }>; searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const { slug } = await params;
  const sp = await searchParams;
  const cat = categories.find(c => c.slug === slug);
  if (!cat) notFound();
  const products = await getStoreProducts({
    category: slug,
    search: typeof sp.q === "string" ? sp.q : undefined,
    minPrice: typeof sp.minPrice === "string" ? sp.minPrice : undefined,
    maxPrice: typeof sp.maxPrice === "string" ? sp.maxPrice : undefined,
    frame: typeof sp.frame === "string" ? sp.frame : undefined,
    availability: typeof sp.availability === "string" ? sp.availability : undefined,
    artType: typeof sp.type === "string" ? sp.type : undefined,
    sizes: typeof sp.size === "string" ? [sp.size] : Array.isArray(sp.size) ? sp.size : undefined,
    sort: typeof sp.sort === "string" ? sp.sort : "featured",
  });
  return (
    <Suspense fallback={null}>
      <ShopClient
        products={products}
        title={cat.name}
        eyebrow={cat.name}
        intro={cat.description}
        basePath={`/categories/${slug}`}
        lockedCategory={slug}
      />
    </Suspense>
  );
}

