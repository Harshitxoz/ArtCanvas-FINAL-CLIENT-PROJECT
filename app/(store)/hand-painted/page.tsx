import { getStoreProducts } from "@/lib/queries";
import { ShopClient } from "@/components/products/ShopClient";
import { HandPaintedHero } from "@/components/home/HandPaintedHero";
import { HandPaintedStory } from "@/components/home/HandPaintedStory";
import { HandPaintedFeatures } from "@/components/home/HandPaintedFeatures";
import { Suspense } from "react";

export const metadata = {
  title: "Hand-Painted Art — Original Paintings | ArtCanvas",
  description: "Original hand-painted artwork with visible brushwork and texture.",
};

export default async function HandPaintedPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const products = await getStoreProducts({
    artType: "hand-painted",
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
      <HandPaintedHero />
      <HandPaintedFeatures />

      <div id="hand-painted-collection" className="scroll-mt-24 bg-[#fffdf9]">
        <Suspense fallback={null}>
          <ShopClient
            products={products}
            title="Hand-Painted Collection"
            eyebrow="Originals"
            intro="Original pieces with visible brushwork, texture and personality. Every painting is made to be a statement piece."
            basePath="/hand-painted"
            lockedType="hand-painted"
            headingLevel="h2"
          />
        </Suspense>
      </div>

      <HandPaintedStory />
    </>
  );
}
