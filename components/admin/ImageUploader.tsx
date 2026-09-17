"use client";
import { useRef, useState } from "react";
import { X, Star, UploadCloud, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { MAX_UPLOAD_MB } from "@/lib/constants";

const ACCEPTED = ["image/jpeg", "image/png", "image/webp", "image/avif"];

export function ImageUploader({
  images, onChange, label = "Artwork images", max = 8
}: { images: string[]; onChange: (urls: string[]) => void; label?: string; max?: number }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(0);

  async function uploadFiles(files: FileList | File[]) {
    const list = Array.from(files);
    if (!list.length) return;
    if (images.length + list.length > max) {
      toast.error(`You can upload up to ${max} images.`);
      return;
    }
    for (const f of list) {
      if (!ACCEPTED.includes(f.type) && !f.type.startsWith("image/")) {
        toast.error(`${f.name}: only JPG, PNG or WebP images are allowed.`);
        return;
      }
      if (f.size > MAX_UPLOAD_MB * 1024 * 1024) {
        toast.error(`${f.name}: maximum file size is ${MAX_UPLOAD_MB}MB.`);
        return;
      }
    }
    setUploading(list.length);
    try {
      const urls: string[] = [];
      for (const file of list) {
        const fd = new FormData();
        fd.append("file", file);
        const r = await fetch("/api/upload", { method: "POST", body: fd });
        const d = await r.json();
        if (!r.ok) throw new Error(d.error || `Upload failed for ${file.name}`);
        urls.push(d.secure_url);
        setUploading(c => Math.max(0, c - 1));
      }
      onChange([...images, ...urls]);
      toast.success(`${urls.length} image${urls.length === 1 ? "" : "s"} uploaded`);
    } catch (e) {
      setUploading(0);
      toast.error(e instanceof Error ? e.message : "Upload failed");
    }
  }

  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <span className="text-sm font-semibold">{label} <span className="font-normal text-black/45">({images.length}/{max})</span></span>
        {images.length > 0 && <span className="text-xs text-black/45">First image is primary — use ★ to change</span>}
      </div>
      <div
        role="button" tabIndex={0} aria-label="Upload images by dropping files or browsing"
        onClick={() => inputRef.current?.click()}
        onKeyDown={e => { if (e.key === "Enter" || e.key === " ") inputRef.current?.click(); }}
        onDragOver={e => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={e => { e.preventDefault(); setDragging(false); uploadFiles(e.dataTransfer.files); }}
        className={`flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed p-6 text-center transition ${dragging ? "border-[#9a5d19] bg-[#9a5d19]/5" : "border-black/15 hover:border-[#9a5d19]/60"}`}
      >
        {uploading > 0
          ? <span className="flex items-center gap-2 text-sm font-semibold text-[#9a5d19]"><Loader2 size={18} className="animate-spin" /> Uploading {uploading} image{uploading === 1 ? "" : "s"}…</span>
          : <><UploadCloud size={26} className="text-[#9a5d19]" /><span className="mt-2 text-sm font-semibold">Drag & drop images here, or click to browse</span><span className="mt-1 text-xs text-black/50">JPG, PNG or WebP · max {MAX_UPLOAD_MB}MB each · Cloudinary</span></>}
        <input ref={inputRef} type="file" accept="image/jpeg,image/png,image/webp,image/avif" multiple hidden onChange={e => { uploadFiles(e.target.files || []); e.target.value = ""; }} />
      </div>
      {images.length > 0 && (
        <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {images.map((url, i) => (
            <div key={url + i} className="group relative overflow-hidden rounded-xl border border-black/10 bg-[#eee9e1]">
              <img src={url} alt={`Artwork image ${i + 1}`} className="aspect-square w-full object-cover" loading="lazy" />
              {i === 0 && <span className="absolute left-2 top-2 rounded-full bg-[#9a5d19] px-2.5 py-1 text-[11px] font-bold text-white">Primary</span>}
              <div className="absolute right-2 top-2 flex gap-1.5 opacity-0 transition group-hover:opacity-100 focus-within:opacity-100">
                {i !== 0 && (
                  <button type="button" title="Set as primary" aria-label={`Set image ${i + 1} as primary`} onClick={() => onChange([url, ...images.filter((_, j) => j !== i)])} className="grid h-8 w-8 place-items-center rounded-full bg-white shadow hover:text-[#9a5d19]"><Star size={15} /></button>
                )}
                <button type="button" title="Remove image" aria-label={`Remove image ${i + 1}`} onClick={() => onChange(images.filter((_, j) => j !== i))} className="grid h-8 w-8 place-items-center rounded-full bg-white shadow hover:text-red-600"><X size={15} /></button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
