import Link from "next/link";
import Image from "next/image";
import { ObjectId } from "mongodb";
import type { Route } from "next";
import { getSession } from "@/lib/auth";
import { getDb } from "@/lib/db";
import type { OrderDocument } from "@/models/order";
import { formatINR } from "@/lib/utils";
import { Package, Truck, ExternalLink, ArrowRight, Clock } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { OrderTrackingStepper } from "@/components/checkout/OrderTrackingStepper";

export const metadata = {
  title: "My Orders | ArtCanvas",
  description: "View your order history and tracking updates.",
};

function statusBadge(status: string) {
  const s = status.toLowerCase();
  if (s === "paid" || s === "confirmed") {
    return <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-800">Confirmed</span>;
  }
  if (s === "shipped") {
    return <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold text-blue-800">Shipped</span>;
  }
  if (s === "delivered") {
    return <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-800">Delivered</span>;
  }
  if (s === "cancelled" || s === "refunded") {
    return <span className="rounded-full bg-rose-100 px-3 py-1 text-xs font-semibold text-rose-800 capitalize">{status}</span>;
  }
  return <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-800 capitalize">{status}</span>;
}

export default async function OrdersPage() {
  const user = await getSession();
  if (!user) {
    return (
      <section className="mx-auto max-w-3xl px-4 py-20 text-center sm:px-6 lg:px-8">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-[#f6f1ea] text-[#9a5d19]">
          <Clock size={32} />
        </div>
        <h1 className="font-serif text-3xl font-bold sm:text-4xl">Sign in Required</h1>
        <p className="mt-3 text-neutral-600">Please sign in to your account to view your past purchases and shipment tracking.</p>
        <div className="mt-7">
          <Link href="/login?redirect=/account/orders">
            <Button className="bg-[#9a5d19] px-7 py-3 text-white hover:bg-[#834e15]">
              Sign In to ArtCanvas
            </Button>
          </Link>
        </div>
      </section>
    );
  }

  let orders: (OrderDocument & { _id: ObjectId })[] = [];
  try {
    const db = await getDb();
    const userEmail = (user.email || "").toLowerCase().trim();
    const query = userEmail
      ? { $or: [{ userId: new ObjectId(user.id) }, { "customer.email": userEmail }] }
      : { userId: new ObjectId(user.id) };

    orders = (await db
      .collection("orders")
      .find(query)
      .sort({ createdAt: -1 })
      .toArray()) as (OrderDocument & { _id: ObjectId })[];

    // Auto-link any previous guest orders matching this customer's email
    if (userEmail && orders.length) {
      db.collection("orders").updateMany(
        { "customer.email": userEmail, userId: { $exists: false } },
        { $set: { userId: new ObjectId(user.id) } }
      ).catch(() => {});
    }
  } catch (err) {
    console.error("[ACCOUNT_ORDERS_ERROR]", err);
  }

  return (
    <section className="mx-auto max-w-5xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="border-b border-neutral-200 pb-6">
        <p className="text-xs font-bold uppercase tracking-[.25em] text-[#9a5d19]">Account</p>
        <h1 className="mt-2 font-serif text-3xl font-bold sm:text-4xl">My Orders</h1>
        <p className="mt-1 text-sm text-neutral-500">
          Track active shipments, review past custom canvas acquisitions, and download tax invoices.
        </p>
      </div>

      <div className="mt-8 space-y-6">
        {orders.length ? (
          orders.map((o) => {
            const orderNumber = String(o._id).slice(-8).toUpperCase();
            return (
              <div
                key={String(o._id)}
                className="overflow-hidden rounded-3xl border border-black/8 bg-white shadow-sm transition hover:shadow-md"
              >
                {/* Header info */}
                <div className="flex flex-wrap items-center justify-between gap-4 border-b border-neutral-100 bg-[#fdfbf9] p-5 sm:px-6">
                  <div>
                    <span className="font-mono text-sm font-bold text-neutral-900">#AC-{orderNumber}</span>
                    <p className="mt-0.5 text-xs text-neutral-500">
                      Placed on {new Date(o.createdAt).toLocaleDateString("en-IN", { dateStyle: "medium" })}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    {statusBadge(o.status)}
                    <Link
                      href={`/order-confirmation/${String(o._id)}` as Route}
                      className="inline-flex items-center gap-1 rounded-full border border-neutral-200 bg-white px-3 py-1.5 text-xs font-semibold text-neutral-700 hover:bg-neutral-50 hover:text-[#9a5d19]"
                    >
                      <span>Invoice</span>
                      <ExternalLink size={12} />
                    </Link>
                  </div>
                </div>

                {/* Items preview */}
                <div className="divide-y divide-neutral-100 p-5 sm:px-6">
                  {(o.items || []).map((item: any, idx: number) => (
                    <div key={idx} className="flex items-center gap-4 py-3 first:pt-0 last:pb-0">
                      <div className="relative h-16 w-14 shrink-0 overflow-hidden rounded-xl bg-neutral-100 border border-neutral-200">
                        {item.image ? (
                          <Image src={item.image} alt={item.title} fill sizes="56px" className="object-cover" />
                        ) : (
                          <div className="grid h-full w-full place-items-center text-[10px] text-neutral-400">Art</div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <Link href={`/products/${item.slug}`} className="font-medium text-neutral-900 hover:underline truncate block text-sm">
                          {item.title}
                        </Link>
                        <p className="text-xs text-neutral-500 mt-0.5">
                          {item.size} • {item.frame === "framed" ? "Framed" : "Unframed"} • Qty: {item.quantity}
                        </p>
                      </div>
                      <p className="text-sm font-semibold text-neutral-900">
                        {formatINR(item.price * item.quantity)}
                      </p>
                    </div>
                  ))}
                </div>

                {/* Shipment Stepper */}
                <div className="px-5 pb-5 sm:px-6">
                  <OrderTrackingStepper
                    status={o.status}
                    shippingCarrier={o.shippingCarrier}
                    trackingNumber={o.trackingNumber}
                    trackingUrl={o.trackingUrl}
                    estimatedDelivery={o.estimatedDelivery}
                  />
                </div>

                {/* Tracking & Footer */}
                <div className="border-t border-neutral-100 bg-[#faf8f5] p-5 sm:flex sm:items-center sm:justify-between sm:px-6">
                  {o.trackingNumber ? (
                    <div className="flex items-center gap-2 text-xs text-neutral-700">
                      <Truck size={16} className="text-[#9a5d19]" />
                      <span>
                        Shipped via <strong>{o.shippingCarrier || "Courier"}</strong> (Tracking: <code className="font-mono">{o.trackingNumber}</code>)
                      </span>
                      {o.trackingUrl && (
                        <a href={o.trackingUrl} target="_blank" rel="noreferrer" className="font-semibold text-[#9a5d19] hover:underline ml-1">
                          Track →
                        </a>
                      )}
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 text-xs text-neutral-500">
                      <Package size={16} className="text-neutral-400" />
                      <span>Studio preparing & inspecting your canvas artwork</span>
                    </div>
                  )}
                  <div className="mt-3 sm:mt-0 text-right">
                    <span className="text-xs text-neutral-500 mr-2">Total:</span>
                    <strong className="text-base text-neutral-900 font-bold">{formatINR(o.total)}</strong>
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          <div className="rounded-3xl border border-dashed border-neutral-300 p-12 text-center">
            <Package size={36} className="mx-auto text-neutral-400" />
            <h3 className="mt-4 font-serif text-lg font-bold text-neutral-800">No orders placed yet</h3>
            <p className="mt-1 text-sm text-neutral-500">Your artwork purchases and custom commissions will appear here.</p>
            <div className="mt-6">
              <Link href="/shop">
                <Button className="bg-[#9a5d19] px-6 py-2.5 text-white hover:bg-[#834e15] inline-flex items-center gap-2">
                  Browse Artworks <ArrowRight size={14} />
                </Button>
              </Link>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
