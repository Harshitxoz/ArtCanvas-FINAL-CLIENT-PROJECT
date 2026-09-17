export const dynamic = "force-dynamic";
import { AdminShell } from "@/components/admin/AdminShell";
import { requireAdmin } from "@/lib/auth";
import { getProductById, getCategories } from "@/lib/queries";
import { ProductForm } from "@/components/admin/ProductForm";
import { notFound } from "next/navigation";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { displayStatus } from "@/lib/product";
import Link from "next/link";

export default async function EditProduct({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();
  const { id } = await params;
  const product = await getProductById(id);
  if (!product) notFound();
  let categories: string[] = [];
  try {
    const cats = await getCategories();
    categories = cats.map((c: { name?: string; slug?: string }) => c.name || c.slug || "").filter(Boolean);
  } catch {}
  return (
    <AdminShell>
      <div className="flex flex-wrap items-center gap-3">
        <h1 className="font-serif text-4xl font-bold">{product.title}</h1>
        <StatusBadge value={displayStatus(product)} />
      </div>
      <p className="mt-1 text-sm text-black/55">
        Editing artwork · <Link href={`/products/${product.slug}`} target="_blank" className="font-semibold text-[#9a5d19] hover:underline">View on store ↗</Link>
      </p>
      <div className="mt-6">
        <ProductForm product={product} categories={categories} />
      </div>
    </AdminShell>
  );
}
