"use client";
import { useState } from "react";
import { Filter, X } from "lucide-react";
import { FilterSidebar } from "./ProductFilters";

export function FilterDrawer({ activeCount, basePath = "/shop", lockedType, lockedCategory }: { activeCount: number; basePath?: string; lockedType?: string; lockedCategory?: string }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-2 rounded-full border border-black/10 bg-white px-4 py-2.5 text-sm font-semibold hover:bg-[#9a5d19]/5 lg:hidden"
      >
        <Filter size={18} /> Filters {activeCount ? <span className="grid h-5 min-w-[20px] place-items-center rounded-full bg-[#9a5d19] px-1 text-[10px] font-bold text-white">{activeCount}</span> : null}
      </button>
      {open && (
        <div className="fixed inset-0 z-50 grid h-auto max-h-full w-full place-items-start overflow-y-auto overscroll-contain bg-black/50 p-4" role="dialog" aria-modal="true" aria-label="Filters" onClick={() => setOpen(false)}>
          <div className="mx-auto w-full max-w-2xl rounded-3xl bg-[#f9f5f0] p-1 shadow-xl" onClick={e => e.stopPropagation()}>
            <div className="relative rounded-2xl bg-white p-6">
              <button type="button" onClick={() => setOpen(false)} className="absolute right-4 top-4 text-black/40 hover:text-black" aria-label="Close filters"><X size={20} /></button>
              <FilterSidebar basePath={basePath} lockedType={lockedType} lockedCategory={lockedCategory} />
            </div>
          </div>
        </div>
      )}
    </>
  );
}
