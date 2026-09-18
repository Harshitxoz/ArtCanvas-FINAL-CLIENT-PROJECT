"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Input } from "@/components/ui/Input";

export function RefundForm({
  orderId,
  orderTotal,
  existingRefund,
}: {
  orderId: string;
  orderTotal: number;
  existingRefund?: { id: string; amount: number; note?: string } | null;
}) {
  const router = useRouter();
  const [amount, setAmount] = useState(orderTotal);
  const [note, setNote] = useState(existingRefund?.note || "");
  const [loading, setLoading] = useState(false);

  if (existingRefund) {
    return (
      <div className="text-sm text-black/60">
        This order has already been refunded for {amount}.
      </div>
    );
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (amount <= 0 || amount > orderTotal) {
      toast.error("Refund amount must be between 0 and the order total.");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`/api/orders/${orderId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount, note }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not process refund");
      toast.success("Refund processed successfully");
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not process refund");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={submit} className="grid gap-4 sm:grid-cols-[1fr_2fr]">
      <label className="text-sm font-semibold">
        Amount (₹)
        <Input
          type="number"
          min={1}
          max={orderTotal}
          step={1}
          value={amount}
          onChange={e => setAmount(Number(e.target.value))}
          className="mt-1"
        />
      </label>
      <label className="text-sm font-semibold">
        Note
        <Input
          value={note}
          onChange={e => setNote(e.target.value)}
          className="mt-1"
          placeholder="Refund reason for records"
        />
      </label>
      <div className="sm:col-span-2">
        <button
          type="submit"
          disabled={loading}
          className="rounded-full bg-[#9a5d19] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#7f4b12] disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading ? "Processing…" : "Process Refund"}
        </button>
      </div>
    </form>
  );
}
