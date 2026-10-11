"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import type { OrderNotificationRecord, OrderStatus } from "@/types";

export function NotificationHistory({
  orderId,
  currentStatus,
  notifications = []
}: {
  orderId: string;
  currentStatus: OrderStatus;
  notifications?: OrderNotificationRecord[];
}) {
  const router = useRouter();
  const [retryingType, setRetryingType] = useState<string | null>(null);

  async function handleResend(notificationType: string) {
    setRetryingType(notificationType);
    try {
      const res = await fetch(`/api/orders/${orderId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "resend_notification",
          notificationType,
          status: currentStatus
        })
      });

      const data = await res.json();
      if (!res.ok || data.ok === false) {
        throw new Error(data.error || "Could not dispatch notification");
      }

      toast.success("Notification sent successfully!");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to send notification");
    } finally {
      router.refresh();
      setRetryingType(null);
    }
  }

  const typeLabels: Record<string, string> = {
    payment_confirmed: "Payment Confirmed (Receipt)",
    order_shipped: "Order Shipped (Tracking)",
    order_delivered: "Order Delivered",
    order_cancelled: "Order Cancelled",
    order_refunded: "Refund Issued",
    order_status_update: "Status Update"
  };

  return (
    <div className="mt-4 space-y-3">
      {notifications.length === 0 ? (
        <div className="rounded-xl bg-[#faf7f2] p-4 text-sm text-neutral-600 border border-[#ebd9c5] flex flex-wrap items-center justify-between gap-3">
          <span>No customer notifications have been logged for this order yet.</span>
          <button
            type="button"
            disabled={Boolean(retryingType)}
            onClick={() => handleResend(currentStatus === "shipped" ? "order_shipped" : "payment_confirmed")}
            className="rounded-full bg-[#9a5d19] px-4 py-1.5 text-xs font-semibold text-white hover:bg-[#7f4b12] disabled:opacity-50"
          >
            {retryingType ? "Sending…" : "Send Notification Now"}
          </button>
        </div>
      ) : (
        <div className="space-y-2">
          {notifications.map((n, idx) => (
            <div
              key={idx}
              className={`rounded-xl p-3.5 text-xs border flex flex-wrap items-center justify-between gap-3 ${
                n.success ? "bg-white border-neutral-200" : "bg-red-50/70 border-red-200"
              }`}
            >
              <div className="min-w-0 space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-bold text-neutral-900">
                    {typeLabels[n.type] || n.type}
                  </span>
                  <span
                    className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                      n.success ? "bg-emerald-100 text-emerald-800" : "bg-red-100 text-red-800"
                    }`}
                  >
                    {n.success ? `Delivered (${n.provider})` : "Failed"}
                  </span>
                </div>
                <div className="text-neutral-500">
                  Recipient: <strong className="text-neutral-700">{n.recipient}</strong> •{" "}
                  {n.sentAt ? new Date(n.sentAt).toLocaleString("en-IN") : "Just now"}
                </div>
                {n.error && (
                  <div className="text-red-700 font-mono text-[11px]">
                    Error: {n.error}
                  </div>
                )}
              </div>

              <button
                type="button"
                disabled={Boolean(retryingType)}
                onClick={() => handleResend(n.type)}
                className="rounded-full border border-neutral-300 bg-neutral-50 px-3 py-1 text-[11px] font-semibold text-neutral-800 hover:bg-neutral-100 disabled:opacity-50"
              >
                {retryingType === n.type ? "Resending…" : "Resend Email"}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
