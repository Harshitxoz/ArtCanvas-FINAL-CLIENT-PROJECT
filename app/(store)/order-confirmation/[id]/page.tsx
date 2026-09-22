import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { ObjectId } from "mongodb";
import { getDb } from "@/lib/db";
import { formatINR } from "@/lib/utils";
import { CheckCircle2, PackageCheck, Truck, ShieldCheck, Mail, Phone, MapPin } from "lucide-react";
import { OrderConfirmationActions } from "@/components/checkout/OrderConfirmationActions";
import { OrderTrackingStepper } from "@/components/checkout/OrderTrackingStepper";

export const metadata = {
  title: "Order Confirmed | ArtCanvas",
  description: "Your order and payment have been confirmed. Thank you for supporting fine art.",
};

export default async function OrderConfirmationPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  if (!ObjectId.isValid(id)) return notFound();

  let order = null;
  try {
    const db = await getDb();
    order = await db.collection("orders").findOne({ _id: new ObjectId(id) });
  } catch (err) {
    console.error("[ORDER_CONFIRMATION_FETCH_ERROR]", err);
  }

  if (!order) return notFound();

  const orderNumber = String(order._id).slice(-8).toUpperCase();
  const postal = order.customer.postalCode || order.customer.pincode || "";

  return (
    <div className="min-h-screen bg-[#faf8f5] py-10 px-4 sm:px-6 lg:px-8 print:bg-white print:p-0">
      <div className="mx-auto max-w-4xl">
        {/* Success Banner */}
        <div className="rounded-3xl border border-black/8 bg-white p-6 sm:p-10 shadow-sm text-center print:border-none print:shadow-none">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
            <CheckCircle2 size={36} />
          </div>
          <span className="inline-block rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold uppercase tracking-wider text-emerald-800">
            Payment Verified & Confirmed
          </span>
          <h1 className="mt-3 font-serif text-3xl font-bold tracking-tight text-neutral-900 sm:text-4xl">
            Thank you for your order!
          </h1>
          <p className="mt-2 text-sm text-neutral-600 sm:text-base">
            We have received your payment. Our studio team is preparing your canvas for custom framing and secure transit.
          </p>

          <div className="mt-6 flex flex-wrap items-center justify-center gap-4 text-xs font-medium text-neutral-600 sm:text-sm">
            <span className="rounded-lg bg-neutral-100 px-3 py-1.5 font-mono">
              Order: <strong className="text-neutral-900">#AC-{orderNumber}</strong>
            </span>
            {order.paymentId && (
              <span className="rounded-lg bg-neutral-100 px-3 py-1.5 font-mono">
                Transaction ID: <strong className="text-neutral-900">{order.paymentId}</strong>
              </span>
            )}
            <span className="rounded-lg bg-neutral-100 px-3 py-1.5">
              Date: <strong className="text-neutral-900">{new Date(order.createdAt).toLocaleDateString("en-IN", { dateStyle: "medium" })}</strong>
            </span>
          </div>

          <OrderConfirmationActions />
        </div>

        {/* Live Shipment Progress Stepper */}
        <div className="mt-8 print:hidden">
          <OrderTrackingStepper
            status={order.status}
            shippingCarrier={order.shippingCarrier}
            trackingNumber={order.trackingNumber}
            trackingUrl={order.trackingUrl}
            estimatedDelivery={order.estimatedDelivery}
          />
        </div>

        {/* Order Details Grid */}
        <div className="mt-8 grid gap-8 md:grid-cols-3">
          {/* Main items summary */}
          <div className="md:col-span-2 space-y-6">
            <div className="rounded-3xl border border-black/8 bg-white p-6 shadow-sm print:border-none print:shadow-none">
              <div className="flex items-center justify-between border-b border-neutral-100 pb-4">
                <h2 className="font-serif text-xl font-bold text-neutral-900 flex items-center gap-2">
                  <PackageCheck size={20} className="text-[#9a5d19]" />
                  Purchased Artworks ({order.items.length})
                </h2>
                <span className="text-xs font-semibold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full">
                  Status: {order.status}
                </span>
              </div>

              <div className="divide-y divide-neutral-100">
                {order.items.map((item: any, idx: number) => (
                  <div key={idx} className="flex gap-4 py-4 items-center">
                    <div className="relative h-20 w-16 shrink-0 overflow-hidden rounded-xl bg-neutral-100 border border-neutral-200">
                      {item.image ? (
                        <Image
                          src={item.image}
                          alt={item.title}
                          fill
                          sizes="64px"
                          className="object-cover"
                        />
                      ) : (
                        <div className="grid h-full w-full place-items-center text-xs text-neutral-400">Art</div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <Link href={`/products/${item.slug}`} className="font-serif font-bold text-neutral-900 hover:underline truncate block">
                        {item.title}
                      </Link>
                      <p className="mt-1 text-xs text-neutral-500">
                        Dimensions: <span className="font-medium text-neutral-700">{item.size}</span>
                        {" • "}
                        {item.frame === "framed" ? (
                          <span className="text-[#9a5d19] font-medium">Museum Wood Frame</span>
                        ) : (
                          <span>Rolled Canvas</span>
                        )}
                      </p>
                      <p className="mt-1 text-xs text-neutral-500">
                        Qty: <span className="font-medium text-neutral-800">{item.quantity}</span>
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-neutral-900">{formatINR(item.price * item.quantity)}</p>
                      {item.quantity > 1 && (
                        <p className="text-[11px] text-neutral-400">{formatINR(item.price)} each</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* Price Calculation Breakdown */}
              <div className="mt-4 border-t border-neutral-100 pt-4 space-y-2 text-sm">
                <div className="flex justify-between text-neutral-600">
                  <span>Subtotal</span>
                  <span>{formatINR(order.subtotal)}</span>
                </div>
                {order.discount ? (
                  <div className="flex justify-between text-emerald-600 font-medium">
                    <span>Discount {order.couponCode ? `(${order.couponCode})` : ""}</span>
                    <span>-{formatINR(order.discount)}</span>
                  </div>
                ) : null}
                <div className="flex justify-between text-neutral-600">
                  <span>Standard Insured Shipping</span>
                  <span>{order.shipping > 0 ? formatINR(order.shipping) : "FREE"}</span>
                </div>
                <div className="flex justify-between border-t border-neutral-200 pt-3 text-base font-bold text-neutral-900">
                  <span>Total Paid (INR)</span>
                  <span className="text-lg text-[#9a5d19]">{formatINR(order.total)}</span>
                </div>
              </div>
            </div>

            {/* Shipping & Delivery Tracker */}
            <div className="rounded-3xl border border-black/8 bg-white p-6 shadow-sm print:border-none print:shadow-none">
              <h3 className="font-serif text-lg font-bold text-neutral-900 flex items-center gap-2 mb-3">
                <Truck size={18} className="text-[#9a5d19]" />
                Dispatch & Delivery Timeline
              </h3>
              <p className="text-sm text-neutral-600">
                Artwork packaging requires 1-2 studio days for protective layering and wooden corner guards.
                Pan-India delivery takes <strong>3 to 7 business days</strong>.
              </p>
              {order.trackingNumber ? (
                <div className="mt-4 rounded-xl bg-neutral-50 p-4 border border-neutral-200">
                  <p className="text-xs font-semibold uppercase text-neutral-500">Shipping Carrier</p>
                  <p className="text-sm font-bold text-neutral-900">{order.shippingCarrier || "Standard Courier"}</p>
                  <p className="mt-2 text-xs font-semibold uppercase text-neutral-500">Tracking Number</p>
                  <p className="text-sm font-mono text-neutral-900">{order.trackingNumber}</p>
                  {order.trackingUrl && (
                    <a
                      href={order.trackingUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="mt-3 inline-block rounded-full bg-[#9a5d19] px-4 py-1.5 text-xs font-semibold text-white hover:bg-[#834e15]"
                    >
                      Track Shipment Online →
                    </a>
                  )}
                </div>
              ) : (
                <div className="mt-4 flex items-center gap-3 rounded-xl bg-amber-50/70 border border-amber-200/60 p-3.5 text-xs text-amber-900">
                  <PackageCheck size={18} className="shrink-0 text-amber-700" />
                  <span>Your order is confirmed and queued for studio inspection & framing. Tracking details will update here once dispatched.</span>
                </div>
              )}
            </div>
          </div>

          {/* Customer & Shipping Details Column */}
          <div className="space-y-6">
            <div className="rounded-3xl border border-black/8 bg-white p-6 shadow-sm print:border-none print:shadow-none">
              <h3 className="font-serif text-lg font-bold text-neutral-900 flex items-center gap-2 mb-4">
                <MapPin size={18} className="text-[#9a5d19]" />
                Delivery Address
              </h3>
              <div className="space-y-2 text-sm text-neutral-700">
                <p className="font-semibold text-neutral-900">{order.customer.name}</p>
                <p className="leading-relaxed">{order.customer.address}</p>
                <p>
                  {order.customer.city}, {order.customer.state} {postal}
                </p>
              </div>

              <div className="mt-6 border-t border-neutral-100 pt-4 space-y-2 text-xs text-neutral-600">
                <div className="flex items-center gap-2">
                  <Phone size={14} className="text-neutral-400" />
                  <span>{order.customer.phone}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Mail size={14} className="text-neutral-400" />
                  <span className="truncate">{order.customer.email}</span>
                </div>
              </div>
            </div>

            <div className="rounded-3xl border border-black/8 bg-white p-6 shadow-sm print:hidden">
              <h3 className="font-serif text-lg font-bold text-neutral-900 flex items-center gap-2 mb-3">
                <ShieldCheck size={18} className="text-emerald-700" />
                Transit Guarantee
              </h3>
              <p className="text-xs leading-relaxed text-neutral-600">
                All ArtCanvas shipments are 100% transit-insured with premium shockproof bubble wrap and corner protection.
                If any transit damage occurs, we guarantee an immediate replacement.
              </p>
              <div className="mt-4 border-t border-neutral-100 pt-3">
                <Link
                  href="/contact"
                  className="text-xs font-semibold text-[#9a5d19] hover:underline"
                >
                  Need assistance? Contact our studio →
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
