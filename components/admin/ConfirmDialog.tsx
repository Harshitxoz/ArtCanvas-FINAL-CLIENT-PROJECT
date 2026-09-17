"use client";
import { useState } from "react";
import type { ReactNode } from "react";

export function ConfirmDialog({
  trigger, title, message, confirmLabel = "Confirm", danger = true, onConfirm
}: {
  trigger: ReactNode;
  title: string;
  message: string;
  confirmLabel?: string;
  danger?: boolean;
  onConfirm: () => void | Promise<void>;
}) {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  async function confirm() {
    setBusy(true);
    try {
      await onConfirm();
      setOpen(false);
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <span onClick={() => setOpen(true)} className="inline-flex">{trigger}</span>
      {open && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/50 p-4" role="dialog" aria-modal="true" aria-label={title} onClick={() => !busy && setOpen(false)}>
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl" onClick={e => e.stopPropagation()}>
            <h2 className="font-serif text-2xl font-bold">{title}</h2>
            <p className="mt-2 text-sm leading-6 text-black/60">{message}</p>
            <div className="mt-6 flex justify-end gap-3">
              <button type="button" disabled={busy} onClick={() => setOpen(false)} className="rounded-full border border-black/15 px-5 py-2.5 text-sm font-semibold hover:bg-black/5 disabled:opacity-50">Cancel</button>
              <button
                type="button" disabled={busy} onClick={confirm} autoFocus
                className={`rounded-full px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-50 ${danger ? "bg-red-600 hover:bg-red-700" : "bg-[#9a5d19] hover:bg-[#7f4b12]"}`}
              >
                {busy ? "Working…" : confirmLabel}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
