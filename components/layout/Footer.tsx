import Link from "next/link";

export function Footer({ storeName, tagline, email, phone, whatsapp, instagram, address }: { storeName?: string; tagline?: string; email?: string; phone?: string; whatsapp?: string; instagram?: string; address?: string }) {
  const name = storeName || "ArtCanvas";
  const parts = name.match(/^(.*?)(Canvas)$/i);
  const contactLines = [email, phone, whatsapp ? `WhatsApp: ${whatsapp}` : "", address].filter((v): v is string => Boolean(v && v.trim()));
  return <footer className="mt-20 bg-[#17130f] text-white">
    <div className="mx-auto grid max-w-7xl gap-10 px-4 py-14 sm:px-6 md:grid-cols-4 lg:px-8">
      <div className="md:col-span-2"><div className="font-serif text-3xl font-bold">{parts ? <>{parts[1]}<span className="text-[#d89442]">{parts[2]}</span></> : name}</div><p className="mt-4 max-w-md text-sm leading-6 text-white/65">{tagline || "Original hand-painted artwork and premium printed canvases for homes, offices and meaningful spaces."}</p>{contactLines.length > 0 && <div className="mt-4 grid gap-1 text-sm text-white/65">{contactLines.map((line) => <p key={line}>{line}</p>)}{instagram ? <a href={instagram} target="_blank" rel="noreferrer" className="text-white/65 hover:text-white">Instagram</a> : null}</div>}</div>
      <div><h3 className="font-semibold">Shop</h3><div className="mt-4 grid gap-3 text-sm text-white/65"><Link href="/shop">All Art</Link><Link href="/hand-painted">Hand-Painted</Link><Link href="/printed-canvas">Printed Canvas</Link><Link href="/categories">Categories</Link></div></div>
      <div><h3 className="font-semibold">Help</h3><div className="mt-4 grid gap-3 text-sm text-white/65"><Link href="/shipping">Shipping</Link><Link href="/returns">Returns</Link><Link href="/contact">Contact</Link><Link href="/privacy">Privacy</Link><Link href="/terms">Terms</Link></div></div>
    </div>
    <div className="border-t border-white/10 px-4 py-5 text-center text-xs text-white/45">© {new Date().getFullYear()} {name}. All rights reserved.</div>
  </footer>;
}
