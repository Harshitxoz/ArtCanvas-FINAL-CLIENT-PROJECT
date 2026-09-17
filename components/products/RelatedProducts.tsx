import Link from "next/link";
import Image from "next/image";
import { getProducts } from "@/lib/queries";
import { formatINR } from "@/lib/utils";
import { minPrice } from "@/lib/product";
import type { Product } from "@/types";

export async function RelatedProducts({ product }: { product: Product }) {
  const pool = await getProducts({ category: product.category });
  const related = pool.filter((p) => p.slug !== product.slug).slice(0, 4);
  const fallback = related.length
    ? related
    : (await getProducts({ artType: product.artType })).filter((p) => p.slug !== product.slug).slice(0, 4);
  if (!fallback.length) return null;
  return (
    <section aria-labelledby="related-artworks" className="mt-16">
      <div className="flex items-end justify-between">
        <h2 id="related-artworks" className="font-serif text-3xl font-bold">You may also like</h2>
        <Link href="/shop" className="text-sm font-semibold text-[#9a5d19]">View all →</Link>
      </div>
      <div className="mt-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        {fallback.map((p) => (
          <Link key={String(p._id || p.slug)} href={`/products/${p.slug}`} className="group overflow-hidden rounded-2xl bg-white shadow-sm transition hover:shadow-md">
            <span className="relative block aspect-[4/5] bg-[#eee9e1]">
              {p.images[0] ? <Image src={p.images[0]} alt={p.title} fill sizes="(max-width: 1024px) 50vw, 25vw" className="object-cover transition duration-500 group-hover:scale-105" /> : null}
            </span>
            <span className="block p-4">
              <span className="block truncate font-serif text-lg font-bold">{p.title}</span>
              <span className="mt-1 block text-sm font-semibold">{formatINR(minPrice(p))}</span>
            </span>
          </Link>
        ))}
      </div>
    </section>
  );
}
