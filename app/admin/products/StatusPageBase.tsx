import { AdminShell } from "@/components/admin/AdminShell";
import { requireAdmin } from "@/lib/auth";
import { getAllProductsAdmin, getCategories } from "@/lib/queries";
import { ProductsTable } from "@/components/admin/ProductsTable";
import type { ProductFilter } from "@/components/admin/ProductsTable";
import type { Product } from "@/types";

export async function StatusPageBase({ filter, title, subtitle }: { filter: ProductFilter; title: string; subtitle: string }) {
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
      <h1 className="font-serif text-4xl font-bold">{title}</h1>
      <p className="mt-1 text-sm text-black/55">{subtitle}</p>
      <div className="mt-6">
        <ProductsTable products={products} categories={categories} initialFilter={filter} />
      </div>
    </AdminShell>
  );
}
