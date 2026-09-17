"use client";
import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Search, Pencil, Archive, ArchiveRestore } from "lucide-react";
import { StatusBadge } from "./StatusBadge";
import { ConfirmDialog } from "./ConfirmDialog";
import { formatINR } from "@/lib/utils";
import { displayStatus, minPrice, totalStock } from "@/lib/product";
import { PRODUCT_TYPES } from "@/lib/constants";
import type { Product } from "@/types";

export type ProductFilter = "all" | "draft" | "published" | "sold-out" | "archived";

const FILTERS: { value: ProductFilter; label: string }[] = [
  { value: "all", label: "All" },
  { value: "published", label: "Published" },
  { value: "draft", label: "Draft" },
  { value: "sold-out", label: "Sold Out" },
  { value: "archived", label: "Archived" }
];

export function ProductsTable({ products, initialFilter = "all", categories }: { products: Product[]; initialFilter?: ProductFilter; categories?: string[] }) {
  const router = useRouter();
  const [filter, setFilter] = useState<ProductFilter>(initialFilter);
  const [artType, setArtType] = useState("");
  const [category, setCategory] = useState("");
  const [search, setSearch] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);

  const rows = useMemo(() => {
    const q = search.trim().toLowerCase();
    return products.filter(p => {
      const st = displayStatus(p);
      if (filter !== "all" && st !== filter) return false;
      if (artType && p.artType !== artType) return false;
      if (category && p.category !== category) return false;
      if (q && !(`${p.title} ${p.sku || ""} ${(p.sizes || []).map(s => s.sku || "").join(" ")} ${p.category}`.toLowerCase().includes(q))) return false;
      return true;
    });
  }, [products, filter, artType, category, search]);

  async function archive(id: string, title: string) {
    setBusyId(id);
    try {
      const r = await fetch("/api/products/" + id, { method: "DELETE" });
      const d = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(d.error || "Could not archive artwork.");
      toast.success(d.message || ('"' + title + '" archived.'));
      router.refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not archive artwork.");
    } finally {
      setBusyId(null);
    }
  }

  async function restore(id: string, title: string) {
    setBusyId(id);
    try {
      const r = await fetch("/api/products/" + id, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status: "published", active: true }) });
      if (!r.ok) throw new Error("Restore failed");
      toast.success('"' + title + '" restored to published.');
      router.refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Restore failed.");
    } finally {
      setBusyId(null);
    }
  }

  const input = "rounded-xl border border-black/10 bg-white px-3.5 py-2.5 text-sm outline-none focus:border-[#9a5d19]";
  const tab = (active: boolean) =>
    "rounded-full px-4 py-2 text-sm font-semibold transition " +
    (active ? "bg-[#17130f] text-white" : "bg-white text-black/60 hover:text-black border border-black/10");

  return (
    <div>
      <div className="flex flex-wrap gap-2" role="tablist" aria-label="Filter products by status">
        {FILTERS.map(f => (
          <button key={f.value} role="tab" aria-selected={filter === f.value} onClick={() => setFilter(f.value)} className={tab(filter === f.value)}>
            {f.label} <span className={filter === f.value ? "text-white/60" : "text-black/40"}>({products.filter(p => f.value === "all" || displayStatus(p) === f.value).length})</span>
          </button>
        ))}
      </div>

      <div className="mt-4 grid gap-3 rounded-2xl bg-white p-4 shadow-sm sm:grid-cols-2 lg:grid-cols-3">
        <input aria-label="Search products" placeholder="Search title, SKU or category…" className={input} value={search} onChange={e => setSearch(e.target.value)} />
        <select aria-label="Filter by art type" className={input} value={artType} onChange={e => setArtType(e.target.value)}>
          <option value="">All art types</option>
          {PRODUCT_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
        </select>
        <select aria-label="Filter by category" className={input} value={category} onChange={e => setCategory(e.target.value)}>
          <option value="">All categories</option>
          {(categories || []).map(c => <option key={c} value={c}>{c.replace("-", " ")}</option>)}
        </select>
      </div>

      {rows.length === 0 ? (
        <div className="mt-4 rounded-2xl bg-white p-12 text-center shadow-sm">
          <p className="font-serif text-2xl font-bold">No artworks found</p>
          <p className="mt-2 text-sm text-black/55">{products.length === 0 ? "Add your first artwork to get started." : "Try changing the filters or search."}</p>
          {products.length === 0 && <Link href="/admin/products/new" className="mt-4 inline-block rounded-full bg-[#9a5d19] px-5 py-3 text-sm font-semibold text-white hover:bg-[#7f4b12]">Add artwork</Link>}
        </div>
      ) : (
        <div className="mt-4 overflow-x-auto rounded-2xl bg-white shadow-sm">
          <table className="w-full min-w-[900px] text-left text-sm">
            <thead>
              <tr className="border-b border-black/5 text-xs uppercase tracking-wide text-black/50">
                <th className="p-4 font-semibold">Artwork</th>
                <th className="p-4 font-semibold">Type</th>
                <th className="p-4 font-semibold">Category</th>
                <th className="p-4 font-semibold">Price</th>
                <th className="p-4 font-semibold">Stock</th>
                <th className="p-4 font-semibold">Status</th>
                <th className="p-4 font-semibold">Created</th>
                <th className="p-4 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {rows.map(p => {
                const st = displayStatus(p);
                const stock = totalStock(p);
                return (
                  <tr key={p._id} className="border-b border-black/5 last:border-0 hover:bg-[#eee9e1]/40">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        {p.images?.[0]
                          ? <img src={p.images[0]} alt="" className="h-14 w-14 shrink-0 rounded-xl object-cover" loading="lazy" />
                          : <div className="grid h-14 w-14 shrink-0 place-items-center rounded-xl bg-[#eee9e1] text-[10px] text-black/40">No img</div>}
                        <div className="min-w-0">
                          <a href={"/admin/products/" + p._id} className="block max-w-[220px] truncate font-semibold hover:text-[#9a5d19]">{p.title}</a>
                          <span className="text-xs text-black/45">{p.sku || p.slug}</span>
                        </div>
                      </div>
                    </td>
                    <td className="p-4 capitalize">{p.artType.replace("-", " ")}</td>
                    <td className="p-4 capitalize">{p.category.replace("-", " ")}</td>
                    <td className="p-4">{formatINR(minPrice(p))}</td>
                    <td className="p-4">{stock > 0 ? stock + " pcs" : <span className="font-semibold text-red-600">Sold out</span>}</td>
                    <td className="p-4"><StatusBadge value={st} /></td>
                    <td className="p-4 whitespace-nowrap text-black/60">{p.createdAt ? new Date(p.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : "—"}</td>
                    <td className="p-4">
                      <div className="flex items-center justify-end gap-3">
                        <a href={"/admin/products/" + p._id} className="inline-flex items-center gap-1 font-semibold text-[#9a5d19] hover:underline"><Pencil size={14} /> Edit</a>
                        {st === "archived" ? (
                          <button type="button" disabled={busyId === p._id} onClick={() => restore(p._id!, p.title)} className="inline-flex items-center gap-1 font-semibold text-[#1f7a4d] hover:underline disabled:opacity-50"><ArchiveRestore size={14} /> Restore</button>
                        ) : (
                          <ConfirmDialog
                            title="Archive artwork?"
                            message={'"' + p.title + '" will be hidden from the store but kept for past orders. You can restore it later from the Archived tab.'}
                            confirmLabel="Archive"
                            onConfirm={() => archive(p._id!, p.title)}
                            trigger={<button type="button" disabled={busyId === p._id} className="inline-flex items-center gap-1 font-semibold text-black/55 hover:text-red-600 disabled:opacity-50"><Archive size={14} /> Archive</button>}
                          />
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
      <p className="mt-4 text-sm text-black/55" role="status">Showing {rows.length} of {products.length} artworks</p>
    </div>
  );
}
