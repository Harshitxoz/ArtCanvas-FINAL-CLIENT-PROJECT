"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Input } from "@/components/ui/Input";

export function NotesForm({
  orderId,
  initialNote,
}: {
  orderId: string;
  initialNote: string;
}) {
  const router = useRouter();
  const [note, setNote] = useState(initialNote);
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch(`/api/orders/${orderId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ adminShippingNotes: note }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || data.details || "Could not save note");
      toast.success("Note saved");
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not save note");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={submit} className="grid gap-3">
      <label className="text-sm font-semibold">
        Internal note
        <textarea
          value={note}
          onChange={e => setNote(e.target.value)}
          className="mt-1 block w-full rounded-xl border border-black/10 bg-white px-3 py-2.5 text-sm outline-none focus:border-[#9a5d19]"
          rows={4}
          placeholder="Add a note for internal reference..."
        />
      </label>
      <div>
        <button
          type="submit"
          disabled={loading}
          className="rounded-full bg-[#9a5d19] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#7f4b12] disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading ? "Saving…" : "Save Note"}
        </button>
      </div>
    </form>
  );
}
