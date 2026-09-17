"use client";
import { useCallback, useEffect, useMemo, useState } from "react";
import type { Review } from "@/types";
import { Stars } from "./Stars";
import { ReviewForm } from "./ReviewForm";
function asReview(value: unknown): Review | null {
  if (!value || typeof value !== "object") return null;
  const r = value as Record<string, unknown>;
  const rating = typeof r.rating === "number" ? r.rating : Number(r.rating);
  if (!r._id || !r.productId || !r.body || !Number.isInteger(rating)) return null;
  return {
    _id: String(r._id),
    productId: String(r.productId),
    customerName: typeof r.customerName === "string" && r.customerName ? r.customerName : "Customer",
    rating,
    title: typeof r.title === "string" ? r.title : "",
    body: String(r.body),
    approved: r.approved !== false,
    verifiedPurchase: r.verifiedPurchase === true,
    createdAt: typeof r.createdAt === "string" ? r.createdAt : "",
  };
}
function fmtDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}
export function ReviewsSection({ productId, productTitle }: { productId: string; productTitle: string }) {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [state, setState] = useState<"loading" | "ready" | "error">("loading");
  const [nonce, setNonce] = useState(0);
  const load = useCallback(async () => {
    setState("loading");
    try {
      const res = await fetch(`/api/reviews?productId=${encodeURIComponent(productId)}`, { cache: "no-store" });
      if (!res.ok) throw new Error("unavailable");
      const data: unknown = await res.json();
      const list = Array.isArray(data) ? data.map(asReview).filter((r): r is Review => r !== null) : [];
      setReviews(list);
      setState("ready");
    } catch { setState("error"); }
  }, [productId]);
  useEffect(() => { void load(); }, [load, nonce]);
  const summary = useMemo(() => {
    const dist: number[] = [0, 0, 0, 0, 0, 0];
    let sum = 0;
    for (const r of reviews) {
      sum += r.rating;
      if (r.rating >= 1 && r.rating <= 5) dist[r.rating] += 1;
    }
    return { count: reviews.length, average: reviews.length ? sum / reviews.length : 0, dist };
  }, [reviews]);
  return (
    <section aria-labelledby="customer-reviews" className="mt-16 border-t border-black/10 pt-10">
      <h2 id="customer-reviews" className="font-serif text-3xl font-bold">Customer Reviews</h2>
      {state === "loading" ? (
        <div className="mt-6 rounded-3xl bg-white p-10 text-center text-sm text-black/55 shadow-sm" role="status">Loading reviews…</div>
      ) : state === "error" ? (
        <div className="mt-6 rounded-3xl bg-white p-10 text-center shadow-sm">
          <p className="text-sm text-black/60">We could not load reviews right now.</p>
          <button type="button" onClick={() => setNonce((n) => n + 1)} className="mt-4 rounded-full border border-black/15 px-5 py-2.5 text-sm font-semibold transition hover:border-[#9a5d19] hover:text-[#9a5d19]">Try again</button>
        </div>
      ) : summary.count === 0 ? (
        <div className="mt-6 rounded-3xl bg-white p-10 text-center shadow-sm">
          <Stars value={0} />
          <p className="mt-3 font-serif text-xl font-bold">No reviews yet</p>
          <p className="mx-auto mt-1 max-w-md text-sm leading-6 text-black/55">Be the first to share your experience with {productTitle}.</p>
        </div>
      ) : (
        <div className="mt-6 grid gap-6 lg:grid-cols-[320px_1fr]">
          <div className="h-fit rounded-3xl bg-white p-6 shadow-sm sm:p-7">
            <p className="flex items-baseline gap-2">
              <span className="font-serif text-5xl font-bold">{summary.average.toFixed(1)}</span>
              <span className="text-sm text-black/50">/ 5</span>
            </p>
            <Stars value={summary.average} className="mt-2 text-lg" />
            <p className="mt-2 text-sm text-black/55">{summary.count} Review{summary.count === 1 ? "" : "s"}</p>
            <div className="mt-5 grid gap-2">
              {[5, 4, 3, 2, 1].map((star) => {
                const c = summary.dist[star] ?? 0;
                const pct = summary.count ? Math.round((c / summary.count) * 100) : 0;
                return (
                  <div key={star} className="flex items-center gap-3 text-sm">
                    <span className="w-7 shrink-0 font-semibold">{star} ★</span>
                    <div className="h-2 flex-1 overflow-hidden rounded-full bg-black/10">
                      <div className="h-full rounded-full bg-[#9a5d19]" style={{ width: `${pct}%` }} />
                    </div>
                    <span className="w-8 shrink-0 text-right tabular-nums text-black/55">{c}</span>
                  </div>
                );
              })}
            </div>
            <p className="mt-4 text-xs leading-5 text-black/45">Based on approved customer reviews only.</p>
          </div>
          <div className="grid content-start gap-4">
            {reviews.map((r) => (
              <article key={r._id} className="rounded-3xl bg-white p-6 shadow-sm">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="font-semibold">{r.customerName}</p>
                  {r.verifiedPurchase ? <span className="rounded-full bg-green-50 px-3 py-1 text-xs font-bold text-green-700">✓ Verified Purchase</span> : null}
                </div>
                <Stars value={r.rating} className="mt-1.5" />
                {r.title ? <p className="mt-2 font-semibold">{r.title}</p> : null}
                <p className="mt-2 text-sm leading-7 text-black/70">{r.body}</p>
                {r.createdAt ? <p className="mt-3 text-xs text-black/45"><time dateTime={r.createdAt}>{fmtDate(r.createdAt)}</time></p> : null}
              </article>
            ))}
          </div>
        </div>
      )}
      <div className="mt-8">
        <ReviewForm productId={productId} onSubmitted={() => setNonce((n) => n + 1)} />
      </div>
    </section>
  );
}
