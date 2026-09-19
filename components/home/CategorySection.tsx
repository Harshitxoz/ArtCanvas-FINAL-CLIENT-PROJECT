import Link from "next/link";
import Image from "next/image";
import { getCategories } from "@/lib/queries";

export async function CategorySection() {
  const categories = await getCategories();
  const defaultImage = "https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?auto=format&fit=crop&w=600&q=80";

  return (
    <section className="bg-white py-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-[.25em] text-[#9a5d19]">Browse by style</p>
            <h2 className="mt-2 text-3xl font-bold sm:text-4xl">Shop by Category</h2>
          </div>
          <Link href="/categories" className="hidden font-semibold sm:block">View all →</Link>
        </div>
        <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-4 lg:grid-cols-8">
          {categories.map((c) => (
            <Link href={`/categories/${c.slug}`} key={c.slug} className="group text-center">
              <div className="relative mx-auto aspect-square max-w-[130px] overflow-hidden rounded-full border-4 border-white shadow-md bg-[#eee9e1]">
                <Image
                  src={c.image || defaultImage}
                  alt={c.name}
                  fill
                  sizes="130px"
                  className="object-cover transition duration-500 group-hover:scale-110"
                />
              </div>
              <p className="mt-3 text-sm font-semibold">{c.name}</p>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
