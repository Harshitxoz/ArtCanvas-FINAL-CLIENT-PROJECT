"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Trash2, Plus, Save, RefreshCw, Loader2 } from "lucide-react";
import { slugify } from "@/lib/utils";
import type { StoreSettings } from "@/lib/settings";

interface Category {
  _id: string;
  name: string;
  slug: string;
  description?: string;
  image?: string;
  active: boolean;
  productCount?: number;
}

interface Coupon {
  _id: string;
  code: string;
  type: "percentage" | "fixed";
  value: number;
  active: boolean;
  expiresAt?: string;
  usageLimit?: number;
  usedCount: number;
}

interface Review {
  _id: string;
  productId: string;
  customerName: string;
  rating: number;
  title?: string;
  body: string;
  approved: boolean;
}

interface CustomOrder {
  _id: string;
  name: string;
  email: string;
  phone: string;
  description: string;
  size?: string;
  style?: string;
  artworkType?: string;
  deadline?: string;
  notes?: string;
  budget?: number;
  referenceImage?: string;
  status: string;
  adminNotes?: string;
}

async function api<T = unknown>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers || {}),
    },
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || "Request failed");
  }
  return data as T;
}

const inputClass =
  "w-full rounded-xl border border-black/10 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-[#9a5d19]";

function Header({ title, desc }: { title: string; desc: string }) {
  return (
    <header>
      <h1 className="font-serif text-3xl font-bold sm:text-4xl">{title}</h1>
      <p className="mt-1 text-sm text-black/55">{desc}</p>
    </header>
  );
}

// ----------------------------------------------------------------------
// 1. Categories Manager
// ----------------------------------------------------------------------
export function CategoriesManager() {
  const [rows, setRows] = useState<Category[]>([]);
  const [form, setForm] = useState({
    name: "",
    slug: "",
    description: "",
    image: "",
    active: true,
  });
  const [busy, setBusy] = useState(false);

  async function load() {
    const data = await api<Category[]>("/api/categories");
    setRows(data);
  }

  useEffect(() => {
    load().catch((err) => toast.error(err instanceof Error ? err.message : "Failed to load categories"));
  }, []);

  async function add(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      const slug = (form.slug.trim() || slugify(form.name)).toLowerCase();
      if (!form.name.trim()) {
        throw new Error("Category name is required.");
      }
      if (!slug) {
        throw new Error("Category slug is required.");
      }
      await api("/api/categories", {
        method: "POST",
        body: JSON.stringify({ ...form, name: form.name.trim(), slug }),
      });
      setForm({ name: "", slug: "", description: "", image: "", active: true });
      toast.success("Category created successfully");
      await load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to create category");
    } finally {
      setBusy(false);
    }
  }

  async function toggle(category: Category) {
    try {
      await api(`/api/categories/${category._id}`, {
        method: "PATCH",
        body: JSON.stringify({ active: !category.active }),
      });
      await load();
      toast.success(`Category ${!category.active ? "activated" : "hidden"}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to toggle category status");
    }
  }

  async function del(category: Category) {
    if (!confirm(`Are you sure you want to delete "${category.name}"?`)) return;
    try {
      await api(`/api/categories/${category._id}`, { method: "DELETE" });
      toast.success("Category deleted");
      await load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to delete category");
    }
  }

  return (
    <div className="grid gap-6">
      <Header
        title="Categories"
        desc="Organize your artwork collection into customer-friendly themes and styles."
      />

      <form onSubmit={add} className="rounded-3xl bg-white p-6 shadow-sm">
        <h2 className="font-serif text-2xl font-bold">Add Category</h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <input
            required
            className={inputClass}
            placeholder="Category Name"
            value={form.name}
            onChange={(e) => {
              const val = e.target.value;
              setForm((prev) => ({
                ...prev,
                name: val,
                slug: prev.slug === slugify(prev.name) || !prev.slug ? slugify(val) : prev.slug,
              }));
            }}
          />
          <input
            className={inputClass}
            placeholder="Slug (optional, auto-generated)"
            value={form.slug}
            onChange={(e) =>
              setForm((prev) => ({
                ...prev,
                slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]+/g, "-"),
              }))
            }
          />
          <input
            className={`${inputClass} sm:col-span-2`}
            placeholder="Description (optional)"
            value={form.description}
            onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
          />
          <input
            className={`${inputClass} sm:col-span-2`}
            placeholder="Image URL (optional)"
            value={form.image}
            onChange={(e) => setForm((prev) => ({ ...prev, image: e.target.value }))}
          />
        </div>
        <button
          type="submit"
          disabled={busy}
          className="mt-4 inline-flex items-center gap-2 rounded-full bg-[#9a5d19] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#7f4b12] disabled:opacity-50"
        >
          <Plus size={16} /> {busy ? "Creating…" : "Create Category"}
        </button>
      </form>

      <div className="grid gap-3">
        {rows.length === 0 ? (
          <div className="rounded-3xl bg-white p-8 text-center text-sm text-black/50">
            No categories created yet.
          </div>
        ) : (
          rows.map((category) => (
            <div
              key={category._id}
              className="flex flex-wrap items-center justify-between gap-4 rounded-2xl bg-white p-4 shadow-sm"
            >
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-neutral-900">{category.name}</span>
                  <span className="text-xs text-black/40">/{category.slug}</span>
                </div>
                <p className="mt-1 text-sm text-black/55">
                  {category.description || "No description provided."}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => toggle(category)}
                  className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition ${
                    category.active
                      ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                      : "border-black/15 bg-black/5 text-black/60"
                  }`}
                >
                  {category.active ? "Active" : "Hidden"}
                </button>
                <button
                  type="button"
                  onClick={() => del(category)}
                  className="rounded-full border border-red-200 p-2 text-red-600 transition hover:bg-red-50"
                  aria-label={`Delete ${category.name}`}
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

// ----------------------------------------------------------------------
// 2. Coupons Manager
// ----------------------------------------------------------------------
export function CouponsManager() {
  const [rows, setRows] = useState<Coupon[]>([]);
  const [form, setForm] = useState({
    code: "",
    type: "percentage" as "percentage" | "fixed",
    value: 10,
    active: true,
    expiresAt: "",
    usageLimit: "",
  });
  const [busy, setBusy] = useState(false);

  async function load() {
    const data = await api<Coupon[]>("/api/coupons");
    setRows(data);
  }

  useEffect(() => {
    load().catch((err) => toast.error(err instanceof Error ? err.message : "Failed to load coupons"));
  }, []);

  async function add(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      await api("/api/coupons", {
        method: "POST",
        body: JSON.stringify({
          ...form,
          code: form.code.toUpperCase(),
          value: Number(form.value),
          usageLimit: form.usageLimit ? Number(form.usageLimit) : undefined,
        }),
      });
      toast.success("Coupon created successfully");
      setForm({
        code: "",
        type: "percentage",
        value: 10,
        active: true,
        expiresAt: "",
        usageLimit: "",
      });
      await load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to create coupon");
    } finally {
      setBusy(false);
    }
  }

  async function toggle(coupon: Coupon) {
    try {
      await api(`/api/coupons/${coupon._id}`, {
        method: "PATCH",
        body: JSON.stringify({ active: !coupon.active }),
      });
      await load();
      toast.success(`Coupon ${!coupon.active ? "enabled" : "disabled"}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to toggle coupon");
    }
  }

  async function del(coupon: Coupon) {
    if (!confirm(`Are you sure you want to delete coupon ${coupon.code}?`)) return;
    try {
      await api(`/api/coupons/${coupon._id}`, { method: "DELETE" });
      await load();
      toast.success("Coupon deleted");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to delete coupon");
    }
  }

  return (
    <div className="grid gap-6">
      <Header
        title="Coupons"
        desc="Create promotional discounts and control usage limits and expiry dates."
      />

      <form onSubmit={add} className="rounded-3xl bg-white p-6 shadow-sm">
        <h2 className="font-serif text-2xl font-bold">Create Coupon</h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <label className="mb-1 block text-xs font-semibold text-black/70">Coupon Code</label>
            <input
              required
              className={inputClass}
              placeholder="e.g. WELCOME10"
              value={form.code}
              onChange={(e) => setForm((prev) => ({ ...prev, code: e.target.value.toUpperCase() }))}
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold text-black/70">Discount Type</label>
            <select
              className={inputClass}
              value={form.type}
              onChange={(e) => setForm((prev) => ({ ...prev, type: e.target.value as "percentage" | "fixed" }))}
            >
              <option value="percentage">Percentage (%)</option>
              <option value="fixed">Fixed Amount (₹)</option>
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold text-black/70">Value</label>
            <input
              required
              type="number"
              min="1"
              className={inputClass}
              value={form.value}
              onChange={(e) => setForm((prev) => ({ ...prev, value: Number(e.target.value) }))}
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold text-black/70">Expiry Date (Optional)</label>
            <input
              type="date"
              className={inputClass}
              value={form.expiresAt}
              onChange={(e) => setForm((prev) => ({ ...prev, expiresAt: e.target.value }))}
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold text-black/70">Usage Limit (Optional)</label>
            <input
              type="number"
              min="1"
              className={inputClass}
              placeholder="Unlimited if blank"
              value={form.usageLimit}
              onChange={(e) => setForm((prev) => ({ ...prev, usageLimit: e.target.value }))}
            />
          </div>
        </div>
        <button
          type="submit"
          disabled={busy}
          className="mt-4 inline-flex items-center gap-2 rounded-full bg-[#9a5d19] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#7f4b12] disabled:opacity-50"
        >
          <Plus size={16} /> {busy ? "Creating…" : "Create Coupon"}
        </button>
      </form>

      <div className="overflow-x-auto rounded-3xl bg-white shadow-sm">
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead>
            <tr className="border-b text-xs uppercase text-black/45">
              <th className="p-4">Code</th>
              <th className="p-4">Discount</th>
              <th className="p-4">Usage</th>
              <th className="p-4">Status</th>
              <th className="p-4 text-right">Action</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={5} className="p-8 text-center text-sm text-black/50">
                  No coupons created yet.
                </td>
              </tr>
            ) : (
              rows.map((coupon) => (
                <tr key={coupon._id} className="border-b last:border-0">
                  <td className="p-4 font-mono font-bold text-neutral-900">{coupon.code}</td>
                  <td className="p-4 font-semibold">
                    {coupon.type === "percentage" ? `${coupon.value}% off` : `₹${coupon.value} off`}
                  </td>
                  <td className="p-4 text-black/60">
                    {coupon.usedCount || 0}
                    {coupon.usageLimit ? ` / ${coupon.usageLimit}` : " uses"}
                  </td>
                  <td className="p-4">
                    <button
                      type="button"
                      onClick={() => toggle(coupon)}
                      className={`rounded-full border px-3 py-1 text-xs font-semibold transition ${
                        coupon.active
                          ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                          : "border-black/15 bg-black/5 text-black/60"
                      }`}
                    >
                      {coupon.active ? "Active" : "Disabled"}
                    </button>
                  </td>
                  <td className="p-4 text-right">
                    <button
                      type="button"
                      onClick={() => del(coupon)}
                      className="p-1 text-red-600 transition hover:text-red-800"
                      aria-label={`Delete coupon ${coupon.code}`}
                    >
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ----------------------------------------------------------------------
// 3. Reviews Manager
// ----------------------------------------------------------------------
export function ReviewsManager() {
  const [rows, setRows] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    try {
      const data = await api<Review[]>("/api/reviews/admin");
      setRows(data);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load().catch((err) => toast.error(err instanceof Error ? err.message : "Failed to load reviews"));
  }, []);

  async function setApproved(review: Review, approved: boolean) {
    try {
      await api(`/api/reviews/${review._id}`, {
        method: "PATCH",
        body: JSON.stringify({ approved }),
      });
      await load();
      toast.success(approved ? "Review approved and published" : "Review hidden");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to update review status");
    }
  }

  async function del(review: Review) {
    if (!confirm("Are you sure you want to permanently delete this review?")) return;
    try {
      await api(`/api/reviews/${review._id}`, { method: "DELETE" });
      await load();
      toast.success("Review deleted");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to delete review");
    }
  }

  return (
    <div className="grid gap-6">
      <Header
        title="Reviews"
        desc="Moderate customer feedback before it appears on public product pages."
      />

      {loading ? (
        <div className="rounded-3xl bg-white p-12 text-center">
          <Loader2 size={24} className="mx-auto animate-spin text-[#9a5d19]" />
        </div>
      ) : (
        <div className="grid gap-3">
          {rows.length === 0 ? (
            <div className="rounded-3xl bg-white p-10 text-center text-sm text-black/55">
              No customer reviews submitted yet.
            </div>
          ) : (
            rows.map((review) => (
              <article key={review._id} className="rounded-3xl bg-white p-6 shadow-sm">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h3 className="font-semibold text-neutral-900">{review.customerName}</h3>
                    <div className="mt-0.5 text-sm text-amber-500">
                      {"★".repeat(review.rating)}
                      {"☆".repeat(5 - review.rating)}
                    </div>
                    {review.title && <p className="mt-2 font-serif font-bold text-neutral-800">{review.title}</p>}
                  </div>
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-bold ${
                      review.approved
                        ? "bg-emerald-100 text-emerald-800"
                        : "bg-amber-100 text-amber-800"
                    }`}
                  >
                    {review.approved ? "Published" : "Pending Review"}
                  </span>
                </div>
                <p className="mt-3 text-sm leading-6 text-black/70">{review.body}</p>
                <div className="mt-5 flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setApproved(review, true)}
                    className="rounded-full bg-[#9a5d19] px-4 py-2 text-xs font-semibold text-white transition hover:bg-[#7f4b12]"
                  >
                    Approve
                  </button>
                  <button
                    type="button"
                    onClick={() => setApproved(review, false)}
                    className="rounded-full border border-black/15 px-4 py-2 text-xs font-semibold transition hover:bg-black/5"
                  >
                    Hide
                  </button>
                  <button
                    type="button"
                    onClick={() => del(review)}
                    className="ml-auto rounded-full border border-red-200 p-2 text-red-600 transition hover:bg-red-50"
                    aria-label="Delete review"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </article>
            ))
          )}
        </div>
      )}
    </div>
  );
}

// ----------------------------------------------------------------------
// 4. Custom Orders Manager
// ----------------------------------------------------------------------
export function CustomOrdersManager() {
  const [rows, setRows] = useState<CustomOrder[]>([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    try {
      const data = await api<CustomOrder[]>("/api/custom-orders");
      setRows(data);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load().catch((err) => toast.error(err instanceof Error ? err.message : "Failed to load custom orders"));
  }, []);

  async function updateStatus(order: CustomOrder, status: string) {
    try {
      await api(`/api/custom-orders/${order._id}`, {
        method: "PATCH",
        body: JSON.stringify({ status, adminNotes: order.adminNotes || "" }),
      });
      await load();
      toast.success("Request status updated");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to update status");
    }
  }

  return (
    <div className="grid gap-6">
      <Header
        title="Custom Orders"
        desc="Review bespoke artwork inquiries and manage communication with commissioners."
      />

      {loading ? (
        <div className="rounded-3xl bg-white p-12 text-center">
          <Loader2 size={24} className="mx-auto animate-spin text-[#9a5d19]" />
        </div>
      ) : (
        <div className="grid gap-4">
          {rows.length === 0 ? (
            <div className="rounded-3xl bg-white p-10 text-center text-sm text-black/55">
              No custom artwork inquiries received yet.
            </div>
          ) : (
            rows.map((order) => (
              <article key={order._id} className="rounded-3xl bg-white p-6 shadow-sm">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <h2 className="font-serif text-xl font-bold text-neutral-900">{order.name}</h2>
                    <p className="text-sm text-black/60">
                      {order.email} {order.phone ? `· ${order.phone}` : ""}
                    </p>
                  </div>
                  <select
                    className="rounded-xl border border-black/15 bg-white px-3 py-1.5 text-sm font-semibold capitalize outline-none focus:border-[#9a5d19]"
                    value={order.status}
                    onChange={(e) => updateStatus(order, e.target.value)}
                  >
                    <option value="new">New</option>
                    <option value="quoted">Quoted</option>
                    <option value="in-progress">In-Progress</option>
                    <option value="completed">Completed</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>

                <p className="mt-4 text-sm leading-6 text-neutral-800">{order.description}</p>
                {order.notes && (
                  <p className="mt-2 text-sm leading-6 text-black/60">
                    <strong>Notes:</strong> {order.notes}
                  </p>
                )}

                <div className="mt-4 flex flex-wrap gap-2 text-xs text-black/65">
                  <span className="rounded-full bg-[#eee9e1] px-3 py-1 font-medium">
                    Type: {order.artworkType === "printed-canvas" ? "Printed Canvas" : "Hand-Painted"}
                  </span>
                  {order.size && (
                    <span className="rounded-full bg-[#eee9e1] px-3 py-1 font-medium">Size: {order.size}</span>
                  )}
                  {order.style && (
                    <span className="rounded-full bg-[#eee9e1] px-3 py-1 font-medium">Style: {order.style}</span>
                  )}
                  {order.deadline && (
                    <span className="rounded-full bg-[#eee9e1] px-3 py-1 font-medium">Deadline: {order.deadline}</span>
                  )}
                  {order.budget != null && (
                    <span className="rounded-full bg-[#eee9e1] px-3 py-1 font-medium">Budget: ₹{order.budget}</span>
                  )}
                </div>

                {order.referenceImage && (
                  <div className="mt-4">
                    <a
                      className="inline-flex items-center text-sm font-semibold text-[#9a5d19] hover:underline"
                      href={order.referenceImage}
                      target="_blank"
                      rel="noreferrer"
                    >
                      View reference image ↗
                    </a>
                  </div>
                )}
              </article>
            ))
          )}
        </div>
      )}
    </div>
  );
}

// ----------------------------------------------------------------------
// 5. Settings Manager
// ----------------------------------------------------------------------
export function SettingsManager() {
  const [form, setForm] = useState<StoreSettings | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api<StoreSettings>("/api/settings")
      .then(setForm)
      .catch((err) => toast.error(err instanceof Error ? err.message : "Failed to load store settings"));
  }, []);

  if (!form) {
    return (
      <div className="rounded-3xl bg-white p-12 text-center">
        <Loader2 size={24} className="mx-auto animate-spin text-[#9a5d19]" />
        <p className="mt-3 text-sm text-black/50">Loading store settings…</p>
      </div>
    );
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (!form) return;
    setSaving(true);
    try {
      await api("/api/settings", {
        method: "PATCH",
        body: JSON.stringify(form),
      });
      toast.success("Store settings updated successfully");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to update settings");
    } finally {
      setSaving(false);
    }
  }

  const brandFields: [keyof StoreSettings, string][] = [
    ["storeName", "Store Name"],
    ["tagline", "Tagline"],
    ["email", "Support Email"],
    ["phone", "Support Phone"],
    ["whatsapp", "WhatsApp Number"],
    ["instagram", "Instagram Profile URL"],
    ["address", "Studio / Gallery Address"],
  ];

  return (
    <form onSubmit={save} className="grid gap-6">
      <Header
        title="Store Settings"
        desc="Manage your brand identity, support channels, shipping rules, and homepage headline."
      />

      <section className="rounded-3xl bg-white p-6 shadow-sm sm:p-8">
        <h2 className="font-serif text-2xl font-bold">Brand & Support</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          {brandFields.map(([key, label]) => (
            <label key={key} className="text-sm font-semibold">
              {label}
              <input
                className={`${inputClass} mt-1`}
                value={(form[key] as string) || ""}
                onChange={(e) => setForm({ ...form, [key]: e.target.value })}
              />
            </label>
          ))}
        </div>
      </section>

      <section className="rounded-3xl bg-white p-6 shadow-sm sm:p-8">
        <h2 className="font-serif text-2xl font-bold">Shipping & Homepage Copy</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <label className="text-sm font-semibold">
            Free Shipping Threshold (₹)
            <input
              type="number"
              className={`${inputClass} mt-1`}
              value={form.freeShippingThreshold}
              onChange={(e) => setForm({ ...form, freeShippingThreshold: Number(e.target.value) })}
            />
          </label>
          <label className="text-sm font-semibold">
            Standard Shipping Fee (₹)
            <input
              type="number"
              className={`${inputClass} mt-1`}
              value={form.shippingFee}
              onChange={(e) => setForm({ ...form, shippingFee: Number(e.target.value) })}
            />
          </label>
          <label className="text-sm font-semibold sm:col-span-2">
            Top Banner Announcement
            <input
              className={`${inputClass} mt-1`}
              value={form.announcement || ""}
              onChange={(e) => setForm({ ...form, announcement: e.target.value })}
            />
          </label>
          <label className="text-sm font-semibold sm:col-span-2">
            Homepage Hero Headline
            <input
              className={`${inputClass} mt-1`}
              value={form.headline || ""}
              onChange={(e) => setForm({ ...form, headline: e.target.value })}
            />
          </label>
          <label className="text-sm font-semibold sm:col-span-2">
            Homepage Hero Subheadline
            <textarea
              className={`${inputClass} mt-1 min-h-24`}
              value={form.subheadline || ""}
              onChange={(e) => setForm({ ...form, subheadline: e.target.value })}
            />
          </label>
          <label className="text-sm font-semibold sm:col-span-2">
            Hero Image URL
            <input
              className={`${inputClass} mt-1`}
              value={form.heroImageUrl || ""}
              onChange={(e) => setForm({ ...form, heroImageUrl: e.target.value })}
            />
          </label>
        </div>
      </section>

      <button
        type="submit"
        disabled={saving}
        className="inline-flex w-fit items-center gap-2 rounded-full bg-[#9a5d19] px-7 py-3 text-sm font-semibold text-white shadow transition hover:bg-[#7f4b12] disabled:opacity-50"
      >
        <Save size={16} />
        {saving ? "Saving…" : "Save Settings"}
      </button>
    </form>
  );
}
