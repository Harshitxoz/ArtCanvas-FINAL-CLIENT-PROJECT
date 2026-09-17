export const dynamic = "force-dynamic";
import { AdminShell } from "@/components/admin/AdminShell";
import { requireAdmin } from "@/lib/auth";
import { ProductForm } from "@/components/admin/ProductForm";
import { getCategories } from "@/lib/queries";

export const metadata = { title: "Add Artwork — ArtCanvas Admin" };

export default async function NewProduct() {
  await requireAdmin();
  let categories: string[] = [];
  try {
    const cats = await getCategories();
    categories = cats.map((c: { name?: string; slug?: string }) => c.name || c.slug || "").filter(Boolean);
  } catch {}
  return (
    <AdminShell>
      <h1 className="font-serif text-4xl font-bold">Add Artwork</h1>
      <p className="mt-1 text-sm text-black/55">Create a hand-painted original or printed canvas with sizes, pricing and imagery.</p>
      <div className="mt-6">
        <ProductForm categories={categories} />
      </div>
    </AdminShell>
  );
}
