"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Input } from "@/components/ui/Input";

const STATUSES = [
  { value: "pending", label: "Pending Payment" },
  { value: "paid", label: "Paid" },
  { value: "processing", label: "Processing" },
  { value: "packed", label: "Packed" },
  { value: "shipped", label: "Shipped" },
  { value: "delivered", label: "Delivered" },
  { value: "cancelled", label: "Cancelled" },
  { value: "refunded", label: "Refunded" }
];

export function OrderStatusControl({
  orderId,
  current,
  initialShipping
}: {
  orderId: string;
  current: string;
  initialShipping?: {
    shippingCarrier?: string;
    trackingNumber?: string;
    trackingUrl?: string;
    estimatedDelivery?: string;
    customerMessage?: string;
  };
}) {
  const router = useRouter();
  const [status, setStatus] = useState(current);
  const [shippingCarrier, setShippingCarrier] = useState(initialShipping?.shippingCarrier || "");
  const [trackingNumber, setTrackingNumber] = useState(initialShipping?.trackingNumber || "");
  const [trackingUrl, setTrackingUrl] = useState(initialShipping?.trackingUrl || "");
  const [estimatedDelivery, setEstimatedDelivery] = useState(initialShipping?.estimatedDelivery || "");
  const [customerMessage, setCustomerMessage] = useState(initialShipping?.customerMessage || "");
  const [notifyCustomer, setNotifyCustomer] = useState(true);
  const [loading, setLoading] = useState(false);

  const isShipped = status === "shipped";
  const hasChanges =
    status !== current ||
    shippingCarrier !== (initialShipping?.shippingCarrier || "") ||
    trackingNumber !== (initialShipping?.trackingNumber || "") ||
    trackingUrl !== (initialShipping?.trackingUrl || "") ||
    estimatedDelivery !== (initialShipping?.estimatedDelivery || "") ||
    customerMessage !== (initialShipping?.customerMessage || "");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!hasChanges) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/orders/${orderId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status,
          shippingCarrier: shippingCarrier.trim(),
          trackingNumber: trackingNumber.trim(),
          trackingUrl: trackingUrl.trim(),
          estimatedDelivery: estimatedDelivery.trim(),
          customerMessage: customerMessage.trim(),
          notifyCustomer
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not update order status");

      if (notifyCustomer && data.notification) {
        if (data.notification.alreadySent) {
          toast.success(`Order updated to ${status} (email notification already sent)`);
        } else if (data.notification.simulated || data.notification.provider === "mock") {
          toast.info(`Order updated to ${status} (email simulated in mock mode — not sent)`);
        } else if (data.notification.ok) {
          toast.success(`Order updated to ${status} and customer notified via email`);
        } else {
          toast.warning(
            `Order updated to ${status}, but customer email failed: ${data.notification.error || "Delivery failed"}`
          );
        }
      } else {
        toast.success(`Order updated to ${status}`);
      }

      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not update order status");
      setStatus(current);
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
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
          disabled={loading || !hasChanges}
          className="rounded-full bg-[#9a5d19] px-6 py-3 text-sm font-semibold text-white transition hover:bg-[#7f4b12] disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading ? "Saving…" : "Save Status & Changes"}
        </button>
      </div>

      {/* Extended Shipping & Tracking Fields when status is Shipped */}
      {isShipped && (
        <div className="rounded-2xl border border-amber-200/80 bg-[#fdfaf5] p-5 space-y-4">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#9a5d19]">
            <span>🚚 Shipping & Tracking Details (included in customer dispatch email)</span>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <span className="block text-xs font-semibold text-neutral-700 mb-1">
                Courier / Shipping Provider
              </span>
              <Input
                placeholder="e.g. Blue Dart, Delhivery, DTDC"
                value={shippingCarrier}
                onChange={e => setShippingCarrier(e.target.value)}
              />
            </div>
            <div>
              <span className="block text-xs font-semibold text-neutral-700 mb-1">
                Tracking ID / AWB Number
              </span>
              <Input
                placeholder="e.g. BD982341209IN"
                value={trackingNumber}
                onChange={e => setTrackingNumber(e.target.value)}
              />
            </div>
            <div>
              <span className="block text-xs font-semibold text-neutral-700 mb-1">
                Clickable Tracking URL
              </span>
              <Input
                type="url"
                placeholder="https://track.bluedart.com/..."
                value={trackingUrl}
                onChange={e => setTrackingUrl(e.target.value)}
              />
            </div>
            <div>
              <span className="block text-xs font-semibold text-neutral-700 mb-1">
                Estimated Delivery Date
              </span>
              <Input
                placeholder="e.g. 15 October, 2026"
                value={estimatedDelivery}
                onChange={e => setEstimatedDelivery(e.target.value)}
              />
            </div>
          </div>
        </div>
      )}

      {/* Customer Message & Email Notification Checkbox */}
      <div className="pt-1 space-y-3">
        <div>
          <span className="block text-xs font-semibold text-neutral-700 mb-1">
            Optional message for customer (included in email notification)
          </span>
          <Input
            placeholder="e.g. Custom wooden corner framing completed. Dispatched via express courier."
            value={customerMessage}
            onChange={e => setCustomerMessage(e.target.value)}
          />
        </div>

        <label className="flex items-center gap-2.5 text-xs font-medium text-neutral-700 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={notifyCustomer}
            onChange={e => setNotifyCustomer(e.target.checked)}
            className="h-4 w-4 rounded border-neutral-300 text-[#9a5d19] focus:ring-[#9a5d19]"
          />
          <span>Automatically send notification email to customer on save</span>
        </label>
      </div>
    </form>
  );
}