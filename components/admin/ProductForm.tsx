"use client";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Plus, Trash2 } from "lucide-react";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { ImageUploader } from "./ImageUploader";
import { slugify } from "@/lib/utils";
import type { ArtType, Product, ProductSize, ProductStatus, ImageAsset } from "@/types";

interface SizeRow extends ProductSize {
  compareAtStr: string;
  priceStr: string;
  stockStr: string;
}

const EMPTY_SIZE: SizeRow = {
  label: "18 x 24 in", width: 18, height: 24, price: 2999,
  compareAtStr: "", priceStr: "2999", stockStr: "5", stock: 5, sku: ""
};

function toRow(s: ProductSize): SizeRow {
  return {
    label: s.label, width: s.width, height: s.height, price: s.price, stock: s.stock, sku: s.sku || "",
    compareAtStr: s.compareAt ? String(s.compareAt) : "",
    priceStr: String(s.price), stockStr: String(s.stock)
  };
}

const FIELD = "mt-1 w-full rounded-xl border border-black/10 bg-white px-3.5 py-2.5 text-sm outline-none focus:border-[#9a5d19] focus:ring-1 focus:ring-[#9a5d19]/20";
const FIELD_ERROR = "mt-1 w-full rounded-xl border border-red-300 bg-red-50 px-3.5 py-2.5 text-sm outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500/20";
const LABEL = "block text-sm font-semibold text-black";
const LABEL_REQUIRED = "block text-sm font-semibold text-black";
const SECTION = "rounded-2xl bg-white p-5 shadow-sm border border-black/5";
const SECTION_HEADING = "font-serif text-xl font-bold text-black";
const HINT = "mt-1 text-xs text-black/50";
const HELPER = "mt-1 text-xs text-black/60";
const ERROR = "mt-1 text-xs text-red-600 font-medium";

export function ProductForm({ product, categories }: { product?: Product; categories?: string[] }) {
  const router = useRouter();
  const [title, setTitle] = useState(product?.title || "");
  const [slug, setSlug] = useState(product?.slug || "");
  const [slugTouched, setSlugTouched] = useState(!!product?.slug);
  const [artType, setArtType] = useState<ArtType>(product?.artType || "hand-painted");
  const [category, setCategory] = useState(product?.category || categories?.[0] || "nature");
  const [artist, setArtist] = useState(product?.artist || "");
  const [description, setDescription] = useState(product?.description || "");
  const [medium, setMedium] = useState(product?.medium || "");
  const [canvasMaterial, setCanvasMaterial] = useState(product?.canvasMaterial || "");
  const [orientation, setOrientation] = useState<"landscape" | "portrait" | "square">(product?.orientation || "landscape");
  const [images, setImages] = useState<ImageAsset[]>(product?.imageAssets?.length ? product.imageAssets : (product?.images || []).map(url => ({ url })));
  const [roomPreview, setRoomPreview] = useState(product?.roomPreview || "");
  const [closeUp, setCloseUp] = useState(product?.closeUp || "");
  const [authenticityImage, setAuthenticityImage] = useState(product?.authenticityImage || "");
  const [sizes, setSizes] = useState<SizeRow[]>(product?.sizes?.length ? product.sizes.map(toRow) : [{ ...EMPTY_SIZE }]);
  const [sku, setSku] = useState(product?.sku || "");
  const [weight, setWeight] = useState(product?.weight ? String(product.weight) : "");
  const [deliveryTime, setDeliveryTime] = useState(product?.deliveryTime || "");
  const [frameAvailable, setFrameAvailable] = useState(product?.frameAvailable ?? false);
  const [framedPrice, setFramedPrice] = useState(product?.framedPrice ? String(product.framedPrice) : "");
  const [unframedPrice, setUnframedPrice] = useState(product?.unframedPrice ? String(product.unframedPrice) : "");
  const [care, setCare] = useState(product?.care || "");
  const [featured, setFeatured] = useState(product?.featured ?? false);
  const [bestseller, setBestseller] = useState(product?.bestseller ?? false);
  const [newArrival, setNewArrival] = useState(product?.newArrival ?? false);
  const [status, setStatus] = useState<ProductStatus>(product?.status || (product?.active === false ? "draft" : "published"));
  const [seoTitle, setSeoTitle] = useState(product?.seoTitle || "");
  const [seoDescription, setSeoDescription] = useState(product?.seoDescription || "");
  const [loading, setLoading] = useState(false);

  const discountPreview = useMemo(() => sizes.map(s => {
    const price = Number(s.priceStr) || 0;
    const compareAt = Number(s.compareAtStr) || 0;
    return compareAt > price ? Math.round(((compareAt - price) / compareAt) * 100) : 0;
  }), [sizes]);

  function onTitle(v: string) {
    setTitle(v);
    if (!slugTouched) setSlug(slugify(v));
  }

  function updateSize(i: number, patch: Partial<SizeRow>) {
    setSizes(prev => prev.map((s, j) => (j === i ? { ...s, ...patch } : s)));
  }

  async function submit(e: React.FormEvent, publishOverride?: ProductStatus) {
    e.preventDefault();
    const finalStatus = publishOverride || status;
    if (!images.length) { toast.error("Upload at least one artwork image."); return; }
    if (!sizes.length) { toast.error("Add at least one size with price and stock."); return; }
    const parsedSizes: ProductSize[] = [];
    for (let i = 0; i < sizes.length; i++) {
      const s = sizes[i];
      const price = Number(s.priceStr);
      const stock = Number(s.stockStr);
      const width = Number(s.width);
      const height = Number(s.height);
      const compareAt = s.compareAtStr ? Number(s.compareAtStr) : undefined;
      if (!s.label.trim()) { toast.error("Size " + (i + 1) + ": label is required."); return; }
      if (!(width > 0) || !(height > 0)) { toast.error("Size " + (i + 1) + ": width and height must be positive."); return; }
      if (!(price >= 0)) { toast.error("Size " + (i + 1) + ": price must be 0 or more."); return; }
      if (!Number.isInteger(stock) || stock < 0) { toast.error("Size " + (i + 1) + ": stock must be a whole number 0 or more."); return; }
      if (compareAt !== undefined && !(compareAt >= 0)) { toast.error("Size " + (i + 1) + ": compare-at price must be 0 or more."); return; }
      parsedSizes.push({
        label: s.label.trim(), width, height, price, stock,
        ...(compareAt ? { compareAt } : {}),
        ...(s.sku?.trim() ? { sku: s.sku.trim() } : {})
      });
    }
    setLoading(true);
    try {
      const payload = {
        title: title.trim(), slug: slug.trim(), artType, category, artist: artist.trim(),
        description: description.trim(), medium: medium.trim(), canvasMaterial: canvasMaterial.trim(), orientation,
        images: images.map(img => img.url),
        imageAssets: images,
        roomPreview, closeUp, authenticityImage, sizes: parsedSizes,
        sku: sku.trim(), weight: weight ? Number(weight) : 0, deliveryTime: deliveryTime.trim(),
        frameAvailable, framedPrice: framedPrice ? Number(framedPrice) : 0, unframedPrice: unframedPrice ? Number(unframedPrice) : 0,
        care: care.trim(), featured, bestseller, newArrival,
        status: finalStatus, active: finalStatus === "published",
        seoTitle: seoTitle.trim(), seoDescription: seoDescription.trim()
      };
      const url = product?._id ? "/api/products/" + product._id : "/api/products";
      const r = await fetch(url, { method: product?._id ? "PATCH" : "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      const d = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(d.error || "Could not save artwork.");
      toast.success(finalStatus === "draft" ? "Draft saved." : product ? "Artwork updated." : "Artwork published.");
      router.push("/admin/products");
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not save artwork.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={e => submit(e)} className="grid gap-5">
      <section className={SECTION} aria-label="Basic information">
        <h2 className={SECTION_HEADING}>Basic Information</h2>
        <p className={HINT}>The core details of your artwork. Title and art type are required.</p>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <div>
            <label className={LABEL + " mb-1.5"}>Artwork title <span className="text-red-500">*</span></label>
            <input className={FIELD} required value={title} onChange={e => onTitle(e.target.value)} placeholder="e.g. Mountain Sunset" aria-label="Artwork title" />
            <p className={HELPER}>The main name of your artwork as it will appear on the store.</p>
          </div>
          <div>
            <label className={LABEL + " mb-1.5"}>Slug</label>
            <input className={FIELD} required value={slug} onChange={e => { setSlug(slugify(e.target.value)); setSlugTouched(true); }} placeholder="mountain-sunset" aria-label="Product slug" />
            <p className={HELPER}>Lowercase letters, numbers and dashes. Used in the product URL.</p>
          </div>
          <div>
            <label className={LABEL + " mb-1.5"}>Art type <span className="text-red-500">*</span></label>
            <select className={FIELD} value={artType} onChange={e => setArtType(e.target.value as ArtType)} aria-label="Art type">
              <option value="hand-painted">Hand-Painted (original)</option>
              <option value="printed-canvas">Printed Canvas</option>
            </select>
          </div>
          <div>
            <label className={LABEL + " mb-1.5"}>Category <span className="text-red-500">*</span></label>
            {categories?.length
              ? <select className={FIELD} value={category} onChange={e => setCategory(e.target.value)} aria-label="Category">{categories.map(c => <option key={c} value={c}>{c.replace("-", " ").replace(/^\w/, c => c.toUpperCase())}</option>)}</select>
              : <input className={FIELD} value={category} onChange={e => setCategory(e.target.value)} placeholder="e.g. nature" aria-label="Category" />}
            <p className={HELPER}>The category this artwork belongs to.</p>
          </div>
          <div>
            <label className={LABEL + " mb-1.5"}>Artist name</label>
            <input className={FIELD} value={artist} onChange={e => setArtist(e.target.value)} placeholder="e.g. ArtCanvas Studio" aria-label="Artist name" />
          </div>
          <div>
            <label className={LABEL + " mb-1.5"}>Orientation</label>
            <select className={FIELD} value={orientation} onChange={e => setOrientation(e.target.value as "landscape" | "portrait" | "square")} aria-label="Orientation">
              <option value="landscape">Landscape</option>
              <option value="portrait">Portrait</option>
              <option value="square">Square</option>
            </select>
          </div>
          <div>
            <label className={LABEL + " mb-1.5"}>SKU</label>
            <input className={FIELD} value={sku} onChange={e => setSku(e.target.value)} placeholder="e.g. AC-MS-001" aria-label="Product SKU" />
            <p className={HELPER}>Optional. Internal tracking and inventory code.</p>
          </div>
        </div>
        <label className={LABEL + " mt-4"}>Description <span className="text-red-500">*</span></label>
        <textarea required minLength={10} className={FIELD + " min-h-32 leading-6"} value={description} onChange={e => setDescription(e.target.value)} placeholder="Story, mood, colours and ideal rooms…" aria-label="Description" />
        <p className={HELPER}>{description.length}/5000 characters · Describe the artwork&apos;s story and mood.</p>

        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <div>
            <label className={LABEL + " mb-1.5"}>Medium</label>
            <input className={FIELD} value={medium} onChange={e => setMedium(e.target.value)} placeholder="e.g. Acrylic on canvas" aria-label="Medium" />
          </div>
          <div>
            <label className={LABEL + " mb-1.5"}>Surface / Material</label>
            <input className={FIELD} value={canvasMaterial} onChange={e => setCanvasMaterial(e.target.value)} placeholder="e.g. 400 GSM cotton canvas" aria-label="Surface or material" />
          </div>
        </div>
      </section>

      <section className={SECTION} aria-label="Artwork images">
        <h2 className={SECTION_HEADING}>Artwork Images</h2>
        <div className="mt-4 grid gap-6">
          <ImageUploader
             images={images}
             onChange={setImages}
             label="Artwork images"
             max={8}
             disabled={loading}
             onSaveImageAction={async (action, index) => {
               if (!product?._id) return;
                // Temporary client-side logging: verify index 0 is sent for the first image.
                console.log("[REMOVE_IMAGE_CLIENT] sending imageAction:", action, "imageIndex:", index, "(type:", typeof index + ")");
               const r = await fetch("/api/products/" + product._id, {
                 method: "PATCH",
                 headers: { "Content-Type": "application/json" },
                 body: JSON.stringify({ imageAction: action, imageIndex: index })
               });
               const d = await r.json().catch(() => ({}));
               if (!r.ok) throw new Error(d.error || "Could not update image.");
               const refreshR = await fetch("/api/products/" + product._id);
               if (refreshR.ok) {
                 const updated = await refreshR.json();
                 setImages(updated.imageAssets?.length ? updated.imageAssets : (updated.images || []).map((url: string) => ({ url })));
               }
             }}

           />
          <div className="grid gap-4 sm:grid-cols-3">
            <SingleImage label="Room preview image" value={roomPreview} onChange={setRoomPreview} />
            <SingleImage label="Close-up image" value={closeUp} onChange={setCloseUp} />
            <SingleImage label="Signature image" value={authenticityImage} onChange={setAuthenticityImage} />
          </div>
        </div>
      </section>

      <section className={SECTION} aria-label="Sizes and pricing">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className={SECTION_HEADING}>Sizes and pricing</h2>
          <button type="button" onClick={() => setSizes(p => [...p, { label: "24 x 36 in", width: 24, height: 36, price: 4999, compareAtStr: "", priceStr: "4999", stockStr: "5", stock: 5, sku: "" }])} className="inline-flex items-center gap-1.5 rounded-full border border-[#9a5d19] px-4 py-2 text-sm font-semibold text-[#9a5d19] hover:bg-[#9a5d19]/5"><Plus size={15} /> Add size</button>
        </div>
        <p className={HINT}>Each size has its own price, compare-at price, stock and SKU.</p>
        <div className="mt-4 grid gap-4">
          {sizes.map((s, i) => (
            <fieldset key={i} className="rounded-2xl border border-black/10 p-4">
              <legend className="px-2 text-sm font-bold">Size {i + 1}</legend>
              <div className="grid gap-3 sm:grid-cols-3 xl:grid-cols-6">
                <label className={LABEL}>Label<Input value={s.label} onChange={e => updateSize(i, { label: e.target.value })} /></label>
                <label className={LABEL}>Width (in)<Input type="number" min={1} value={s.width} onChange={e => updateSize(i, { width: Number(e.target.value) })} /></label>
                <label className={LABEL}>Height (in)<Input type="number" min={1} value={s.height} onChange={e => updateSize(i, { height: Number(e.target.value) })} /></label>
                <label className={LABEL}>Price (₹)<Input type="number" min={0} value={s.priceStr} onChange={e => updateSize(i, { priceStr: e.target.value, price: Number(e.target.value) || 0 })} /></label>
                <label className={LABEL}>Compare-at (₹)<Input type="number" min={0} value={s.compareAtStr} onChange={e => updateSize(i, { compareAtStr: e.target.value })} /></label>
                <label className={LABEL}>Stock<Input type="number" min={0} step={1} value={s.stockStr} onChange={e => updateSize(i, { stockStr: e.target.value, stock: Number(e.target.value) || 0 })} /></label>
              </div>
              <div className="mt-3 grid items-end gap-3 sm:grid-cols-2">
                <label className={LABEL}>Size SKU<Input value={s.sku} onChange={e => updateSize(i, { sku: e.target.value })} placeholder="Optional per-size SKU" /></label>
                <div className="flex items-center justify-between gap-3">
                  {discountPreview[i] > 0
                    ? <span className="rounded-full bg-[#1f7a4d]/10 px-3 py-1 text-xs font-bold text-[#1f7a4d]">{discountPreview[i]}% off</span>
                    : <span className="text-xs text-black/40">No discount</span>}
                  {sizes.length > 1 && (
                    <button type="button" onClick={() => setSizes(p => p.filter((_, j) => j !== i))} className="inline-flex items-center gap-1.5 text-sm font-semibold text-red-600 hover:text-red-700"><Trash2 size={15} /> Remove</button>
                  )}
                </div>
              </div>
            </fieldset>
          ))}
        </div>
      </section>


      <section className={SECTION} aria-label="Inventory and delivery">
        <h2 className={SECTION_HEADING}>Inventory and delivery</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-3">
          <label className={LABEL}>Base SKU<Input value={sku} onChange={e => setSku(e.target.value)} placeholder="e.g. AC-MS-001" /></label>
          <label className={LABEL}>Weight (kg)<Input type="number" min={0} step={0.1} value={weight} onChange={e => setWeight(e.target.value)} /></label>
          <label className={LABEL}>Estimated delivery time<Input value={deliveryTime} onChange={e => setDeliveryTime(e.target.value)} placeholder="e.g. 5-7 days" /></label>
        </div>
        <label className={LABEL + " mt-4"}>Care instructions
          <textarea className={FIELD + " min-h-20"} value={care} onChange={e => setCare(e.target.value)} placeholder="Keep away from direct sunlight, wipe with a dry cloth…" />
        </label>
        <div className="mt-4 rounded-2xl border border-black/10 p-4">
          <label className="flex items-center gap-2 text-sm font-semibold"><input type="checkbox" checked={frameAvailable} onChange={e => setFrameAvailable(e.target.checked)} className="h-4 w-4 accent-[#9a5d19]" /> Frame available</label>
          {frameAvailable && (
            <div className="mt-3 grid gap-4 sm:grid-cols-2">
              <label className={LABEL}>Framed price (₹)<Input type="number" min={0} value={framedPrice} onChange={e => setFramedPrice(e.target.value)} /></label>
              <label className={LABEL}>Unframed price (₹)<Input type="number" min={0} value={unframedPrice} onChange={e => setUnframedPrice(e.target.value)} /></label>
            </div>
          )}
        </div>
      </section>

      <section className={SECTION} aria-label="Visibility">
        <h2 className={SECTION_HEADING}>Publish</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <label className={LABEL}>Status
            <select className={FIELD} value={status} onChange={e => setStatus(e.target.value as ProductStatus)}>
              <option value="published">Published (visible on store)</option>
              <option value="draft">Draft (hidden from store)</option>
              {product && <option value="archived">Archived (hidden, kept for orders)</option>}
            </select>
          </label>
          <fieldset>
            <legend className={LABEL}>Highlights</legend>
            <div className="mt-2 flex flex-wrap gap-4 text-sm">
              <label className="flex items-center gap-2"><input type="checkbox" checked={featured} onChange={e => setFeatured(e.target.checked)} className="h-4 w-4 accent-[#9a5d19]" /> Featured</label>
              <label className="flex items-center gap-2"><input type="checkbox" checked={bestseller} onChange={e => setBestseller(e.target.checked)} className="h-4 w-4 accent-[#9a5d19]" /> Bestseller</label>
              <label className="flex items-center gap-2"><input type="checkbox" checked={newArrival} onChange={e => setNewArrival(e.target.checked)} className="h-4 w-4 accent-[#9a5d19]" /> New Arrival</label>
            </div>
          </fieldset>
        </div>
        <div className="mt-6 flex flex-wrap gap-3">
          <Button type="submit" disabled={loading}>{loading ? "Saving…" : product ? "Save changes" : status === "draft" ? "Save draft" : "Publish artwork"}</Button>
          {status !== "draft" && (
            <button type="button" disabled={loading} onClick={e => submit(e, "draft")} className="rounded-full border border-black/15 px-5 py-3 text-sm font-semibold hover:bg-black/5 disabled:opacity-50">
              {product ? "Move to draft" : "Save as draft"}
            </button>
          )}
        </div>
      </section>
    </form>
  );
}

function SingleImage({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  const [busy, setBusy] = useState(false);
  async function upload(file: File) {
    setBusy(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const r = await fetch("/api/upload", { method: "POST", body: fd });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error || "Upload failed");
      onChange(d.url);
      toast.success(label + " uploaded");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="rounded-2xl border border-black/10 p-3">
      <p className="text-sm font-semibold">{label}</p>
      {value
        ? <div className="relative mt-2">
            <img src={value} alt={label} className="aspect-video w-full rounded-xl object-cover" loading="lazy" />
            <button type="button" onClick={() => onChange("")} className="absolute right-2 top-2 grid h-8 w-8 place-items-center rounded-full bg-white shadow hover:text-red-600" aria-label={"Remove " + label}><Trash2 size={15} /></button>
          </div>
        : <label className="mt-2 flex cursor-pointer flex-col items-center rounded-xl border border-dashed border-black/15 p-4 text-center text-xs text-black/55 hover:border-[#9a5d19]/60">
            {busy ? "Uploading…" : "Click to upload"}
            <input type="file" accept="image/jpeg,image/png,image/webp,image/avif" hidden onChange={e => { const f = e.target.files?.[0]; if (f) upload(f); e.target.value = ""; }} />
          </label>}
    </div>
  );
}
