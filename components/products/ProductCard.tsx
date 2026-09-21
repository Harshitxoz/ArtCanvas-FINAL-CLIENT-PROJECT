"use client";
import Image from "next/image";
import Link from "next/link";
import { Heart, Eye } from "lucide-react";
import { useWishlistStore } from "@/store/wishlist-store";
import { useCartStore } from "@/store/cart-store";
import { formatINR } from "@/lib/utils";
import { toast } from "sonner";
import { minPrice, totalStock, sizeDiscount } from "@/lib/product";
import type { Product, ProductSize } from "@/types";
import { Badge } from "@/components/ui/Badge";
import { StatusBadge } from "@/components/admin/StatusBadge";

type DisplayProduct = Product & { status?: Product["status"]; active?: boolean };

function firstImage(p: Product): string {
  const src = p.images && p.images[0];
  return src || "https://images.unsplash.com/photo-1500534623283-312aade485b7?auto=format&fit=crop&w=700&q=85";
}

export function ProductCard({ product }: { product: DisplayProduct }) {
  const id = String(product._id || product.slug);
  const toggle = useWishlistStore(s => s.toggle);
  const has = useWishlistStore(s => s.has(id));
  const add = useCartStore(s => s.addItem);
  const min = minPrice(product);
  const stock = totalStock(product);
  const sizes = product.sizes || [];
  // Default to the cheapest in-stock size so cart gets the exact selected size/price.
  const inStock = sizes.filter(s => (s.stock || 0) > 0);
  const size = (inStock.length ? inStock : sizes).slice().sort((a, b) => a.price - b.price)[0];
  const primary = product.images && product.images[0];
  const compareAt = size?.compareAt;
  const discount = size && compareAt && compareAt > size.price ? sizeDiscount(size.price, compareAt) : 0;

  return (
    <article className="group flex h-full flex-col">
      <div className="relative overflow-hidden rounded-2xl bg-[#eee9e1]">
        <Link href={(("/products/" + product.slug) as never)} className="block aspect-[4/5] relative">
          <Image src={firstImage(product)} alt={product.title} fill sizes="(max-width: 640px) 50vw, (max-width: 1024px) 25vw, 20vw" className="object-cover transition duration-700 group-hover:scale-105" />
        </Link>
        {product.status === "archived" && <StatusBadge value="archived" />}
        {stock <= 0 && <div className="absolute inset-0 grid place-items-center rounded-2xl bg-black/30"><span className="rounded-full bg-red-600 px-4 py-1.5 text-xs font-bold text-white">SOLD OUT</span></div>}
        <div className="absolute left-3 top-3 max-w-[calc(100%-3.75rem)]">
          <Badge className="truncate px-2.5 py-1 text-[10px] xs:text-xs sm:px-3">{product.artType === "hand-painted" ? "Original Hand-Painted" : "Printed Canvas"}</Badge>
        </div>
        <div className="absolute right-3 top-3 flex flex-col gap-1.5 opacity-100 transition lg:opacity-0 lg:group-hover:opacity-100 lg:focus-within:opacity-100">
          <button onClick={() => toggle(id)} className="grid h-9 w-9 place-items-center rounded-full bg-white/90 shadow xs:h-10 xs:w-10" aria-label="Toggle wishlist"><Heart size={18} fill={has ? "currentColor" : "none"} className={has ? "text-[#9a5d19]" : ""} /></button>
        </div>
      </div>
      <div className="flex flex-1 flex-col pt-4 min-w-0">
        <Link href={(("/products/" + product.slug) as never)} title={product.title} className="block min-w-0">
          <h3 className="truncate font-serif text-lg font-bold sm:text-xl">{product.title}</h3>
        </Link>
        <p className="mt-1 text-sm capitalize text-black/50">{product.category.replace("-", " ")}</p>
        <div className="mt-2 flex flex-wrap items-baseline gap-2 font-semibold">
          <span>{sizes.length > 1 ? "From " : ""}{formatINR(size ? size.price : min)}</span>
          {discount > 0 && compareAt ? <span className="text-xs font-normal text-black/50"><s>{formatINR(compareAt)}</s> <span className="font-semibold text-[#1f7a4d]">{discount}% off</span></span> : null}
        </div>
        <button
          disabled={stock < 1 || !size}
          onClick={() => {
            if (!size) return;
            add({ productId: id, title: product.title, slug: product.slug, image: primary || firstImage(product), size: size.label, price: size.price, quantity: 1 });
            toast.success(`Added "${product.title}" (${size.label}) to cart`);
          }}
          className="mt-3 w-full rounded-full border border-[#9a5d19] py-2 text-sm font-semibold text-[#9a5d19] hover:bg-[#9a5d19]/5 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {stock < 1 ? "SOLD OUT" : "Add to Cart"}
        </button>
      </div>
    </article>
  );
}

