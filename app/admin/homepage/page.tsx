export const dynamic = "force-dynamic";
import Link from "next/link";
import { AdminShell } from "@/components/admin/AdminShell";
import { requireAdmin } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { formatINR } from "@/lib/utils";
import { minPrice } from "@/lib/product";
import type { Product } from "@/types";

export const metadata = { title: "Homepage — ArtCanvas Admin" };

interface HomeData {
  ok: boolean;
  featured: Product[];
  bestsellers: Product[];
  newArrivals: Product[];
}

async function loadHomepageData(): Promise<HomeData> {
  try {
    const db = await getDb();
    const base = [
      { $or: [{ status: "published" }, { status: { $exists: false } }] },
      { $or: [{ active: true }, { active: { $exists: false } }] }
    ];
    const [featured, bestsellers, newArrivals] = await Promise.all([
      db.collection("products").find({ $and: [...base, { featured: true }] }).sort({ createdAt: -1 }).limit(12).toArray(),
      db.collection("products").find({ $and: [...base, { bestseller: true }] }).sort({ createdAt: -1 }).limit(12).toArray(),
      db.collection("products").find({ $and: [...base, { newArrival: true }] }).sort({ createdAt: -1 }).limit(12).toArray()
    ]);
    const map = (docs: Record<string, unknown>[]) => docs.map(d => ({ ...d, _id: String(d._id) }) as Product);
    return { ok: true, featured: map(featured), bestsellers: map(bestsellers), newArrivals: map(newArrivals) };
  } catch {
    return { ok: false, featured: [], bestsellers: [], newArrivals: [] };
  }
}

export default async function HomepageAdmin() {
  await requireAdmin();
  const data = await loadHomepageData();

  const sections = [
    { key: "featured", title: "Featured artwork", flag: "Featured", items: data.featured },
    { key: "bestsellers", title: "Bestsellers", flag: "Bestseller", items: data.bestsellers },
    { key: "newArrivals", title: "New arrivals", flag: "New Arrival", items: data.newArrivals }
  ];

  return (
    <AdminShell>
      <h1 className="font-serif text-3xl font-bold sm:text-4xl">Homepage</h1>
      <p className="mt-1 text-sm text-black/55">
        These sections power the live customer-facing homepage. Use the checkboxes on each artwork to add or remove it from a section.
      </p>

      {!data.ok && (
        <div className="mt-6 rounded-3xl bg-white p-10 text-center shadow-sm">
          <p className="font-serif text-2xl font-bold">Could not load homepage data</p>
          <p className="mt-2 text-sm text-black/55">The database is not reachable right now. Please try again shortly.</p>
        </div>
      )}

      {data.ok && (
        <div className="mt-6 grid gap-5">
          {sections.map(s => (
            <section key={s.key} className="rounded-3xl bg-white p-6 shadow-sm" aria-label={s.title}>
              <div className="flex items-center justify-between gap-3">
                <h2 className="font-serif text-2xl font-bold">{s.title}</h2>
                <Link href="/admin/products" className="text-sm font-semibold text-[#9a5d19] hover:underline">Manage in Products →</Link>
              </div>
              {s.items.length === 0 ? (
                <p className="mt-4 rounded-2xl bg-[#eee9e1] p-5 text-sm text-black/55">
                  Nothing here yet. Edit an artwork and tick “{s.flag}” to feature it on the homepage.
                </p>
              ) : (
                <ul className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {s.items.map(p => (
                    <li key={p._id} className="flex items-center gap-3 rounded-2xl bg-[#eee9e1]/70 p-3">
                      {p.images?.[0]
                        ? <img src={p.images[0]} alt="" className="h-14 w-14 shrink-0 rounded-xl object-cover" loading="lazy" />
                        : <span className="h-14 w-14 shrink-0 rounded-xl bg-[#d9d0c3]" />}
                      <span className="min-w-0 flex-1">
                        <Link href={`/admin/products/${p._id}`} className="block truncate text-sm font-semibold hover:text-[#9a5d19]">{p.title}</Link>
                        <span className="text-xs text-black/50">From {formatINR(minPrice(p))} · {p.artType === "hand-painted" ? "Hand-Painted" : "Printed Canvas"}</span>
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          ))}
        </div>
      )}
    </AdminShell>
  );
}
