"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Send, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

export function ContactForm() {
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    subject: "Order Status & Tracking",
    message: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to submit inquiry.");
      }

      setSubmitted(true);
      toast.success("Thank you! Your message has been received.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="rounded-3xl border border-black/8 bg-white p-8 text-center shadow-sm">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
          <CheckCircle2 size={32} />
        </div>
        <h3 className="font-serif text-2xl font-bold text-neutral-900">Message Received</h3>
        <p className="mt-2 text-sm text-neutral-600 leading-relaxed max-w-md mx-auto">
          Thank you for getting in touch, <strong>{form.name}</strong>. An ArtCanvas studio consultant will review your inquiry and respond within 24 business hours.
        </p>
        <button
          onClick={() => {
            setSubmitted(false);
            setForm({ name: "", email: "", phone: "", subject: "Order Status & Tracking", message: "" });
          }}
          className="mt-6 inline-block rounded-full bg-neutral-100 px-6 py-2.5 text-xs font-semibold text-neutral-700 hover:bg-neutral-200 transition"
        >
          Send Another Message
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-3xl border border-black/8 bg-white p-6 sm:p-8 shadow-sm">
      <h2 className="font-serif text-2xl font-bold text-neutral-900">Send Us an Inquiry</h2>
      <p className="mt-1 text-sm text-neutral-500">
        Fill in your details below and our art curation team will get right back to you.
      </p>

      <div className="mt-6 space-y-4">
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-700 mb-1.5">
            Full Name *
          </label>
          <Input
            required
            placeholder="e.g. Rahul Sharma"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-700 mb-1.5">
              Email Address *
            </label>
            <Input
              type="email"
              required
              placeholder="you@example.com"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-700 mb-1.5">
              Phone Number
            </label>
            <Input
              type="tel"
              placeholder="+91 98765 43210"
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-700 mb-1.5">
            Topic / Inquiry Type
          </label>
          <select
            value={form.subject}
            onChange={(e) => setForm({ ...form, subject: e.target.value })}
            className="w-full rounded-xl border border-neutral-200 bg-white px-3 py-2.5 text-sm text-neutral-800 outline-none transition focus:border-[#9a5d19] focus:ring-1 focus:ring-[#9a5d19]"
          >
            <option value="Order Status & Tracking">Order Status & Tracking</option>
            <option value="Custom Artwork Commission">Custom Artwork Commission</option>
            <option value="Framing & Material Inquiries">Framing & Material Inquiries</option>
            <option value="Bulk & Corporate Orders">Bulk & Corporate Orders</option>
            <option value="Returns & Damage Claim">Returns & Damage Claim</option>
            <option value="General Question">General Question</option>
          </select>
        </div>

        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-700 mb-1.5">
            Your Message *
          </label>
          <textarea
            required
            rows={4}
            placeholder="Tell us how we can help..."
            value={form.message}
            onChange={(e) => setForm({ ...form, message: e.target.value })}
            className="w-full rounded-xl border border-neutral-200 bg-white p-3 text-sm text-neutral-800 outline-none transition focus:border-[#9a5d19] focus:ring-1 focus:ring-[#9a5d19]"
          />
        </div>

        <div className="pt-2">
          <Button
            type="submit"
            disabled={loading}
            className="w-full bg-[#9a5d19] py-3 text-white hover:bg-[#834e15] flex items-center justify-center gap-2"
          >
            {loading ? "Sending..." : "Submit Message"}
            <Send size={16} />
          </Button>
        </div>
      </div>
    </form>
  );
}
