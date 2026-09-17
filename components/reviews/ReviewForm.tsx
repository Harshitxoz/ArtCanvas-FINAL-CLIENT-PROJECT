"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
export function ReviewForm({ productId, onSubmitted }: { productId: string; onSubmitted: () => void }) {
  const [auth, setAuth] = useState<"loading" | "in" | "out">("loading");
  const [rating, setRating] = useState(0);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [formError, setFormError] = useState("");
  const [status, setStatus] = useState<"idle" | "busy" | "done" | "fail">("idle");
  const [message, setMessage] = useState("");
  useEffect(() => {
    let live = true;
    async function check() {
      try {
        const res = await fetch("/api/auth/me", { cache: "no-store" });
        const data: unknown = await res.json();
        let signedIn = false;
        if (data && typeof data === "object" && "user" in data) {
          signedIn = (data as { user: { id: string } | null }).user !== null;
        }
        if (live) setAuth(signedIn ? "in" : "out");
      } catch { if (live) setAuth("out"); }
    }
    void check();
    return () => { live = false; };
  }, []);
  if (auth === "loading") {
    return <div className="rounded-3xl bg-white p-6 text-sm text-black/55 shadow-sm" role="status">Checking sign-in status…</div>;
  }
  if (auth === "out") {
    return (
      <div className="rounded-3xl bg-white p-6 shadow-sm sm:p-8">
        <h3 className="font-serif text-2xl font-bold">Write a Review</h3>
        <p className="mt-2 text-sm leading-6 text-black/60">Please sign in to share your experience with this artwork.</p>
        <Link href="/login" className="mt-4 inline-flex items-center justify-center rounded-full bg-[#9a5d19] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#7f4b12]">Sign In to Review</Link>
      </div>
    );
  }
  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setFormError("");
    setMessage("");
    const tb = body.trim();
    const tt = title.trim();
    if (rating < 1 || rating > 5) { setFormError("Please select a rating from 1 to 5 stars."); return; }
    if (tb.length < 10) { setFormError("Please write at least 10 characters."); return; }
    if (tb.length > 2000) { setFormError("Please keep your review under 2000 characters."); return; }
    if (tt.length > 120) { setFormError("Please keep the headline under 120 characters."); return; }
    setStatus("busy");
    try {
      const res = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId, rating, title: tt, body: tb }),
      });
      const data: unknown = await res.json();
      let errMsg = "Could not submit your review.";
      let okMsg = "Thank you! Your review was submitted and is pending moderation.";
      if (data && typeof data === "object") {
        const rec = data as { error?: unknown; message?: unknown };
        if (typeof rec.error === "string") errMsg = rec.error;
        if (typeof rec.message === "string") okMsg = rec.message;
      }
      if (!res.ok) throw new Error(errMsg);
      setStatus("done");
      setMessage(okMsg);
      setRating(0); setTitle(""); setBody("");
      onSubmitted();
    } catch (err) { setStatus("fail"); setMessage(err instanceof Error ? err.message : "Could not submit."); }
  }
  if (status === "done") {
    return (
      <div className="rounded-3xl border border-[#9a5d19]/25 bg-[#faf6ef] p-6 shadow-sm sm:p-8" role="status">
        <h3 className="font-serif text-2xl font-bold">Review submitted</h3>
        <p className="mt-2 text-sm leading-6 text-black/65">{message}</p>
        <p className="mt-1 text-sm text-black/55">It will appear below once approved by our team.</p>
        <button type="button" onClick={() => { setStatus("idle"); setMessage(""); }} className="mt-4 rounded-full border border-black/15 px-5 py-2.5 text-sm font-semibold transition hover:border-[#9a5d19] hover:text-[#9a5d19]">Write another review</button>
      </div>
    );
  }
  return (
    <form onSubmit={submit} className="rounded-3xl bg-white p-6 shadow-sm sm:p-8" aria-label="Write a review">
      <h3 className="font-serif text-2xl font-bold">Write a Review</h3>
      <p className="mt-1 text-sm text-black/55">Share what you loved. Reviews are published after moderation.</p>
      <fieldset className="mt-5">
        <legend className="text-sm font-semibold">Your rating</legend>
        <div className="mt-2 flex items-center gap-1" role="radiogroup" aria-label="Select a star rating">
          {[1, 2, 3, 4, 5].map((v) => (
            <button key={v} type="button" onClick={() => setRating(v)} aria-label={`${v} star${v > 1 ? "s" : ""}`} aria-pressed={rating === v} className="rounded-lg p-1 text-3xl leading-none transition focus-visible:outline-2 focus-visible:outline-[#9a5d19]">
              <span aria-hidden="true" className={v <= rating ? "text-[#9a5d19]" : "text-black/20"}>★</span>
            </button>
          ))}
          <span className="ml-2 text-sm text-black/55" aria-live="polite">{rating > 0 ? `${rating} / 5` : "Select a rating"}</span>
        </div>
      </fieldset>
      <div className="mt-4 grid gap-4">
        <label className="text-sm font-semibold">Headline <span className="font-normal text-black/45">(optional)</span>
          <input value={title} onChange={(e) => setTitle(e.target.value)} maxLength={120} placeholder="Sum it up in a line" className="mt-1.5 w-full rounded-xl border border-black/10 bg-white px-4 py-3 font-normal outline-none transition focus:border-[#9a5d19] focus:ring-2 focus:ring-[#9a5d19]/10" />
        </label>
        <label className="text-sm font-semibold">Your review
          <textarea value={body} onChange={(e) => setBody(e.target.value)} rows={4} minLength={10} maxLength={2000} required placeholder="Tell others about the quality, colours and finish…" aria-describedby="review-body-hint" className="mt-1.5 w-full resize-y rounded-xl border border-black/10 bg-white px-4 py-3 font-normal outline-none transition focus:border-[#9a5d19] focus:ring-2 focus:ring-[#9a5d19]/10" />
        </label>
        <p id="review-body-hint" className="text-xs text-black/50">Between 10 and 2000 characters. {body.trim().length}/2000</p>
      </div>
      <div aria-live="polite">
        {formError ? <p className="mt-3 rounded-xl bg-red-50 px-4 py-3 text-sm font-medium text-red-700" role="alert">{formError}</p> : null}
        {status === "fail" ? <p className="mt-3 rounded-xl bg-red-50 px-4 py-3 text-sm font-medium text-red-700" role="alert">{message}</p> : null}
      </div>
      <Button type="submit" disabled={status === "busy"} className="mt-4">{status === "busy" ? "Submitting…" : "Submit Review"}</Button>
    </form>
  );
}
