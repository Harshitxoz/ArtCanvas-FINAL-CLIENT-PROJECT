"use client";
import Image from "next/image";
import { useMemo, useState } from "react";
import type { Product } from "@/types";

interface GalleryImage {
  src: string;
  label: string;
  fit: "cover" | "contain";
}

function labelsFor(product: Pick<Product, "title">): string {
  return product.title;
}

export function ProductGallery({ product }: { product: Product }) {
  const gallery = useMemo<GalleryImage[]>(() => {
    const title = labelsFor(product);
    const seen = new Set<string>();
    const list: GalleryImage[] = [];
    function push(src: string | undefined, label: string, fit: "cover" | "contain") {
      if (!src || typeof src !== "string" || !src.trim()) return;
      const clean = src.trim();
      if (seen.has(clean)) return;
      seen.add(clean);
      list.push({ src: clean, label: `${title} — ${label}`, fit });
    }
    for (const src of product.images || []) push(src, "Artwork", "cover");
    push(product.closeUp, "Close-up detail", "cover");
    push(product.roomPreview, "Room preview", "contain");
    push(product.authenticityImage, "Authenticity", "contain");
    return list;
  }, [product]);
  const [active, setActive] = useState(0);
  const safeActive = gallery.length ? Math.min(active, gallery.length - 1) : 0;
  const current = gallery[safeActive];
  const fallback = "https://images.unsplash.com/photo-1500534623283-312aade485b7?auto=format&fit=crop&w=1200&q=85";

  return (
    <div className="lg:sticky lg:top-24 lg:self-start">
      <div className="relative aspect-square overflow-hidden rounded-3xl bg-[#eee9e1] shadow-sm">
        {current ? (
          <Image
            key={current.src}
            src={current.src}
            alt={current.label}
            fill
            priority
            sizes="(max-width: 1024px) 100vw, 50vw"
            className={current.fit === "contain" ? "object-contain" : "object-cover"}
          />
        ) : (
          <Image src={fallback} alt={product.title} fill priority sizes="(max-width: 1024px) 100vw, 50vw" className="object-cover" />
        )}
        {gallery.length > 1 ? (
          <p className="absolute bottom-3 right-3 rounded-full bg-black/60 px-3 py-1 text-xs font-semibold tabular-nums text-white sm:hidden" aria-live="polite">
            {safeActive + 1} / {gallery.length}
          </p>
        ) : null}
      </div>

      {gallery.length > 1 ? (
        <>
          {/* Mobile swipeable strip */}
          <div className="-mx-4 mt-3 flex gap-3 overflow-x-auto px-4 pb-1 sm:hidden" role="group" aria-label="Product images">
            {gallery.map((img, i) => (
              <button
                key={img.src}
                type="button"
                onClick={() => setActive(i)}
                aria-label={`View image ${i + 1} of ${gallery.length}`}
                aria-current={i === safeActive}
                className={`relative aspect-square w-20 shrink-0 overflow-hidden rounded-xl border-2 transition focus-visible:outline-2 focus-visible:outline-[#9a5d19] ${i === safeActive ? "border-[#9a5d19]" : "border-transparent"}`}
              >
                <Image src={img.src} alt="" fill sizes="80px" className="object-cover" />
              </button>
            ))}
          </div>
          {/* Desktop thumbnail rail */}
          <div className="mt-3 hidden grid-cols-4 gap-3 sm:grid" role="group" aria-label="Product images">
            {gallery.map((img, i) => (
              <button
                key={img.src}
                type="button"
                onClick={() => setActive(i)}
                aria-label={`View image ${i + 1} of ${gallery.length}`}
                aria-current={i === safeActive}
                className={`relative aspect-square overflow-hidden rounded-xl border-2 transition hover:opacity-90 focus-visible:outline-2 focus-visible:outline-[#9a5d19] ${i === safeActive ? "border-[#9a5d19]" : "border-transparent"}`}
              >
                <Image src={img.src} alt="" fill sizes="120px" className="object-cover" />
              </button>
            ))}
          </div>
        </>
      ) : null}
    </div>
  );
}

