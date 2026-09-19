"use client";
import { useRef, useState } from "react";
import { X, Star, UploadCloud, Loader2, Check } from "lucide-react";
import { toast } from "sonner";
import { ConfirmDialog } from "./ConfirmDialog";
import { MAX_UPLOAD_MB } from "@/lib/constants";
import type { ImageAsset } from "@/types";

const ACCEPTED = ["image/jpeg", "image/png", "image/webp", "image/avif"];

interface ImageUploaderProps {
  images: ImageAsset[];
  onChange: (assets: ImageAsset[]) => void;
  onSaveImageAction?: (action: string, index: number) => Promise<void>;
  label?: string;
  max?: number;
  disabled?: boolean;
}

export function ImageUploader({
  images,
  onChange,
  onSaveImageAction,
  label = "Artwork images",
  max = 8,
  disabled = false
}: ImageUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(0);
  const [removingIndex, setRemovingIndex] = useState<number | null>(null);
  const [settingPrimaryIndex, setSettingPrimaryIndex] = useState<number | null>(null);

  async function uploadFiles(files: FileList | File[]) {
    if (disabled) return;
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
      const assets: ImageAsset[] = [];
      for (const file of list) {
        const fd = new FormData();
        fd.append("file", file);
        const r = await fetch("/api/upload", { method: "POST", body: fd });
        const d = await r.json();
        if (!r.ok) throw new Error(d.error || `Upload failed for ${file.name}`);
        assets.push({ url: d.url, publicId: d.publicId });
        setUploading(c => Math.max(0, c - 1));
      }
      onChange([...images, ...assets]);
      toast.success(`${assets.length} image${assets.length === 1 ? "" : "s"} uploaded`);
    } catch (e) {
      setUploading(0);
      toast.error(e instanceof Error ? e.message : "Upload failed");
    }
  }

  async function handleRemove(index: number) {
    if (disabled) return;
    if (images.length <= 1) {
      toast.error("This is the only artwork image. Add another image before removing it.");
      return;
    }
    if (index === 0) {
      toast.error("Cannot remove the primary image. Set another image as primary first.");
      return;
    }

    setRemovingIndex(index);
    try {
      if (onSaveImageAction) {
        await onSaveImageAction("remove", index);
      } else {
        onChange(images.filter((_, i) => i !== index));
      }
      toast.success("Image removed from gallery");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not remove image");
    } finally {
      setRemovingIndex(null);
    }
  }

  async function handleSetPrimary(index: number) {
    if (disabled) return;
    if (index === 0) return;

    setSettingPrimaryIndex(index);
    try {
      if (onSaveImageAction) {
        await onSaveImageAction("setPrimary", index);
      } else {
        const reordered = [...images];
        const [primary] = reordered.splice(index, 1);
        reordered.unshift(primary);
        onChange(reordered);
      }
      toast.success("Image set as primary");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not set primary image");
    } finally {
      setSettingPrimaryIndex(null);
    }
  }

  return (
    <div>
      <div className="mb-3 flex items-center justify-between">
        <span className="text-sm font-semibold">{label} <span className="font-normal text-black/45">({images.length}/{max})</span></span>
        {images.length > 0 && <span className="text-xs text-black/45">First image is primary — use ★ to change</span>}
      </div>

      {/* Upload area */}
      <div
        role="button"
        tabIndex={disabled ? -1 : 0}
        aria-label="Upload images by dropping files or browsing"
        onClick={() => inputRef.current?.click()}
        onKeyDown={e => { if (!disabled && (e.key === "Enter" || e.key === " ")) inputRef.current?.click(); }}
        onDragOver={e => { e.preventDefault(); if (!disabled) setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={e => { e.preventDefault(); setDragging(false); uploadFiles(e.dataTransfer.files); }}
        className={`mb-4 cursor-pointer flex flex-col items-center justify-center rounded-2xl border-2 border-dashed p-6 text-center transition ${disabled ? "opacity-50 cursor-not-allowed" : dragging ? "border-[#9a5d19] bg-[#9a5d19]/5" : "border-black/15 hover:border-[#9a5d19]/60"}`}
      >
        {uploading > 0
          ? <span className="flex items-center gap-2 text-sm font-semibold text-[#9a5d19]"><Loader2 size={18} className="animate-spin" /> Uploading {uploading} image{uploading === 1 ? "" : "s"}…</span>
          : <><UploadCloud size={26} className="text-[#9a5d19]" /><span className="mt-2 text-sm font-semibold">Drag & drop images here, or click to browse</span><span className="mt-1 text-xs text-black/50">JPG, PNG or WebP · max {MAX_UPLOAD_MB}MB each · Cloudinary</span></>}
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/avif"
          multiple
          hidden
          onChange={e => { uploadFiles(e.target.files || []); e.target.value = ""; }}
          disabled={disabled || uploading > 0}
        />
      </div>

      {/* Image gallery */}
      {images.length > 0 && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {images.map((asset, i) => (
            <div
              key={asset.url + i}
              className={`group relative overflow-hidden rounded-xl border ${i === 0 ? "border-[#9a5d19]/40" : "border-black/10"} bg-[#eee9e1] ${disabled ? "opacity-70" : ""}`}
            >
              {/* Image preview */}
              <div className="aspect-square w-full overflow-hidden">
                <img
                  src={asset.url}
                  alt={`Artwork image ${i + 1}`}
                  className="h-full w-full object-cover transition hover:scale-105"
                  loading="lazy"
                />
              </div>

              {/* Primary badge */}
              {i === 0 && (
                <span className="absolute left-2 top-2 rounded-full bg-[#9a5d19] px-2.5 py-1 text-[11px] font-bold text-white">Primary</span>
              )}

              {/* Action buttons */}
              <div className="absolute right-2 top-2 flex gap-1.5">
                {/* Set Primary - visible on all images except primary */}
                {i !== 0 && (
                  <button
                    type="button"
                    title="Set as primary"
                    aria-label={`Set image ${i + 1} as primary`}
                    disabled={disabled || settingPrimaryIndex === i}
                    onClick={() => handleSetPrimary(i)}
                    className="grid h-9 w-9 place-items-center rounded-full bg-white/95 shadow hover:bg-white hover:text-[#9a5d19] active:scale-95 disabled:opacity-50"
                  >
                    {settingPrimaryIndex === i ? <Check size={16} className="text-[#9a5d19]" /> : <Star size={16} className="text-black" fill="currentColor" />}
                  </button>
                )}

                {/* Remove - visible on all images */}
                <ConfirmDialog
                  trigger={
                    <button
                      type="button"
                      title="Remove image"
                      aria-label={`Remove image ${i + 1}`}
                      disabled={disabled || removingIndex === i || (i === 0 && images.length > 1)}
                      onClick={() => handleRemove(i)}
                      className="grid h-9 w-9 place-items-center rounded-full bg-white/95 shadow hover:bg-white hover:text-red-600 active:scale-95 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {removingIndex === i ? <Loader2 size={16} className="text-red-600 animate-spin" /> : <X size={16} className="text-black" />}
                    </button>
                  }
                  title="Remove artwork image?"
                  message="Remove this image from the artwork gallery?"
                  confirmLabel="Remove Image"
                  danger={true}
                  onConfirm={() => handleRemove(i)}
                />
              </div>

              {/* Image number indicator for accessibility */}
              <div className="absolute bottom-2 left-2 rounded-full bg-black/50 px-2 py-0.5 text-[10px] font-medium text-white/90">
                {i + 1}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add image button when under max */}
      {images.length < max && (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={disabled || uploading > 0}
          className="flex h-32 cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-black/20 bg-white/50 text-center text-sm text-black/40 hover:border-[#9a5d19]/60 hover:bg-white/80 hover:text-[#9a5d19] disabled:opacity-50 transition"
        >
          <UploadCloud size={24} className="text-[#9a5d19]" />
          <span className="mt-2 font-semibold">Add image</span>
          <span className="text-xs text-black/40">{images.length}/{max}</span>
        </button>
      )}

      {/* Helper text */}
      <p className="mt-3 text-xs text-black/50">
        Upload up to {max} images. The first image is your primary artwork image and will appear first on the storefront.
      </p>
    </div>
  );
}
