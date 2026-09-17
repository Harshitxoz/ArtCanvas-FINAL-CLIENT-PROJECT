import Link from "next/link";
import { getProducts } from "@/lib/queries";
import { ProductCard } from "@/components/products/ProductCard";

export async function FeaturedCollection() {
  const products = await getProducts({ featured: true });
  return <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8"><div className="flex items-end justify-between"><div><p className="text-xs font-bold uppercase tracking-[.25em] text-[#9a5d19]">Curated for you</p><h2 className="mt-2 text-4xl font-bold">Featured Collection</h2></div><Link href="/shop" className="font-semibold">View all →</Link></div><div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">{products.slice(0,4).map(p => <ProductCard key={String(p._id || p.slug)} product={p}/>)}</div></section>;
}
