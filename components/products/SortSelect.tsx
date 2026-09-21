"use client";
import { useRouter, useSearchParams } from "next/navigation";

import type { Route } from "next";

const SORT_OPTIONS = [
  { value: "featured", label: "Featured" },
  { value: "newest", label: "Newest" },
  { value: "price-low", label: "Price: Low to High" },
  { value: "price-high", label: "Price: High to Low" },
  { value: "bestseller", label: "Best Selling" }
];

export function SortSelect({ basePath = "/shop" }: { basePath?: string }) {
  const router = useRouter();
  const params = useSearchParams();
  const current = params.get("sort") || "featured";

  function onChange(value: string) {
    const p = new URLSearchParams(params.toString());
    value ? p.set("sort", value) : p.delete("sort");
    const href = basePath + (p.toString() ? "?" + p.toString() : "");
    router.push(href as Route);
  }

  return (
    <select
      value={current}
      onChange={e => onChange(e.target.value)}
      className="rounded-xl border border-black/10 bg-white px-3 py-2 text-sm outline-none focus:border-[#9a5d19]"
      aria-label="Sort results"
    >
      {SORT_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
    </select>
  );
}
