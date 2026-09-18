"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Input } from "@/components/ui/Input";

const FIELD_LABELS: Record<string, string> = {
  shippingCarrier: "Carrier",
  trackingNumber: "Tracking number",
  trackingUrl: "Tracking URL",
  estimatedDelivery: "Estimated delivery",
  adminShippingNotes: "Admin notes",
};

export function ShippingForm({
  orderId,
  initial,
}: {
  orderId: string;
  initial: Record<string, string>;
}) {
  const router = useRouter();
  const [form, setForm] = useState(initial);
  const [loading, setLoading] = useState(false);

  function handleChange(key: string, value: string) {
    setForm({ ...form, [key]: value });
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch(`/api/orders/${orderId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || data.details || "Could not update shipping");
      toast.success("Shipping details saved");
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not update shipping");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={submit} className="grid gap-4 sm:grid-cols-2">
      {Object.entries(FIELD_LABELS).map(([key, label]) => (
        <label key={key} className="text-sm font-semibold">
          {label}
          <Input
            className="mt-1"
            value={form[key] || ""}
            onChange={e => handleChange(key, e.target.value)}
            {...(key === "trackingUrl" ? { type: "url" } : {})}
          />
        </label>
      ))}
      <div className="sm:col-span-2">
        <button
          type="submit"
          disabled={loading}
          className="rounded-full bg-[#9a5d19] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#7f4b12] disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading ? "Saving…" : "Save Shipping"}
        </button>
      </div>
    </form>
  );
}
