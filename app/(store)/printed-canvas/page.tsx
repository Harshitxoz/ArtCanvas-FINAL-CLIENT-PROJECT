import { getStoreProducts } from "@/lib/queries";
import { ShopClient } from "@/components/products/ShopClient";
import { PrintedCanvasHero } from "@/components/home/PrintedCanvasHero";
import { PrintedCanvasRooms } from "@/components/home/PrintedCanvasRooms";
import Image from "next/image";
import { Suspense } from "react";

export const metadata = {
  title: "Printed Canvas — Premium Canvas Prints | ArtCanvas",
  description: "Premium printed canvas reproductions for adding beautiful art to your space.",
};

export default async function PrintedPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const products = await getStoreProducts({
    artType: "printed-canvas",
    category: typeof params.category === "string" ? params.category : undefined,
    search: typeof params.q === "string" ? params.q : undefined,
    minPrice: typeof params.minPrice === "string" ? params.minPrice : undefined,
    maxPrice: typeof params.maxPrice === "string" ? params.maxPrice : undefined,
    frame: typeof params.frame === "string" ? params.frame : undefined,
    availability: typeof params.availability === "string" ? params.availability : undefined,
    sizes:
      typeof params.size === "string"
        ? [params.size]
        : Array.isArray(params.size)
          ? params.size
          : undefined,
    sort: typeof params.sort === "string" ? params.sort : "featured",
  });

  return (
    <>
      <PrintedCanvasHero />

      <section className="mx-auto max-w-7xl px-4 pt-10 sm:px-6 lg:px-8">
        <div className="grid gap-4 md:grid-cols-4">
          {[
            ["Museum-Grade Printing", "Sharp detail and rich colour for a gallery-style finish."],
            ["Multiple Sizes", "Choose the dimensions that fit your wall and your room."],
            ["Made for Living Spaces", "Designed around bedrooms, living rooms, offices and gallery walls."],
            ["Easy to Hang", "A polished finish that looks ready for display."],
          ].map(([title, text]) => (
            <div key={title} className="rounded-2xl border border-black/8 bg-white p-5">
              <p className="font-serif text-xl">{title}</p>
              <p className="mt-2 text-sm leading-6 text-black/55">{text}</p>
            </div>
          ))}
        </div>
      </section>

      <PrintedCanvasRooms />

      <div id="printed-canvas-collection" className="scroll-mt-24">
        <Suspense fallback={null}>
          <ShopClient
            products={products}
            title="Printed Canvas Collection"
            eyebrow="Premium Prints"
            intro="High-quality canvas reproductions that bring colour, calm and character into everyday spaces."
            basePath="/printed-canvas"
            lockedType="printed-canvas"
          />
        </Suspense>
      </div>

      <section className="bg-[#f4efe7] px-4 py-14 sm:px-6 sm:py-20 lg:px-8">
        <div className="mx-auto grid max-w-7xl items-center overflow-hidden rounded-[2rem] bg-white lg:grid-cols-2">
          <div className="relative min-h-[280px] overflow-hidden rounded-[1.5rem] sm:min-h-[350px]">
            <Image
              src="/images/hand-painted-materials.png"
              alt="Close-up of premium canvas texture and rich printed colour in warm light"
              fill
              sizes="(max-width: 1024px) 100vw, 50vw"
              className="object-cover"
            />
            <div className="absolute inset-0 bg-black/15" aria-hidden="true" />
            <div className="absolute left-5 top-5 rounded-full border border-white/30 bg-black/30 px-4 py-2 text-xs font-semibold text-white backdrop-blur">
              See the difference
            </div>
          </div>
          <div className="p-8 sm:p-10 lg:p-14">
            <p className="text-xs font-bold uppercase tracking-[0.28em] text-[#9a5d19]">Made for modern spaces</p>
            <h2 className="mt-3 font-serif text-4xl leading-tight sm:text-5xl">See how premium canvas changes a room.</h2>
            <p className="mt-5 text-sm leading-7 text-black/60">
              Sharp detail, rich colour and a clean gallery-style finish — printed on quality canvas and ready to hang in the rooms where life happens.
            </p>
            <div className="mt-7 grid gap-3 sm:grid-cols-2">
              {["Vibrant colour", "Premium canvas material", "Multiple size options", "Easy to style"].map((item) => (
                <div key={item} className="rounded-2xl border border-black/8 bg-[#fdfbf7] p-4 text-sm font-semibold">
                  {item}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </>
  );
}