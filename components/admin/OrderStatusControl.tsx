"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

const STATUSES = [
  { value: "pending", label: "Pending" },
  { value: "paid", label: "Paid" },
  { value: "processing", label: "Processing" },
  { value: "packed", label: "Packed" },
  { value: "shipped", label: "Shipped" },
  { value: "delivered", label: "Delivered" },
  { value: "cancelled", label: "Cancelled" },
  { value: "refunded", label: "Refunded" }
];

export function OrderStatusControl({ orderId, current }: { orderId: string; current: string }) {
  const router = useRouter();
  const [status, setStatus] = useState(current);
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (status === current) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/orders/${orderId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not update order status");
      toast.success(`Order marked as ${status}`);
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not update order status");
      setStatus(current);
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={submit} className="flex flex-wrap items-center gap-3">
      <select
        className="rounded-xl border border-black/10 bg-white px-4 py-3 text-sm outline-none focus:border-[#9a5d19]"
        value={status}
        onChange={e => setStatus(e.target.value)}
      >
        {STATUSES.map(s => (
          <option key={s.value} value={s.value}>{s.label}</option>
        ))}
      </select>
      <button
        type="submit"
        disabled={loading || status === current}
        className="rounded-full bg-[#9a5d19] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#7f4b12] disabled:cursor-not-allowed disabled:opacity-50"
      >
        {loading ? "Saving…" : "Update Status"}
      </button>
    </form>
  );
}