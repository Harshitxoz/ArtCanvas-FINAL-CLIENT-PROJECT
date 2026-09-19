import { Badge } from "@/components/ui/Badge";
import { formatINR } from "@/lib/utils";
import { minPrice, sizeDiscount, totalStock } from "@/lib/product";
import type { Product } from "@/types";

export function ProductInfo({ product, rating, reviewCount }: { product: Product; rating: number; reviewCount: number }) {
  const sizes = product.sizes || [];
  const first = sizes[0];
  const compareAt = first?.compareAt;
  const discount = first ? sizeDiscount(first.price, compareAt) : 0;
  const total = totalStock(product);
  const min = sizes.length ? minPrice(product) : 0;
  return (
    <div className="lg:pt-2">
      <div className="flex flex-wrap items-center gap-2">
        <Badge>{product.artType === "hand-painted" ? "Original Hand-Painted" : "Premium Printed Canvas"}</Badge>
        {product.bestseller ? <span className="inline-flex rounded-full bg-[#17130f] px-3 py-1 text-xs font-semibold uppercase tracking-wide text-white">Bestseller</span> : null}
        {product.newArrival ? <span className="inline-flex rounded-full bg-white px-3 py-1 text-xs font-semibold uppercase tracking-wide text-[#9a5d19] ring-1 ring-[#9a5d19]/30">New Arrival</span> : null}
      </div>
      <h1 className="mt-4 break-words font-serif text-3xl font-bold leading-tight sm:text-4xl lg:text-5xl">{product.title}</h1>
      {product.artist ? <p className="mt-2 text-sm font-medium tracking-wide text-black/55">by {product.artist}</p> : null}
      <p className="mt-1 text-xs uppercase tracking-[0.2em] text-black/45">{product.artType === "hand-painted" ? "Original artwork" : "Canvas print"} · <span className="capitalize">{product.category.replace(/-/g, " ")}</span></p>
      {reviewCount > 0 ? (
        <p className="mt-3 flex items-center gap-2 text-sm" aria-label={`Rated ${rating.toFixed(1)} out of 5 from ${reviewCount} reviews`}>
          <span aria-hidden="true" className="text-base tracking-tight text-[#9a5d19]">{"★".repeat(Math.round(rating))}{"☆".repeat(Math.max(0, 5 - Math.round(rating)))}</span>
          <span className="font-semibold">{rating.toFixed(1)}</span>
          <a href="#customer-reviews" className="text-black/55 underline-offset-4 hover:underline">({reviewCount} review{reviewCount === 1 ? "" : "s"})</a>
        </p>
      ) : null}
      <div className="mt-4 flex flex-wrap items-baseline gap-3">
        <p className="text-3xl font-bold">{formatINR(min)}</p>
        {compareAt && first && compareAt > first.price ? (
          <p className="text-sm text-black/50"><s>{formatINR(compareAt)}</s> <span className="ml-1 font-bold text-[#1f7a4d]">{discount}% off</span></p>
        ) : null}
        {sizes.length > 1 ? <span className="text-sm font-normal text-black/45">starting price</span> : null}
      </div>
      <p className="mt-2 text-sm font-semibold" role="status">
        {total <= 0 ? <span className="text-red-700">Sold out</span> : total <= 3 ? <span className="text-[#9a5d19]">Low stock</span> : <span className="text-[#1f7a4d]">In stock</span>}
      </p>
      <p className="mt-5 leading-8 text-black/65">{product.description}</p>
      <dl className="mt-7 grid gap-3 rounded-2xl bg-[#f3eee7] p-5 text-sm sm:grid-cols-3">
        <div><dt className="font-bold">Material</dt><dd className="mt-1 text-black/60">{product.canvasMaterial || "Gallery-grade canvas"}</dd></div>
        <div><dt className="font-bold">Type</dt><dd className="mt-1 text-black/60">{product.medium || (product.artType === "hand-painted" ? "Original artwork" : "Canvas print")}</dd></div>
        <div><dt className="font-bold">Delivery</dt><dd className="mt-1 text-black/60">{product.deliveryTime || "Packed with care"}</dd></div>
      </dl>
    </div>
  );
}

