"use client";

import Link from "next/link";
import Image from "next/image";
import { Trash2, ArrowRight } from "lucide-react";
import { useCartStore } from "@/store/cart-store";
import { formatINR } from "@/lib/utils";
import { Button } from "@/components/ui/Button";

interface CartClientProps {
  freeShippingThreshold?: number;
  shippingFee?: number;
}

export function CartClient({
  freeShippingThreshold = 999,
  shippingFee = 99,
}: CartClientProps) {
  const { items, removeItem, updateQuantity } = useCartStore();

  const subtotal = items.reduce((acc, item) => acc + item.price * item.quantity, 0);
  const isFreeShipping = subtotal >= freeShippingThreshold || subtotal === 0;
  const shipping = isFreeShipping ? 0 : shippingFee;
  const total = subtotal + shipping;

  if (!items.length) {
    return (
      <section className="mx-auto max-w-3xl px-4 py-20 text-center sm:py-24">
        <h1 className="font-serif text-3xl font-bold sm:text-4xl text-neutral-900">
          Your cart is empty
        </h1>
        <p className="mt-3 text-sm sm:text-base text-black/60 max-w-md mx-auto">
          Explore our collection of hand-painted originals and premium prints to find the perfect artwork for your space.
        </p>
        <Link href="/shop" className="mt-7 inline-block">
          <Button className="bg-[#9a5d19] px-7 py-3 text-white hover:bg-[#7f4b12] inline-flex items-center gap-2">
            Explore Artwork
            <ArrowRight size={16} />
          </Button>
        </Link>
      </section>
    );
  }

  return (
    <section className="mx-auto grid max-w-7xl gap-8 px-4 py-10 sm:px-6 sm:py-12 lg:grid-cols-[minmax(0,1fr)_380px] lg:gap-10 lg:px-8">
      {/* Items List */}
      <div>
        <h1 className="font-serif text-3xl font-bold sm:text-4xl text-neutral-900">Your Cart</h1>
        <p className="mt-1 text-sm text-black/55">{items.length} unique artwork item{items.length > 1 ? "s" : ""}</p>

        <div className="mt-8 grid gap-4">
          {items.map((item) => {
            const itemKey = `${item.productId}-${item.size}-${item.frame ?? "unframed"}`;
            return (
              <div
                key={itemKey}
                className="flex gap-4 rounded-2xl border border-black/8 bg-white p-4 shadow-sm sm:p-5"
              >
                <div className="relative h-24 w-20 shrink-0 overflow-hidden rounded-xl bg-[#eee9e1] sm:h-28 sm:w-24">
                  <Image
                    src={item.image}
                    alt={item.title}
                    fill
                    sizes="100px"
                    className="object-cover"
                  />
                </div>

                <div className="min-w-0 flex-1 flex flex-col justify-between">
                  <div>
                    <Link
                      href={`/products/${item.slug}`}
                      className="break-words font-serif text-lg font-bold text-neutral-900 hover:text-[#9a5d19] transition"
                    >
                      {item.title}
                    </Link>
                    <p className="mt-0.5 text-xs sm:text-sm text-black/55">
                      Size: {item.size} {item.frame === "framed" ? " · Museum Framed" : " · Unframed Canvas"}
                    </p>
                    <p className="mt-1 font-semibold text-neutral-900">{formatINR(item.price)}</p>
                  </div>

                  <div className="mt-3 flex items-center justify-between gap-2">
                    <div className="flex items-center rounded-full border border-black/15 bg-neutral-50">
                      <button
                        type="button"
                        className="px-3 py-1 text-sm font-semibold hover:bg-black/5 rounded-l-full transition"
                        aria-label="Decrease quantity"
                        onClick={() => updateQuantity(item.productId, item.size, item.quantity - 1, item.frame)}
                      >
                        −
                      </button>
                      <span className="w-8 text-center text-sm font-mono font-medium">{item.quantity}</span>
                      <button
                        type="button"
                        className="px-3 py-1 text-sm font-semibold hover:bg-black/5 rounded-r-full transition"
                        aria-label="Increase quantity"
                        onClick={() => updateQuantity(item.productId, item.size, item.quantity + 1, item.frame)}
                      >
                        +
                      </button>
                    </div>

                    <button
                      type="button"
                      className="shrink-0 rounded-full p-2 text-black/45 transition hover:bg-red-50 hover:text-red-600"
                      onClick={() => removeItem(item.productId, item.size, item.frame)}
                      aria-label={`Remove ${item.title} from cart`}
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Order Summary Sidebar */}
      <aside className="h-fit rounded-3xl bg-[#f1ece5] p-6 sm:p-7 shadow-sm">
        <h2 className="font-serif text-2xl font-bold text-neutral-900">Order Summary</h2>

        <div className="mt-6 grid gap-3.5 text-sm">
          <div className="flex justify-between text-neutral-700">
            <span>Subtotal</span>
            <span className="font-semibold text-neutral-900">{formatINR(subtotal)}</span>
          </div>
          <div className="flex justify-between text-neutral-700">
            <span>Delivery & Packaging</span>
            <span className="font-semibold text-neutral-900">
              {shipping ? formatINR(shipping) : <strong className="text-emerald-700 font-semibold">FREE</strong>}
            </span>
          </div>
          <div className="my-1 border-t border-black/10" />
          <div className="flex justify-between text-lg">
            <span className="font-semibold text-neutral-900">Estimated Total</span>
            <span className="font-bold text-neutral-900">{formatINR(total)}</span>
          </div>
        </div>

        <Link href="/checkout" className="mt-7 block">
          <Button className="w-full bg-[#9a5d19] py-3.5 text-white hover:bg-[#7f4b12] shadow">
            Proceed to Checkout →
          </Button>
        </Link>

        <p className="mt-3 text-center text-xs text-black/55">
          {isFreeShipping
            ? "✨ Your order qualifies for free insured delivery across India."
            : `Add ${formatINR(freeShippingThreshold - subtotal)} more for free delivery.`}
        </p>
      </aside>
    </section>
  );
}
