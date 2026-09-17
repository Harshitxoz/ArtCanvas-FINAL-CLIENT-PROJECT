import Link from "next/link";

export function Footer() {
  return <footer className="mt-20 bg-[#17130f] text-white">
    <div className="mx-auto grid max-w-7xl gap-10 px-4 py-14 sm:px-6 md:grid-cols-4 lg:px-8">
      <div className="md:col-span-2"><div className="font-serif text-3xl font-bold">Art<span className="text-[#d89442]">Canvas</span></div><p className="mt-4 max-w-md text-sm leading-6 text-white/65">Original hand-painted artwork and premium printed canvases for homes, offices and meaningful spaces.</p></div>
      <div><h3 className="font-semibold">Shop</h3><div className="mt-4 grid gap-3 text-sm text-white/65"><Link href="/shop">All Art</Link><Link href="/hand-painted">Hand-Painted</Link><Link href="/printed-canvas">Printed Canvas</Link><Link href="/categories">Categories</Link></div></div>
      <div><h3 className="font-semibold">Help</h3><div className="mt-4 grid gap-3 text-sm text-white/65"><Link href="/shipping">Shipping</Link><Link href="/returns">Returns</Link><Link href="/contact">Contact</Link><Link href="/privacy">Privacy</Link><Link href="/terms">Terms</Link></div></div>
    </div>
    <div className="border-t border-white/10 px-4 py-5 text-center text-xs text-white/45">© {new Date().getFullYear()} ArtCanvas. All rights reserved.</div>
  </footer>;
}
