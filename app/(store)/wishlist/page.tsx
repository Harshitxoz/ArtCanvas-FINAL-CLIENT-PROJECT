"use client";
import { useWishlistStore } from "@/store/wishlist-store";
export default function WishlistPage(){const ids=useWishlistStore(s=>s.ids);return <section className="mx-auto max-w-4xl px-4 py-20 text-center"><h1 className="text-4xl font-bold">Wishlist</h1><p className="mt-3 text-black/60">{ids.length ? `${ids.length} saved item${ids.length===1?"":"s"}. Open products to manage them.` : "Save artwork you love and come back to it later."}</p></section>}
