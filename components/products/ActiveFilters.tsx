"use client";
import { useRouter, useSearchParams } from "next/navigation";
import { parseFilters } from "./ProductFilters";

export function ActiveFilters({ basePath = "/shop", lockedType, lockedCategory }: { basePath?: string; lockedType?: string; lockedCategory?: string }) {
  const router = useRouter();
  const params = useSearchParams();
  const fs = parseFilters(params);

  const chips: { label: string; remove: () => void }[] = [];
  if (fs.type && !lockedType) chips.push({ label: fs.type === "hand-painted" ? "Hand-Painted" : "Printed Canvas", remove: () => remove("type") });
  if (fs.category && !lockedCategory) chips.push({ label: fs.category, remove: () => remove("category") });
  if (fs.minPrice) chips.push({ label: "Min ₹" + fs.minPrice, remove: () => remove("minPrice") });
  if (fs.maxPrice) chips.push({ label: "Max ₹" + fs.maxPrice, remove: () => remove("maxPrice") });
  if (fs.frame) chips.push({ label: fs.frame, remove: () => remove("frame") });
  if (fs.availability) chips.push({ label: fs.availability === "in-stock" ? "In Stock" : "Sold Out", remove: () => remove("availability") });
  if (fs.sizes.length) fs.sizes.forEach(sz => chips.push({ label: sz.replace("x", "×"), remove: () => removeSize(sz) }));

  function remove(key: string) {
    const p = new URLSearchParams(params.toString());
    p.delete(key);
    const href = basePath + (p.toString() ? "?" + p.toString() : "");
    router.push(href as never);
  }
  function removeSize(sz: string) {
    const p = new URLSearchParams(params.toString());
    p.delete("size", sz);
    const href = basePath + (p.toString() ? "?" + p.toString() : "");
    router.push(href as never);
  }

  if (!chips.length) return null;
  return (
    <div className="mb-4 flex flex-wrap items-center gap-2">
      {chips.map((c, i) => (
        <span key={i} className="inline-flex items-center gap-1.5 rounded-full bg-[#9a5d19]/10 px-3 py-1 text-xs font-semibold text-[#9a5d19]">
          {c.label}
          <button onClick={c.remove} className="grid h-4 w-4 place-items-center rounded-full hover:bg-black/10" aria-label={"Remove " + c.label}>✕</button>
        </span>
      ))}
    </div>
  );
}
