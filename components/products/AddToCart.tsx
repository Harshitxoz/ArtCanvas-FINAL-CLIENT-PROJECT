"use client";
import { useState } from "react";
import { useCartStore } from "@/store/cart-store";
import type { Product } from "@/types";
import { Button } from "@/components/ui/Button";
import { formatINR } from "@/lib/utils";
import { toast } from "sonner";

export function AddToCart({ product }: { product: Product }) {
  const [index, setIndex] = useState(0);
  const [qty, setQty] = useState(1);
  const add = useCartStore(s => s.addItem);
  const size = product.sizes[index];
  return <div className="mt-7">
    <label className="text-sm font-semibold">Canvas size</label>
    <div className="mt-3 grid grid-cols-2 gap-2">{product.sizes.map((s, i) => <button key={s.label} onClick={() => setIndex(i)} className={`rounded-xl border p-3 text-left ${i === index ? "border-[#9a5d19] bg-[#9a5d19]/5" : "border-black/10"}`}><span className="block text-sm font-semibold">{s.label}</span><span className="text-sm text-black/60">{formatINR(s.price)}</span></button>)}</div>
    <div className="mt-5 flex items-center gap-3"><div className="flex items-center rounded-full border border-black/10"><button className="px-4 py-2" onClick={() => setQty(Math.max(1, qty-1))}>−</button><span className="w-8 text-center">{qty}</span><button className="px-4 py-2" onClick={() => setQty(Math.min(size.stock, qty+1))}>+</button></div><Button className="flex-1" disabled={size.stock < 1} onClick={() => { add({ productId: String(product._id || product.slug), title: product.title, slug: product.slug, image: product.images[0], size: size.label, price: size.price, quantity: qty }); toast.success("Added to cart"); }}>Add to Cart · {formatINR(size.price * qty)}</Button></div>
  </div>;
}
