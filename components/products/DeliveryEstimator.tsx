"use client";

import { useState, useEffect } from "react";
import { Truck, MapPin, CheckCircle, ShieldCheck } from "lucide-react";

export function DeliveryEstimator() {
  const [pincode, setPincode] = useState("");
  const [checkedPincode, setCheckedPincode] = useState<string | null>(null);
  const [deliveryDate, setDeliveryDate] = useState<{ start: string; end: string } | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    try {
      const saved = localStorage.getItem("artcanvas_pincode");
      if (saved && /^\d{6}$/.test(saved)) {
        computeDates(saved);
        setCheckedPincode(saved);
        setPincode(saved);
      }
    } catch {}
  }, []);

  function computeDates(code: string) {
    // Metro / regular calculation simulation
    const now = new Date();
    const isMajorMetro = /^(11|40|56|60|70|50)/.test(code);
    const minDays = isMajorMetro ? 3 : 5;
    const maxDays = isMajorMetro ? 5 : 7;

    const start = new Date(now);
    start.setDate(start.getDate() + minDays);

    const end = new Date(now);
    end.setDate(end.getDate() + maxDays);

    const options: Intl.DateTimeFormatOptions = { weekday: "short", day: "numeric", month: "short" };
    setDeliveryDate({
      start: start.toLocaleDateString("en-IN", options),
      end: end.toLocaleDateString("en-IN", options),
    });
  }

  function handleCheck(e: React.FormEvent) {
    e.preventDefault();
    const clean = pincode.trim();
    if (!/^\d{6}$/.test(clean)) {
      setError("Please enter a valid 6-digit Indian PIN code.");
      setCheckedPincode(null);
      return;
    }
    setError(null);
    computeDates(clean);
    setCheckedPincode(clean);
    try {
      localStorage.setItem("artcanvas_pincode", clean);
    } catch {}
  }

  return (
    <div className="mt-6 rounded-2xl border border-black/8 bg-[#faf8f5] p-4 text-xs sm:text-sm">
      <div className="flex items-center gap-2 font-semibold text-neutral-800">
        <Truck size={17} className="text-[#9a5d19]" />
        <span>Delivery & Studio Dispatch</span>
      </div>

      {!checkedPincode ? (
        <form onSubmit={handleCheck} className="mt-3">
          <p className="text-neutral-500 text-xs mb-2">
            Enter your delivery PIN code to check studio dispatch timeline.
          </p>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <MapPin size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
              <input
                type="text"
                maxLength={6}
                inputMode="numeric"
                value={pincode}
                onChange={(e) => {
                  setPincode(e.target.value.replace(/\D/g, ""));
                  if (error) setError(null);
                }}
                placeholder="Enter 6-digit PIN code"
                className="w-full rounded-xl border border-black/15 bg-white py-2 pl-9 pr-3 text-xs outline-none focus:border-[#9a5d19]"
              />
            </div>
            <button
              type="submit"
              className="rounded-xl bg-[#9a5d19] px-4 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-[#834e15]"
            >
              Check
            </button>
          </div>
          {error && <p className="mt-1.5 text-xs text-red-600">{error}</p>}
        </form>
      ) : (
        <div className="mt-3 space-y-2">
          <div className="flex items-center justify-between border-b border-black/5 pb-2">
            <div className="flex items-center gap-1.5 font-medium text-emerald-800">
              <CheckCircle size={15} className="text-emerald-600" />
              <span>Deliverable to <strong>{checkedPincode}</strong></span>
            </div>
            <button
              type="button"
              onClick={() => {
                setCheckedPincode(null);
                setPincode("");
              }}
              className="text-xs text-[#9a5d19] hover:underline"
            >
              Change PIN
            </button>
          </div>

          {deliveryDate && (
            <p className="text-xs text-neutral-700">
              Estimated Delivery: <strong>{deliveryDate.start} – {deliveryDate.end}</strong>
            </p>
          )}

          <div className="flex flex-wrap gap-y-1 gap-x-4 pt-1 text-[11px] text-neutral-500">
            <span className="flex items-center gap-1">
              <ShieldCheck size={13} className="text-emerald-600" />
              Zero-damage wooden crate transit
            </span>
            <span className="flex items-center gap-1">
              <CheckCircle size={13} className="text-emerald-600" />
              Free shipping on orders above ₹999
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
