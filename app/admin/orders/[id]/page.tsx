export const dynamic = "force-dynamic";
import { ObjectId } from "mongodb";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AdminShell } from "@/components/admin/AdminShell";
import { OrderStatusControl } from "@/components/admin/OrderStatusControl";
import { requireAdmin } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { formatINR } from "@/lib/utils";
import type { OrderDocument } from "@/models/order";
import type { CartItem } from "@/types";

const STATUS_STYLES: Record<string, string> = {
  pending: "bg-black/5 text-black/60",
  paid: "bg-[#9a5d19]/10 text-[#9a5d19]",
  processing: "bg-[#8a6a3b]/10 text-[#8a6a3b]",
  packed: "bg-[#6a5acd]/10 text-[#5a4fcf]",
  shipped: "bg-[#2f6f4f]/10 text-[#2f6f4f]",
  delivered: "bg-[#1f7a4d]/10 text-[#1f7a4d]",
  cancelled: "bg-red-600/10 text-red-700",
  refunded: "bg-orange-600/10 text-orange-700"
};

function badge(value: string) {
  const style = STATUS_STYLES[value] || "bg-black/5 text-black/60";
  return <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold capitalize ${style}`}>{value}</span>;
}

export default async function OrderDetail({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();
  const { id } = await params;
  if (!ObjectId.isValid(id)) notFound();

  let order: (OrderDocument & { _id: ObjectId }) | null = null;
  try {
    const db = await getDb();
    order = (await db.collection("orders").findOne({ _id: new ObjectId(id) })) as (OrderDocument & { _id: ObjectId }) | null;
  } catch {
    order = null;
  }
  if (!order) notFound();

  const orderId = String(order._id);
  const placedAt = order.createdAt ? new Date(order.createdAt).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" }) : "—";

  return (
    <AdminShell>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <Link href="/admin/orders" className="text-sm font-semibold text-[#9a5d19]">← Back to orders</Link>
          <h1 className="mt-1 text-4xl font-bold">Order #{orderId.slice(-8).toUpperCase()}</h1>
          <p className="mt-1 text-sm text-black/55">Placed {placedAt}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {badge(order.status)}
          {badge(order.paymentStatus)}
        </div>
      </div>

      <section className="mt-7 rounded-2xl bg-white p-6 shadow-sm">
        <h2 className="text-xl font-bold">Fulfilment Status</h2>
        <p className="mt-1 text-sm text-black/55">Track this order as it moves through fulfilment, shipping and delivery.</p>
        <div className="mt-4"><OrderStatusControl orderId={orderId} current={order.status} /></div>
      </section>

      <div className="mt-7 grid gap-6 lg:grid-cols-[1fr_360px]">
        <section className="rounded-2xl bg-white p-6 shadow-sm">
          <h2 className="text-xl font-bold">Items</h2>
          <div className="mt-4 overflow-x-auto">
            <table className="w-full min-w-[560px] text-left text-sm">
              <thead><tr className="border-b"><th className="p-3">Artwork</th><th className="p-3">Size</th><th className="p-3 text-right">Qty</th><th className="p-3 text-right">Unit</th><th className="p-3 text-right">Line Total</th></tr></thead>
              <tbody>
                {order.items.map((item: CartItem, i: number) => (
                  <tr key={i} className="border-b last:border-0">
                    <td className="p-3">
                      <div className="flex items-center gap-3">
                        {item.image ? <img src={item.image} alt="" className="h-12 w-12 shrink-0 rounded-lg object-cover" /> : <div className="h-12 w-12 shrink-0 rounded-lg bg-black/5" />}
                        <div className="min-w-0">
                          <Link href={`/products/${item.slug}`} className="block max-w-[240px] truncate font-semibold">{item.title}</Link>
                        </div>
                      </div>
                    </td>
                    <td className="p-3">{item.size}</td>
                    <td className="p-3 text-right">{item.quantity}</td>
                    <td className="p-3 text-right">{formatINR(item.price)}</td>
                    <td className="p-3 text-right font-semibold">{formatINR(item.price * item.quantity)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

<section className="h-fit rounded-2xl bg-white p-6 shadow-sm">
          <h2 className="text-xl font-bold">Summary</h2>
          <div className="mt-4 space-y-2 text-sm">
            <div className="flex justify-between"><span>Subtotal</span><b>{formatINR(order.subtotal)}</b></div>
            <div className="flex justify-between"><span>Shipping</span><b>{order.shipping ? formatINR(order.shipping) : "Free"}</b></div>
            <div className="mt-2 flex justify-between text-lg"><span>Total</span><b>{formatINR(order.total)}</b></div>
          </div>
          {order.paymentId && (
            <div className="mt-4 rounded-xl bg-black/[0.03] p-3 text-xs text-black/60">
              <b className="block text-black/70">Payment ID</b>
              <span className="font-mono break-all">{order.paymentId}</span>
            </div>
          )}
        </section>
      </div>

      <section className="mt-7 rounded-2xl bg-white p-6 shadow-sm">
        <h2 className="text-xl font-bold">Customer & Delivery</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <div className="rounded-xl bg-black/[0.03] p-4 text-sm">
            <b className="block text-black/70">Contact</b>
            <p className="mt-1 font-semibold">{order.customer.name}</p>
            <p className="text-black/60">{order.customer.email}</p>
            <p className="text-black/60">{order.customer.phone}</p>
          </div>
          <div className="rounded-xl bg-black/[0.03] p-4 text-sm">
            <b className="block text-black/70">Shipping Address</b>
            <p className="mt-1">{order.customer.address}</p>
            <p>{order.customer.city}, {order.customer.state} {order.customer.postalCode}</p>
          </div>
        </div>
      </section>
    </AdminShell>
  );
}
