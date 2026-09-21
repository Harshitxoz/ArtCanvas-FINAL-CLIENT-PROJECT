"use client";

import { useState } from "react";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { customOrderRequestSchema } from "@/lib/validations";
import { CheckCircle2 } from "lucide-react";

const INITIAL_FORM = {
  name: "",
  email: "",
  phone: "",
  artworkType: "hand-painted" as "hand-painted" | "printed-canvas",
  size: "",
  style: "",
  budget: "",
  deadline: "",
  description: "",
  notes: "",
  referenceImage: "",
};

type FormState = typeof INITIAL_FORM;

export default function CustomArtworkPage() {
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState<FormState>(INITIAL_FORM);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [serverError, setServerError] = useState("");
  const [submitted, setSubmitted] = useState(false);

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => {
      if (!prev[key]) return prev;
      const copy = { ...prev };
      delete copy[key];
      return copy;
    });
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (busy) return;
    setServerError("");

    const parsed = customOrderRequestSchema.safeParse({
      ...form,
      budget: form.budget === "" ? undefined : Number(form.budget),
      referenceImage: form.referenceImage === "" ? undefined : form.referenceImage,
    });

    if (!parsed.success) {
      const fieldErrors: Record<string, string> = {};
      for (const issue of parsed.error.issues) {
        const fieldName = String(issue.path[0] ?? "form");
        if (!fieldErrors[fieldName]) {
          fieldErrors[fieldName] = issue.message;
        }
      }
      setErrors(fieldErrors);
      return;
    }

    setBusy(true);
    try {
      const res = await fetch("/api/custom-orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(parsed.data),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Could not submit your request. Please try again.");
      }

      setSubmitted(true);
      setForm(INITIAL_FORM);
      setErrors({});
    } catch (err) {
      setServerError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  function renderError(key: string) {
    return errors[key] ? (
      <span role="alert" className="mt-1 block text-xs font-medium text-red-600">
        {errors[key]}
      </span>
    ) : null;
  }

  return (
    <main className="mx-auto grid max-w-7xl gap-10 px-4 py-14 sm:px-6 lg:grid-cols-[.85fr_1.15fr] lg:px-8">
      {/* Intro info section */}
      <section className="pt-2" aria-labelledby="custom-artwork-heading">
        <p className="text-xs font-bold uppercase tracking-[.25em] text-[#9a5d19]">
          Made for Your Space
        </p>
        <h1
          id="custom-artwork-heading"
          className="mt-3 font-serif text-3xl font-bold leading-tight sm:text-4xl lg:text-5xl"
        >
          Commission a Custom Artwork
        </h1>
        <p className="mt-5 max-w-xl text-base leading-relaxed text-black/65">
          Tell our master artists what you envision. Whether it is an original textured oil on canvas,
          a bespoke family portrait, or custom dimensions for a signature wall, we bring your idea to life.
        </p>

        <ul className="mt-8 grid gap-3.5 text-sm text-neutral-700">
          <li className="flex items-center gap-2.5">
            <span className="h-2 w-2 rounded-full bg-[#9a5d19]" />
            Bespoke colour palette matched to your interior architecture
          </li>
          <li className="flex items-center gap-2.5">
            <span className="h-2 w-2 rounded-full bg-[#9a5d19]" />
            Custom dimensions & solid hardwood framing options
          </li>
          <li className="flex items-center gap-2.5">
            <span className="h-2 w-2 rounded-full bg-[#9a5d19]" />
            Full transparent quote and digital preview before painting begins
          </li>
          <li className="flex items-center gap-2.5">
            <span className="h-2 w-2 rounded-full bg-[#9a5d19]" />
            Direct studio progress photos sent during the creation process
          </li>
        </ul>
      </section>

      {/* Form or Confirmation Card */}
      {submitted ? (
        <section
          aria-live="polite"
          className="h-fit rounded-3xl border border-black/8 bg-white p-8 text-center shadow-sm sm:p-12"
        >
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
            <CheckCircle2 size={36} />
          </div>
          <h2 className="font-serif text-2xl font-bold sm:text-3xl text-neutral-900">
            Your Brief Has Been Received
          </h2>
          <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-black/60">
            Thank you for sharing your vision. Our senior curator will review your dimensions, style, and
            budget, and reach out via email or phone within 24 business hours with an initial estimate.
          </p>
          <div className="mt-8">
            <Button
              onClick={() => setSubmitted(false)}
              className="bg-[#9a5d19] px-6 py-3 text-white hover:bg-[#7f4b12]"
            >
              Submit Another Commission Brief
            </Button>
          </div>
        </section>
      ) : (
        <form
          onSubmit={submit}
          noValidate
          className="rounded-3xl border border-black/8 bg-white p-6 shadow-sm sm:p-8"
        >
          <h2 className="font-serif text-2xl font-bold text-neutral-900">Your Commission Brief</h2>
          <p className="mt-1 text-sm text-black/55">
            Fields marked <span className="font-bold text-[#9a5d19]">*</span> are required.
          </p>

          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <label className="text-sm font-semibold">
              Full Name <span className="text-[#9a5d19]">*</span>
              <Input
                required
                autoComplete="name"
                maxLength={80}
                value={form.name}
                onChange={(e) => update("name", e.target.value)}
                aria-invalid={Boolean(errors.name)}
              />
              {renderError("name")}
            </label>

            <label className="text-sm font-semibold">
              Email Address <span className="text-[#9a5d19]">*</span>
              <Input
                required
                type="email"
                autoComplete="email"
                maxLength={160}
                value={form.email}
                onChange={(e) => update("email", e.target.value)}
                aria-invalid={Boolean(errors.email)}
              />
              {renderError("email")}
            </label>

            <label className="text-sm font-semibold">
              Phone Number <span className="text-[#9a5d19]">*</span>
              <Input
                required
                type="tel"
                autoComplete="tel"
                maxLength={20}
                placeholder="+91 98765 43210"
                value={form.phone}
                onChange={(e) => update("phone", e.target.value)}
                aria-invalid={Boolean(errors.phone)}
              />
              {renderError("phone")}
            </label>

            <div>
              <span className="block text-sm font-semibold">
                Artwork Type <span className="text-[#9a5d19]">*</span>
              </span>
              <div className="mt-1.5 grid grid-cols-2 gap-2" role="radiogroup">
                <button
                  type="button"
                  role="radio"
                  aria-checked={form.artworkType === "hand-painted"}
                  onClick={() => update("artworkType", "hand-painted")}
                  className={`rounded-xl border px-3 py-2.5 text-sm font-semibold transition ${
                    form.artworkType === "hand-painted"
                      ? "border-[#9a5d19] bg-[#9a5d19]/10 text-[#7f4b12]"
                      : "border-black/15 text-black/65 hover:border-black/30"
                  }`}
                >
                  Hand-Painted
                </button>
                <button
                  type="button"
                  role="radio"
                  aria-checked={form.artworkType === "printed-canvas"}
                  onClick={() => update("artworkType", "printed-canvas")}
                  className={`rounded-xl border px-3 py-2.5 text-sm font-semibold transition ${
                    form.artworkType === "printed-canvas"
                      ? "border-[#9a5d19] bg-[#9a5d19]/10 text-[#7f4b12]"
                      : "border-black/15 text-black/65 hover:border-black/30"
                  }`}
                >
                  Printed Canvas
                </button>
              </div>
              {renderError("artworkType")}
            </div>

            <label className="text-sm font-semibold">
              Preferred Canvas Size
              <Input
                maxLength={80}
                placeholder="e.g. 36 × 48 in / 90 × 120 cm"
                value={form.size}
                onChange={(e) => update("size", e.target.value)}
              />
              {renderError("size")}
            </label>

            <label className="text-sm font-semibold">
              Style / Theme
              <Input
                maxLength={80}
                placeholder="Abstract, landscape, portrait, spiritual…"
                value={form.style}
                onChange={(e) => update("style", e.target.value)}
              />
              {renderError("style")}
            </label>

            <label className="text-sm font-semibold">
              Approximate Budget (₹)
              <Input
                type="number"
                min="0"
                max="10000000"
                placeholder="e.g. 25000"
                value={form.budget}
                onChange={(e) => update("budget", e.target.value)}
                aria-invalid={Boolean(errors.budget)}
              />
              {renderError("budget")}
            </label>

            <label className="text-sm font-semibold">
              Desired Completion Date
              <Input
                type="date"
                value={form.deadline}
                onChange={(e) => update("deadline", e.target.value)}
              />
              {renderError("deadline")}
            </label>

            <label className="text-sm font-semibold sm:col-span-2">
              Artwork Requirements & Concept <span className="text-[#9a5d19]">*</span>
              <textarea
                required
                minLength={10}
                maxLength={3000}
                rows={5}
                className="mt-1.5 w-full rounded-xl border border-black/15 bg-white p-3 text-sm font-normal outline-none transition focus:border-[#9a5d19]"
                placeholder="Describe your subject, colours, room lighting, mood, or custom story in at least 10 characters…"
                value={form.description}
                onChange={(e) => update("description", e.target.value)}
                aria-invalid={Boolean(errors.description)}
              />
              <span className="mt-1 block text-right text-xs text-black/40 tabular-nums">
                {form.description.trim().length} / 3000 characters
              </span>
              {renderError("description")}
            </label>

            <label className="text-sm font-semibold sm:col-span-2">
              Additional Notes (Optional)
              <textarea
                maxLength={2000}
                rows={3}
                className="mt-1.5 w-full rounded-xl border border-black/15 bg-white p-3 text-sm font-normal outline-none transition focus:border-[#9a5d19]"
                placeholder="Framing preferences, delivery city, or any specific instructions…"
                value={form.notes}
                onChange={(e) => update("notes", e.target.value)}
              />
              {renderError("notes")}
            </label>

            <label className="text-sm font-semibold sm:col-span-2">
              Inspiration or Reference Image URL (Optional)
              <Input
                type="url"
                maxLength={1000}
                placeholder="https://images.unsplash.com/… or Pinterest/Drive link"
                value={form.referenceImage}
                onChange={(e) => update("referenceImage", e.target.value)}
                aria-invalid={Boolean(errors.referenceImage)}
              />
              {renderError("referenceImage")}
            </label>
          </div>

          {serverError && (
            <div role="alert" className="mt-5 rounded-2xl bg-red-50 p-4 text-sm text-red-700">
              {serverError}
            </div>
          )}

          <Button
            type="submit"
            disabled={busy}
            className="mt-6 w-full bg-[#9a5d19] py-3.5 text-white hover:bg-[#7f4b12] shadow"
          >
            {busy ? "Submitting Commission Brief…" : "Submit Custom Artwork Request"}
          </Button>
        </form>
      )}
    </main>
  );
}
