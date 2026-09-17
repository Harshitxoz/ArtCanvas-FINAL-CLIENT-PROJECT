export const dynamic = "force-dynamic";
import Link from "next/link";
import { AdminShell } from "@/components/admin/AdminShell";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { requireAdmin } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { formatINR } from "@/lib/utils";

const ORDER_STATUSES = ["pending", "paid", "processing", "packed", "shipped", "delivered", "cancelled", "refunded"] as const;

interface AdminOrderRow {
  _id: string;
  orderNumber: string;
  customerName: string;
  customerEmail: string;
  itemCount: number;
  firstItem: string;
  total: number;
  paymentStatus: string;
  status: string;
  createdAt: Date | null;
}

export default async function OrdersAdmin({ searchParams }: { searchParams: Promise<{ status?: string }> }) {
  await requireAdmin();
  const { status } = await searchParams;
  const filter = ORDER_STATUSES.includes((status || "") as (typeof ORDER_STATUSES)[number]) ? status : undefined;

  let orders: AdminOrderRow[] = [];
  let dbError = false;
  try {
    const db = await getDb();
    try {
      await db.collection("orders").createIndexes([
        { key: { status: 1, createdAt: -1 } },
        { key: { "customer.email": 1 } },
        { key: { "items.productId": 1 } },
        { key: { createdAt: -1 } }
      ]);
    } catch {}
    const docs = await db.collection("orders").find(filter ? { status: filter } : {}).sort({ createdAt: -1 }).limit(200).toArray();
    orders = docs.map(d => ({
      _id: String(d._id),
      orderNumber: typeof d.orderNumber === "string" ? d.orderNumber : String(d._id).slice(-8).toUpperCase(),
      customerName: String(d.customer?.name || d.customer?.email || "Customer"),
      customerEmail: String(d.customer?.email || ""),
      itemCount: Array.isArray(d.items) ? d.items.reduce((n: number, it: { quantity?: unknown }) => n + (Number(it.quantity) || 1), 0) : 0,
      firstItem: Array.isArray(d.items) && d.items[0]?.title ? String(d.items[0].title) : "",
      total: Number(d.total) || 0,
      paymentStatus: String(d.paymentStatus || "pending"),
      status: String(d.status || "pending"),
      createdAt: d.createdAt instanceof Date ? d.createdAt : null
    }));
  } catch {
    dbError = true;
  }

  return (
    <AdminShell>
      <div className="grid gap-5">
        <header>
          <h1 className="font-serif text-4xl font-bold">Orders</h1>
          <p className="mt-1 text-sm text-black/55">Track payments and fulfilment. Click an order to manage its status.</p>
        </header>

        <nav aria-label="Filter orders by status" className="flex flex-wrap gap-2">
          <Link href="/admin/orders" className={`rounded-full px-4 py-2 text-sm font-semibold transition ${!filter ? "bg-[#9a5d19] text-white" : "bg-white text-black/70 hover:bg-black/5"}`}>All</Link>
          {ORDER_STATUSES.map(s => (
            <Link key={s} href={`/admin/orders?status=${s}`} className={`rounded-full px-4 py-2 text-sm font-semibold capitalize transition ${filter === s ? "bg-[#9a5d19] text-white" : "bg-white text-black/70 hover:bg-black/5"}`}>{s}</Link>
          ))}
        </nav>

        {dbError ? (
          <div className="rounded-3xl bg-white p-10 text-center shadow-sm">
            <p className="font-serif text-2xl font-bold">Could not load orders</p>
            <p className="mt-2 text-sm text-black/55">The database is not reachable right now. Please try again shortly.</p>
          </div>
        ) : orders.length === 0 ? (
          <div className="rounded-3xl bg-white p-10 text-center shadow-sm">
            <p className="font-serif text-2xl font-bold">{filter ? `No ${filter} orders` : "No orders yet"}</p>
            <p className="mt-2 text-sm text-black/55">Orders placed on the store will appear here with payment and fulfilment status.</p>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-3xl bg-white shadow-sm">
            <table className="w-full min-w-[900px] text-left text-sm">
              <thead>
                <tr className="border-b text-xs uppercase tracking-wider text-black/45">
                  <th className="p-4">Order</th>
                  <th className="p-4">Customer</th>
                  <th className="p-4">Items</th>
                  <th className="p-4">Amount</th>
                  <th className="p-4">Payment</th>
                  <th className="p-4">Status</th>
                  <th className="p-4">Date</th>
                  <th className="p-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody>
                {orders.map(o => (
                  <tr key={o._id} className="border-b last:border-0 hover:bg-[#eee9e1]/40">
                    <td className="p-4 font-semibold text-[#9a5d19]"><Link href={`/admin/orders/${o._id}`} className="hover:underline">#{o.orderNumber}</Link></td>
                    <td className="p-4">
                      <span className="block font-semibold">{o.customerName}</span>
                      <span className="text-xs text-black/50">{o.customerEmail}</span>
                    </td>
                    <td className="p-4">
                      <span className="block">{o.itemCount} item{o.itemCount === 1 ? "" : "s"}</span>
                      {o.firstItem && <span className="block max-w-44 truncate text-xs text-black/50">{o.firstItem}{o.itemCount > 1 ? "…" : ""}</span>}
                    </td>
                    <td className="p-4 font-semibold">{formatINR(o.total)}</td>
                    <td className="p-4"><StatusBadge value={o.paymentStatus} /></td>
                    <td className="p-4"><StatusBadge value={o.status} /></td>
                    <td className="p-4">{o.createdAt ? new Date(o.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : "—"}</td>
                    <td className="p-4 text-right"><Link href={`/admin/orders/${o._id}`} className="rounded-full border border-black/15 px-4 py-1.5 text-xs font-semibold hover:bg-black/5">View</Link></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </AdminShell>
  );
}
