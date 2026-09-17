"use client";
import { useState } from "react";
import { useCartStore } from "@/store/cart-store";
import type { Product } from "@/types";
import { Button } from "@/components/ui/Button";
import { formatINR } from "@/lib/utils";
import { toast } from "sonner";

export function AddToCart({ product }: { product: Product }) {
  const [index, setIndex] = useState(0);
  const [frame, setFrame] = useState<"unframed" | "framed">("unframed");
  const [qty, setQty] = useState(1);
  const add = useCartStore(s => s.addItem);
  const size = product.sizes[index];
  const supported = product.frameAvailable === true;
  const delta = supported ? Math.max(0, Number(product.framedPrice || 0) - Number(product.unframedPrice || 0)) : 0;
  const unit = size.price + (supported && frame === "framed" ? delta : 0);
  const maxQty = Math.min(Math.max(size.stock || 1, 1), 20);
  return <div className="mt-7">
    <label className="text-sm font-semibold">Canvas size</label>
    <div className="mt-3 grid grid-cols-2 gap-2">{product.sizes.map((s, i) => <button key={s.label} type="button" onClick={() => setIndex(i)} className={`rounded-xl border p-3 text-left ${i === index ? "border-[#9a5d19] bg-[#9a5d19]/5" : "border-black/10"}`}><span className="block text-sm font-semibold">{s.label}</span><span className="text-sm text-black/60">{formatINR(s.price)}</span></button>)}</div>
    {supported ? (
      <fieldset className="mt-6">
        <legend className="text-sm font-semibold">Frame</legend>
        <div className="mt-3 grid grid-cols-2 gap-2" role="radiogroup" aria-label="Choose a frame option">
          <button type="button" role="radio" aria-checked={frame === "unframed"} onClick={() => setFrame("unframed")} className={`rounded-xl border p-3 text-left ${frame === "unframed" ? "border-[#9a5d19] bg-[#9a5d19]/5" : "border-black/10"}`}>
            <span className="block text-sm font-semibold">Unframed</span>
            <span className="mt-0.5 block text-xs text-black/55">Canvas only</span>
          </button>
          <button type="button" role="radio" aria-checked={frame === "framed"} onClick={() => setFrame("framed")} className={`rounded-xl border p-3 text-left ${frame === "framed" ? "border-[#9a5d19] bg-[#9a5d19]/5" : "border-black/10"}`}>
            <span className="block text-sm font-semibold">Framed</span>
            <span className="mt-0.5 block text-xs text-black/55">{delta > 0 ? `+ ${formatINR(delta)} framing` : "Ready to hang"}</span>
          </button>
        </div>
      </fieldset>
    ) : null}
    <div className="mt-6 flex items-center gap-3"><div className="flex items-center rounded-full border border-black/10"><button type="button" className="px-4 py-2" onClick={() => setQty(Math.max(1, qty-1))}>−</button><span className="w-8 text-center">{qty}</span><button type="button" className="px-4 py-2" onClick={() => setQty(Math.min(maxQty, qty+1))}>+</button></div><Button className="flex-1" disabled={size.stock < 1} onClick={() => { add({ productId: String(product._id || product.slug), title: product.title, slug: product.slug, image: product.images[0], size: size.label, price: unit, quantity: qty, ...(supported ? { frame } : {}) }); toast.success("Added to cart"); }}>Add to Cart · {formatINR(unit * qty)}</Button></div>
  </div>;
}
