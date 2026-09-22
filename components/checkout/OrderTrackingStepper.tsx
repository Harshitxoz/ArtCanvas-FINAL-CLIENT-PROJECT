"use client";

import { CheckCircle2, Clock, PackageCheck, Truck, ExternalLink } from "lucide-react";

interface OrderTrackingStepperProps {
  status: string;
  shippingCarrier?: string;
  trackingNumber?: string;
  trackingUrl?: string;
  estimatedDelivery?: string;
}

const STEPS = [
  { id: "paid", label: "Confirmed", description: "Payment verified" },
  { id: "processing", label: "Studio Framing", description: "Canvas preparation" },
  { id: "shipped", label: "Dispatched", description: "In courier transit" },
  { id: "delivered", label: "Delivered", description: "Safely received" },
];

function getActiveStepIndex(status: string): number {
  const s = status.toLowerCase();
  if (s === "pending") return 0;
  if (s === "paid" || s === "confirmed") return 1;
  if (s === "processing" || s === "packed") return 2;
  if (s === "shipped") return 3;
  if (s === "delivered") return 4;
  if (s === "cancelled" || s === "refunded") return -1;
  return 1;
}

export function OrderTrackingStepper({
  status,
  shippingCarrier,
  trackingNumber,
  trackingUrl,
  estimatedDelivery,
}: OrderTrackingStepperProps) {
  const activeIdx = getActiveStepIndex(status);
  const isCancelled = status.toLowerCase() === "cancelled" || status.toLowerCase() === "refunded";

  if (isCancelled) {
    return (
      <div className="rounded-2xl border border-rose-200 bg-rose-50/70 p-4 text-xs text-rose-800">
        <p className="font-semibold capitalize">Order {status}</p>
        <p className="mt-0.5 text-rose-600">
          This order was {status.toLowerCase()}. Any associated payment refund has been initiated.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-black/8 bg-[#faf8f5] p-5 sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-black/5 pb-4">
        <div>
          <span className="text-[11px] font-bold uppercase tracking-wider text-[#9a5d19]">
            Shipment Progress
          </span>
          <p className="text-sm font-semibold text-neutral-800">
            {activeIdx === 4
              ? "Delivered successfully"
              : activeIdx === 3
              ? "In transit with courier"
              : activeIdx === 2
              ? "Being hand-framed & packaged"
              : "Order received & payment verified"}
          </p>
        </div>

        {estimatedDelivery && (
          <div className="rounded-xl bg-white px-3 py-1.5 text-xs text-neutral-600 shadow-sm border border-black/5">
            Est. Arrival: <strong>{estimatedDelivery}</strong>
          </div>
        )}
      </div>

      {/* Stepper Progress Bar */}
      <div className="mt-6 relative">
        {/* Connecting Line */}
        <div className="absolute top-4 left-6 right-6 h-0.5 bg-neutral-200" />
        <div
          className="absolute top-4 left-6 h-0.5 bg-[#9a5d19] transition-all duration-500"
          style={{
            width: `${Math.min(Math.max((activeIdx - 1) / (STEPS.length - 1), 0), 1) * 85}%`,
          }}
        />

        {/* Step Nodes */}
        <div className="relative flex justify-between">
          {STEPS.map((step, idx) => {
            const isPassed = activeIdx > idx + 1;
            const isCurrent = activeIdx === idx + 1;

            return (
              <div key={step.id} className="flex flex-col items-center text-center max-w-[80px] sm:max-w-[100px]">
                <div
                  className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold transition-all shadow-sm ${
                    isPassed
                      ? "bg-[#9a5d19] text-white ring-4 ring-[#9a5d19]/20"
                      : isCurrent
                      ? "bg-[#9a5d19] text-white ring-4 ring-[#9a5d19]/30 scale-110"
                      : "bg-white text-neutral-400 border border-neutral-300"
                  }`}
                >
                  {isPassed ? <CheckCircle2 size={16} /> : idx + 1}
                </div>
                <p
                  className={`mt-2 text-[11px] sm:text-xs font-semibold ${
                    isCurrent || isPassed ? "text-neutral-900" : "text-neutral-400"
                  }`}
                >
                  {step.label}
                </p>
                <span className="hidden sm:block text-[10px] text-neutral-500 mt-0.5">
                  {step.description}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Courier & Tracking Details Card */}
      {(shippingCarrier || trackingNumber || trackingUrl) && (
        <div className="mt-6 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-neutral-200 bg-white p-3.5 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#faf7f2] text-[#9a5d19]">
              <Truck size={18} />
            </div>
            <div>
              <p className="text-xs text-neutral-500">
                Carrier: <strong>{shippingCarrier || "Artisan Courier"}</strong>
              </p>
              {trackingNumber && (
                <p className="font-mono text-xs text-neutral-800">
                  Tracking No: <strong>{trackingNumber}</strong>
                </p>
              )}
            </div>
          </div>

          {trackingUrl && (
            <a
              href={trackingUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 rounded-full bg-[#9a5d19] px-4 py-2 text-xs font-semibold text-white transition hover:bg-[#834e15]"
            >
              <span>Track Live</span>
              <ExternalLink size={13} />
            </a>
          )}
        </div>
      )}
    </div>
  );
}
