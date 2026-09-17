"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { useCartStore } from "@/store/cart-store";
import { formatINR } from "@/lib/utils";
import type { CartItem, Product } from "@/types";
import { toast } from "sonner";

type FrameChoice = "unframed" | "framed";

function stockLabel(stock: number): string {
  if (stock <= 0) return "Sold out";
  if (stock <= 3) return `Only ${stock} left`;
  return "In stock";
}

export function ProductPurchase({ product }: { product: Product }) {
  const sizes = product.sizes || [];
  const [sizeIndex, setSizeIndex] = useState(() => {
    const first = sizes.map((s, i) => ({ s, i }))
      .filter((x) => (x.s.stock || 0) > 0)
      .sort((a, b) => a.s.price - b.s.price)[0];
    return first ? first.i : 0;
  });
  const size = sizes[sizeIndex];
  const [frame, setFrame] = useState<FrameChoice>("unframed");
  const [qty, setQty] = useState(1);
  const add = useCartStore((s) => s.addItem);
  const router = useRouter();
  const supported = product.frameAvailable === true;
  const delta = supported ? Math.max(0, Number(product.framedPrice || 0) - Number(product.unframedPrice || 0)) : 0;
  const unit = (size ? size.price : 0) + (supported && frame === "framed" ? delta : 0);
  const stock = size ? size.stock || 0 : 0;
  const soldOut = !size || stock <= 0;
  const maxQty = Math.min(Math.max(stock, 1), 20);
  const safeQty = stock > 0 ? Math.min(Math.max(1, qty), maxQty) : 1;

  function item(): CartItem {
    if (!size) throw new Error("no-size");
    return {
      productId: String(product._id || product.slug),
      title: product.title, slug: product.slug, image: product.images[0],
      size: size.label, price: unit, quantity: safeQty,
      ...(supported ? { frame } : {}),
    };
  }
  function onAdd(): void { if (soldOut || !size) return; add(item()); toast.success(`Added "${product.title}" (${size.label}) to cart`); }
  function onBuy(): void { if (soldOut || !size) return; add(item()); router.push("/checkout"); }

  return (
    <div className="mt-7">
      <fieldset>
        <legend className="text-sm font-semibold">Canvas size</legend>
        <div className="mt-3 grid grid-cols-2 gap-2" role="radiogroup" aria-label="Choose a canvas size">
          {sizes.map((s, i) => {
            const out = (s.stock || 0) <= 0;
            const on = i === sizeIndex;
            const price = s.price + (supported && frame === "framed" ? delta : 0);
            return (
              <button key={s.label} type="button" role="radio" aria-checked={on} disabled={out}
                onClick={() => { setSizeIndex(i); setQty(1); }}
                className={`rounded-xl border p-3 text-left transition focus-visible:outline-2 focus-visible:outline-[#9a5d19] disabled:cursor-not-allowed disabled:opacity-45 ${on ? "border-[#9a5d19] bg-[#9a5d19]/5" : "border-black/10 hover:border-black/25"}`}>
                <span className="block text-sm font-semibold">{s.label}</span>
                <span className="mt-0.5 block text-sm text-black/60">{formatINR(price)}</span>
                <span className={`mt-1 block text-xs font-medium ${out ? "text-red-700" : (s.stock || 0) <= 3 ? "text-[#9a5d19]" : "text-black/45"}`}>{stockLabel(s.stock || 0)}</span>
              </button>
            );
          })}
        </div>
      </fieldset>
      {supported ? (
        <fieldset className="mt-6">
          <legend className="text-sm font-semibold">Frame</legend>
          <div className="mt-3 grid grid-cols-2 gap-2" role="radiogroup" aria-label="Choose a frame option">
            <button type="button" role="radio" aria-checked={frame === "unframed"} onClick={() => setFrame("unframed")}
              className={`rounded-xl border p-3 text-left transition focus-visible:outline-2 focus-visible:outline-[#9a5d19] ${frame === "unframed" ? "border-[#9a5d19] bg-[#9a5d19]/5" : "border-black/10 hover:border-black/25"}`}>
              <span className="block text-sm font-semibold">Unframed</span>
              <span className="mt-0.5 block text-xs text-black/55">Canvas only</span>
            </button>
            <button type="button" role="radio" aria-checked={frame === "framed"} onClick={() => setFrame("framed")}
              className={`rounded-xl border p-3 text-left transition focus-visible:outline-2 focus-visible:outline-[#9a5d19] ${frame === "framed" ? "border-[#9a5d19] bg-[#9a5d19]/5" : "border-black/10 hover:border-black/25"}`}>
              <span className="block text-sm font-semibold">Framed</span>
              <span className="mt-0.5 block text-xs text-black/55">{delta > 0 ? `+ ${formatINR(delta)} framing` : "Ready to hang"}</span>
            </button>
          </div>
        </fieldset>
      ) : null}
      <div className="mt-6 flex flex-wrap items-center gap-3">
        <div className="flex items-center rounded-full border border-black/10" role="group" aria-label="Choose quantity">
          <button type="button" aria-label="Decrease quantity" disabled={soldOut || safeQty <= 1} onClick={() => setQty(Math.max(1, safeQty - 1))} className="px-4 py-2 text-lg disabled:opacity-40">−</button>
          <span className="w-8 text-center tabular-nums" aria-live="polite" aria-label={`Quantity ${safeQty}`}>{safeQty}</span>
          <button type="button" aria-label="Increase quantity" disabled={soldOut || safeQty >= maxQty} onClick={() => setQty(Math.min(maxQty, safeQty + 1))} className="px-4 py-2 text-lg disabled:opacity-40">+</button>
        </div>
        {!soldOut && stock <= 20 ? <p className="text-xs text-black/50">Max {maxQty} per order</p> : null}
        {soldOut ? <p className="text-xs font-medium text-red-700">This size is currently unavailable.</p> : null}
      </div>
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <Button type="button" disabled={soldOut} onClick={onAdd} className="w-full">{soldOut ? "Sold Out" : `Add to Cart · ${formatINR(unit * safeQty)}`}</Button>
        <button type="button" disabled={soldOut} onClick={onBuy}
          className="inline-flex w-full items-center justify-center rounded-full border-2 border-[#17130f] px-5 py-3 text-sm font-semibold text-[#17130f] transition hover:bg-[#17130f] hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#9a5d19] disabled:cursor-not-allowed disabled:opacity-50">Buy Now</button>
      </div>
    </div>
  );
}
