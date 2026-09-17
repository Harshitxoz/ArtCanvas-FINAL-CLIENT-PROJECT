"use client";
import Link from "next/link";
import Image from "next/image";
import { Trash2 } from "lucide-react";
import { useCartStore } from "@/store/cart-store";
import { formatINR } from "@/lib/utils";
import { SHIPPING_FEE, FREE_SHIPPING_THRESHOLD } from "@/lib/constants";
import { Button } from "@/components/ui/Button";

export function CartClient() {
  const {items,removeItem,updateQuantity} = useCartStore();
  const subtotal = items.reduce((s,i)=>s+i.price*i.quantity,0);
  const shipping = subtotal >= FREE_SHIPPING_THRESHOLD || subtotal===0 ? 0 : SHIPPING_FEE;
  const total = subtotal + shipping;
  if (!items.length) return <div className="mx-auto max-w-3xl px-4 py-20 text-center"><h1 className="text-4xl font-bold">Your cart is empty</h1><p className="mt-3 text-black/60">Find a piece that makes your space feel like home.</p><Link href="/shop" className="mt-7 inline-block rounded-full bg-[#9a5d19] px-6 py-3 font-semibold text-white">Explore Artwork</Link></div>;
  return <div className="mx-auto grid max-w-7xl gap-10 px-4 py-12 lg:grid-cols-[1fr_380px] lg:px-8"><div><h1 className="text-4xl font-bold">Your Cart</h1><div className="mt-8 grid gap-4">{items.map(i=><div key={`${i.productId}-${i.size}-${i.frame ?? "unframed"}`} className="flex gap-4 rounded-2xl border border-black/8 bg-white p-4"><div className="relative h-28 w-24 shrink-0 overflow-hidden rounded-xl bg-[#eee9e1]"><Image src={i.image} alt={i.title} fill sizes="100px" className="object-cover"/></div><div className="min-w-0 flex-1"><Link href={`/products/${i.slug}`} className="font-serif text-xl font-bold">{i.title}</Link><p className="mt-1 text-sm text-black/55">{i.size}{i.frame === "framed" ? " · Framed" : ""}</p><p className="mt-2 font-semibold">{formatINR(i.price)}</p><div className="mt-3 flex items-center justify-between"><div className="flex items-center rounded-full border"><button className="px-3 py-1" aria-label="Decrease quantity" onClick={()=>updateQuantity(i.productId,i.size,i.quantity-1,i.frame)}>-</button><span>{i.quantity}</span><button className="px-3 py-1" aria-label="Increase quantity" onClick={()=>updateQuantity(i.productId,i.size,i.quantity+1,i.frame)}>+</button></div><button onClick={()=>removeItem(i.productId,i.size,i.frame)} aria-label={`Remove ${i.title}`}><Trash2 size={18}/></button></div></div></div>)}</div></div><aside className="h-fit rounded-3xl bg-[#f1ece5] p-6"><h2 className="text-2xl font-bold">Order Summary</h2><div className="mt-6 grid gap-3 text-sm"><div className="flex justify-between"><span>Subtotal</span><b>{formatINR(subtotal)}</b></div><div className="flex justify-between"><span>Shipping</span><b>{shipping ? formatINR(shipping) : "Free"}</b></div><div className="my-2 border-t border-black/10"></div><div className="flex justify-between text-lg"><span>Total</span><b>{formatINR(total)}</b></div></div><Link href="/checkout" className="mt-7 block"><Button className="w-full">Proceed to Checkout</Button></Link><p className="mt-3 text-center text-xs text-black/50">Free shipping above ₹999</p></aside></div>;
}
