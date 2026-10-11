"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Input } from "@/components/ui/Input";

const FIELD_LABELS: Record<string, string> = {
  shippingCarrier: "Courier / Shipping Carrier",
  trackingNumber: "Tracking ID / AWB Number",
  trackingUrl: "Tracking URL (clickable link)",
  estimatedDelivery: "Estimated delivery (e.g. 15 Oct, 2026)",
  customerMessage: "Message for customer (included in shipping email)",
  adminShippingNotes: "Internal studio notes (never sent to customer)",
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
  const [notifyCustomer, setNotifyCustomer] = useState(true);
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
        body: JSON.stringify({ ...form, notifyCustomer }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || data.details || "Could not update shipping");

      if (notifyCustomer && data.notification) {
        if (data.notification.ok) {
          if (data.notification.alreadySent) {
            toast.success("Shipping details saved (email notification already sent)");
          } else {
            toast.success("Shipping details saved and customer notified via email");
          }
        } else {
          toast.warning(
            `Shipping details saved, but customer email failed: ${data.notification.error || "Delivery failed"}`
          );
        }
      } else {
        toast.success("Shipping details saved");
      }

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
        <label key={key} className={`text-sm font-semibold ${key === "adminShippingNotes" || key === "customerMessage" ? "sm:col-span-2" : ""}`}>
          {label}
          <Input
            className="mt-1"
            value={form[key] || ""}
            onChange={e => handleChange(key, e.target.value)}
            {...(key === "trackingUrl" ? { type: "url" } : {})}
          />
        </label>
      ))}

      <div className="sm:col-span-2 flex items-center gap-2.5 pt-1">
        <label className="flex items-center gap-2 text-xs font-medium text-neutral-700 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={notifyCustomer}
            onChange={e => setNotifyCustomer(e.target.checked)}
            className="h-4 w-4 rounded border-neutral-300 text-[#9a5d19] focus:ring-[#9a5d19]"
          />
          <span>Send dispatch notification email to customer with tracking details</span>
        </label>
      </div>

      <div className="sm:col-span-2">
        <button
          type="submit"
          disabled={loading}
          className="rounded-full bg-[#9a5d19] px-6 py-3 text-sm font-semibold text-white transition hover:bg-[#7f4b12] disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading ? "Saving…" : "Save Shipping Details"}
        </button>
      </div>
    </form>
  );
}
