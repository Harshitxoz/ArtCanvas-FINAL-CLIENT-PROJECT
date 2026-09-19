import Link from "next/link";
import Image from "next/image";
import { getCategories } from "@/lib/queries";

export const metadata = {
  title: "Art Categories & Collections | ArtCanvas",
  description: "Browse original hand-painted canvases and fine art prints by category and style.",
};

export default async function CategoriesPage() {
  const categories = await getCategories();
  const defaultImage = "https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?auto=format&fit=crop&w=600&q=80";

  return (
    <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <p className="text-xs font-bold uppercase tracking-[.25em] text-[#9a5d19]">Collections</p>
      <h1 className="mt-2 text-3xl font-bold sm:text-5xl">Shop by Category</h1>
      <p className="mt-3 text-neutral-600 max-w-2xl text-sm sm:text-base">
        Explore curated artwork collections tailored to every aesthetic, from vibrant modern abstracts to serene botanical and spiritual compositions.
      </p>

      <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {categories.map((c) => (
          <Link
            key={c.slug}
            href={`/categories/${c.slug}`}
            className="group overflow-hidden rounded-3xl bg-white shadow-sm border border-black/5 transition hover:shadow-md"
          >
            <div className="relative aspect-[4/3] bg-neutral-100 overflow-hidden">
              <Image
                src={c.image || defaultImage}
                alt={c.name}
                fill
                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                className="object-cover transition duration-500 group-hover:scale-105"
              />
            </div>
            <div className="p-5">
              <h2 className="text-xl font-bold text-neutral-900 group-hover:text-[#9a5d19] transition">
                {c.name}
              </h2>
              {c.description && (
                <p className="mt-2 text-sm leading-6 text-neutral-500 line-clamp-2">
                  {c.description}
                </p>
              )}
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
