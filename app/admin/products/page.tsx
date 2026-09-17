export const dynamic = "force-dynamic";
import Link from "next/link";
import { AdminShell } from "@/components/admin/AdminShell";
import { requireAdmin } from "@/lib/auth";
import { getAllProductsAdmin, getCategories } from "@/lib/queries";
import { ProductsTable } from "@/components/admin/ProductsTable";
import type { Product } from "@/types";

export default async function ProductsAdmin() {
  await requireAdmin();
  let products: Product[] = [];
  let categories: string[] = [];
  try {
    const [p, c] = await Promise.all([getAllProductsAdmin(), getCategories()]);
    products = p;
    categories = c.map((cat: { name?: string; slug?: string }) => cat.name || cat.slug || "").filter(Boolean);
  } catch {}
  return (
    <AdminShell>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-serif text-4xl font-bold">Products</h1>
          <p className="mt-1 text-sm text-black/55">Manage your artwork catalogue, pricing and stock.</p>
        </div>
        <Link href="/admin/products/new" className="rounded-full bg-[#9a5d19] px-5 py-3 text-sm font-semibold text-white hover:bg-[#7f4b12]">+ Add Artwork</Link>
      </div>
      <div className="mt-6">
        <ProductsTable products={products} categories={categories} />
      </div>
    </AdminShell>
  );
}

