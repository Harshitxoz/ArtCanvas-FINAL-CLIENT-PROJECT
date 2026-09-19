"use client";

import Link from "next/link";
import { Printer, ShoppingBag, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/Button";

export function OrderConfirmationActions() {
  return (
    <div className="flex flex-wrap items-center justify-center gap-4 pt-6 print:hidden">
      <button
        type="button"
        onClick={() => window.print()}
        className="inline-flex items-center gap-2 rounded-full border border-neutral-300 bg-white px-5 py-3 text-sm font-semibold text-neutral-800 shadow-sm transition hover:bg-neutral-50"
      >
        <Printer size={16} />
        Print / Save Invoice
      </button>
      <Link href="/shop">
        <Button className="flex items-center gap-2 bg-[#9a5d19] text-white hover:bg-[#834e15]">
          <ShoppingBag size={16} />
          Continue Shopping
          <ArrowRight size={16} />
        </Button>
      </Link>
    </div>
  );
}
