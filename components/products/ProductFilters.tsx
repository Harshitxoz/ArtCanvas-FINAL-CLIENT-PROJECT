"use client";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, useEffect } from "react";

export type FilterState = {
  type: string;
  category: string;
  minPrice: string;
  maxPrice: string;
  frame: string;
  availability: string;
  sizes: string[];
  sort: string;
};

export function parseFilters(search: URLSearchParams): FilterState {
  return {
    type: search.get("type") || "",
    category: search.get("category") || "",
    minPrice: search.get("minPrice") || "",
    maxPrice: search.get("maxPrice") || "",
    frame: search.get("frame") || "",
    availability: search.get("availability") || "",
    sizes: search.getAll("size"),
    sort: search.get("sort") || "",
  };
}

export const TYPE_OPTIONS = [
  { value: "hand-painted", label: "Hand-Painted" },
  { value: "printed-canvas", label: "Printed Canvas" },
];

export const CATEGORIES: { value: string; label: string }[] = [
  { value: "nature", label: "Nature" },
  { value: "abstract", label: "Abstract" },
  { value: "minimalist", label: "Minimalist" },
  { value: "modern", label: "Modern" },
  { value: "portraits", label: "Portraits" },
  { value: "animals", label: "Animals" },
  { value: "spiritual", label: "Spiritual" },
  { value: "landscapes", label: "Landscapes" },
  { value: "floral", label: "Floral" },
  { value: "custom-art", label: "Custom Art" },
];

export function categoryLabel(slug: string): string {
  return CATEGORIES.find((c) => c.value === slug)?.label ?? slug.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

export const SIZES = ["12x18", "18x24", "24x36", "36x48"];
export const SIZE_OPTIONS = SIZES;

export const FRAME_OPTIONS = [
  { value: "framed", label: "Framed" },
  { value: "unframed", label: "Unframed" },
];

export const AVAILABILITY_OPTIONS = [
  { value: "in-stock", label: "In Stock" },
  { value: "sold-out", label: "Sold Out" },
];

export const SORT_OPTIONS = [
  { value: "featured", label: "Featured" },
  { value: "newest", label: "Newest" },
  { value: "price-low", label: "Price: Low to High" },
  { value: "price-high", label: "Price: High to Low" },
  { value: "best-selling", label: "Best Selling" },
];

export function FilterSidebar({ basePath = "/shop", lockedType, lockedCategory }: { basePath?: string; lockedType?: string; lockedCategory?: string }) {
  const router = useRouter();
  const params = useSearchParams();
  const [fs, setFs] = useState(() => parseFilters(params));

  useEffect(() => setFs(parseFilters(params)), [params]);

  function set(key: keyof FilterState, value: string) {
    const p = new URLSearchParams(params.toString());
    value ? p.set(key, value) : p.delete(key);
    const href = basePath + (p.toString() ? "?" + p.toString() : "");
    router.push(href as never);
  }

  function toggleSize(value: string) {
    const p = new URLSearchParams(params.toString());
    if (p.getAll("size").includes(value)) p.delete("size", value);
    else p.append("size", value);
    const href = basePath + (p.toString() ? "?" + p.toString() : "");
    router.push(href as never);
  }

  function clearAll() {
    router.push(basePath as never);
  }

  const hasFilters = fs.type || fs.category || fs.minPrice || fs.maxPrice || fs.frame || fs.availability || fs.sizes.length ? 1 : 0;

  return (
    <aside className="w-full max-w-none rounded-3xl bg-white p-5 shadow-sm sm:p-6 lg:w-72 lg:flex-shrink-0">
      <div className="flex items-center justify-between">
        <h2 className="font-serif text-xl font-bold">Filters</h2>
        {hasFilters ? <button onClick={clearAll} className="text-xs font-semibold text-[#9a5d19] underline">Clear all</button> : null}
      </div>
      <div className="mt-6 space-y-5">
        <fieldset>
          <legend className="text-xs font-bold uppercase tracking-[0.1em] text-black/40">Art type</legend>
          <div className="mt-2 space-y-1.5">
            <label htmlFor="filter-type-all" className="flex items-center gap-2 text-sm"><input id="filter-type-all" type="radio" name="type" checked={fs.type === ""} onChange={() => set("type", "")} className="h-4 w-4 accent-[#9a5d19]" disabled={Boolean(lockedType)} /> All Artwork</label>
            {TYPE_OPTIONS.map(o => (<label key={o.value} htmlFor={`filter-type-${o.value}`} className={`flex items-center gap-2 text-sm ${lockedType && lockedType !== o.value ? "opacity-40" : ""}`}><input id={`filter-type-${o.value}`} type="radio" name="type" checked={lockedType ? lockedType === o.value : fs.type === o.value} onChange={() => set("type", o.value)} disabled={Boolean(lockedType)} className="h-4 w-4 accent-[#9a5d19]" /> {o.label}</label>))}
          </div>
        </fieldset>
        <fieldset>
          <legend className="text-xs font-bold uppercase tracking-[0.1em] text-black/40">Category</legend>
          <div className="mt-2 space-y-1.5">
            <label htmlFor="filter-category-all" className="flex items-center gap-2 text-sm"><input id="filter-category-all" type="radio" name="category" checked={fs.category === ""} onChange={() => set("category", "")} className="h-4 w-4 accent-[#9a5d19]" disabled={Boolean(lockedCategory)} /> All categories</label>
            {CATEGORIES.map(c => (<label key={c.value} htmlFor={`filter-category-${c.value}`} className={`flex items-center gap-2 text-sm ${lockedCategory && lockedCategory !== c.value ? "opacity-40" : ""}`}><input id={`filter-category-${c.value}`} type="radio" name="category" checked={lockedCategory ? lockedCategory === c.value : fs.category === c.value} onChange={() => set("category", c.value)} disabled={Boolean(lockedCategory)} className="h-4 w-4 accent-[#9a5d19]" /> {c.label}</label>))}
          </div>
        </fieldset>
        <fieldset>
          <legend className="text-xs font-bold uppercase tracking-[0.1em] text-black/40">Price range (Rs)</legend>
          <div className="mt-2 grid grid-cols-2 gap-2">
            <input type="number" min={0} placeholder="Min" value={fs.minPrice} onChange={e => set("minPrice", e.target.value)} className="w-full rounded-xl border border-black/10 px-3 py-2 text-sm" aria-label="Minimum price in rupees" />
            <input type="number" min={0} placeholder="Max" value={fs.maxPrice} onChange={e => set("maxPrice", e.target.value)} className="w-full rounded-xl border border-black/10 px-3 py-2 text-sm" aria-label="Maximum price in rupees" />
          </div>
        </fieldset>
        <fieldset>
          <legend className="text-xs font-bold uppercase tracking-[0.1em] text-black/40">Size</legend>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {SIZES.map(sz => {
              const checked = fs.sizes.includes(sz);
              return (<button key={sz} type="button" onClick={() => toggleSize(sz)} aria-pressed={checked} aria-label={"Size " + sz.replace("x", " by ")} className={`rounded-xl border px-3 py-1.5 text-xs font-semibold ${checked ? "border-[#9a5d19] bg-[#9a5d19]/10 text-[#9a5d19]" : "border-black/10 text-black/60 hover:border-[#9a5d19]/60"}`}>{sz.replace("x", "×")}</button>);
            })}
          </div>
        </fieldset>
        <fieldset>
          <legend className="text-xs font-bold uppercase tracking-[0.1em] text-black/40">Frame</legend>
          <div className="mt-2 space-y-1.5">
            <label htmlFor="filter-frame-all" className="flex items-center gap-2 text-sm"><input id="filter-frame-all" type="radio" name="frame" checked={fs.frame === ""} onChange={() => set("frame", "")} className="h-4 w-4 accent-[#9a5d19]" /> Any frame</label>
            {FRAME_OPTIONS.map(o => (<label key={o.value} htmlFor={`filter-frame-${o.value}`} className="flex items-center gap-2 text-sm"><input id={`filter-frame-${o.value}`} type="radio" name="frame" checked={fs.frame === o.value} onChange={() => set("frame", o.value)} className="h-4 w-4 accent-[#9a5d19]" /> {o.label}</label>))}
          </div>
        </fieldset>
        <fieldset>
          <legend className="text-xs font-bold uppercase tracking-[0.1em] text-black/40">Availability</legend>
          <div className="mt-2 space-y-1.5">
            <label htmlFor="filter-availability-all" className="flex items-center gap-2 text-sm"><input id="filter-availability-all" type="radio" name="availability" checked={fs.availability === ""} onChange={() => set("availability", "")} className="h-4 w-4 accent-[#9a5d19]" /> All artworks</label>
            {AVAILABILITY_OPTIONS.map(o => (<label key={o.value} htmlFor={`filter-availability-${o.value}`} className="flex items-center gap-2 text-sm"><input id={`filter-availability-${o.value}`} type="radio" name="availability" checked={fs.availability === o.value} onChange={() => set("availability", o.value)} className="h-4 w-4 accent-[#9a5d19]" /> {o.label}</label>))}
          </div>
        </fieldset>
      </div>
    </aside>
  );
}

