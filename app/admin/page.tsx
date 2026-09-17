export const dynamic = "force-dynamic";
import Link from "next/link";
import { AdminShell } from "@/components/admin/AdminShell";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { requireAdmin } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { formatINR } from "@/lib/utils";

interface DashboardData {
  revenue: number;
  todaySales: number;
  totalOrders: number;
  pendingOrders: number;
  customers: number;
  products: number;
  lowStock: { _id: string; title: string; stock: number }[];
  topSelling: { title: string; image: string; qty: number; revenue: number }[];
  recentOrders: { _id: string; total: number; status: string; customerName: string; createdAt: Date | null }[];
}

async function loadDashboard(): Promise<DashboardData> {
  const empty: DashboardData = { revenue: 0, todaySales: 0, totalOrders: 0, pendingOrders: 0, customers: 0, products: 0, lowStock: [], topSelling: [], recentOrders: [] };
  try {
    const db = await getDb();
    const orders = db.collection("orders");
    const products = db.collection("products");
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    const [revenueAgg, todayAgg, totalOrders, pendingOrders, customers, productCount, lowStock, topSelling, recent] = await Promise.all([
      orders.aggregate([{ $match: { paymentStatus: "paid" } }, { $group: { _id: null, total: { $sum: "$total" } } }]).toArray() as Promise<{ total?: unknown }[]>,
      orders.aggregate([{ $match: { paymentStatus: "paid", createdAt: { $gte: startOfToday } } }, { $group: { _id: null, total: { $sum: "$total" } } }]).toArray() as Promise<{ total?: unknown }[]>,
      orders.countDocuments({}),
      orders.countDocuments({ status: { $in: ["pending", "paid", "processing", "packed"] } }),
      db.collection("users").countDocuments({ role: "customer" }),
      products.countDocuments({ status: { $ne: "archived" } }),
      products.aggregate([
        { $match: { $or: [{ status: "published" }, { status: { $exists: false } }] } },
        { $project: { title: 1, stock: { $sum: "$sizes.stock" } } },
        { $match: { stock: { $lte: 3 } } },
        { $sort: { stock: 1 } },
        { $limit: 6 }
      ]).toArray() as Promise<{ _id: unknown; title?: unknown; stock?: unknown }[]>,
      orders.aggregate([
        { $match: { paymentStatus: "paid" } },
        { $unwind: "$items" },
        { $group: { _id: "$items.productId", title: { $first: "$items.title" }, image: { $first: "$items.image" }, qty: { $sum: "$items.quantity" }, revenue: { $sum: { $multiply: ["$items.price", "$items.quantity"] } } } },
        { $sort: { qty: -1 } },
        { $limit: 5 }
      ]).toArray() as Promise<{ title?: unknown; image?: unknown; qty?: unknown; revenue?: unknown }[]>,
      orders.find({}).sort({ createdAt: -1 }).limit(5).toArray() as Promise<{ _id: unknown; total?: unknown; status?: unknown; createdAt?: unknown; customer?: { name?: unknown; email?: unknown } }[]>
    ]);

    return {
      revenue: Number(revenueAgg[0]?.total ?? 0),
      todaySales: Number(todayAgg[0]?.total ?? 0),
      totalOrders,
      pendingOrders,
      customers,
      products: productCount,
      lowStock: lowStock.map(d => ({ _id: String(d._id), title: String(d.title ?? "Artwork"), stock: Number(d.stock ?? 0) })),
      topSelling: topSelling.map(d => ({ title: String(d.title ?? "Artwork"), image: String(d.image ?? ""), qty: Number(d.qty ?? 0), revenue: Number(d.revenue ?? 0) })),
      recentOrders: recent.map(d => ({
        _id: String(d._id),
        total: Number(d.total ?? 0),
        status: String(d.status ?? "pending"),
        customerName: String(d.customer?.name || d.customer?.email || "Customer"),
        createdAt: d.createdAt instanceof Date ? d.createdAt : null
      }))
    };
  } catch {
    return empty;
  }
}
import { IndianRupee, ShoppingCart, Users, Package, AlertTriangle, TrendingUp, Clock } from "lucide-react";

function StatCard({ icon, label, value, accent, hint }: { icon: React.ReactNode; label: string; value: string; accent?: boolean; hint?: string }) {
  return (
    <div className={`rounded-3xl p-5 shadow-sm ${accent ? "bg-[#17130f] text-white" : "bg-white"}`}>
      <div className="flex items-center justify-between">
        <span className={`text-xs font-bold uppercase tracking-[0.14em] ${accent ? "text-white/60" : "text-black/45"}`}>{label}</span>
        <span className={accent ? "text-[#e2b478]" : "text-[#9a5d19]"}>{icon}</span>
      </div>
      <p className={`mt-2 font-serif text-3xl font-bold ${accent ? "text-white" : ""}`}>{value}</p>
      {hint && <p className={`mt-1 text-xs ${accent ? "text-white/50" : "text-black/45"}`}>{hint}</p>}
    </div>
  );
}

export default async function AdminDashboard() {
  await requireAdmin();
  const d = await loadDashboard();
  return (
    <AdminShell>
    <div className="grid gap-6">
      <header>
        <h1 className="font-serif text-4xl font-bold">Dashboard</h1>
        <p className="mt-1 text-sm text-black/55">Store overview for {new Date().toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}</p>
      </header>

      <section aria-label="Key metrics" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard accent icon={<IndianRupee size={18} />} label="Total sales" value={formatINR(d.revenue)} hint="All paid orders" />
        <StatCard icon={<TrendingUp size={18} />} label="Today's sales" value={formatINR(d.todaySales)} hint="Paid since midnight" />
        <StatCard icon={<ShoppingCart size={18} />} label="Total orders" value={String(d.totalOrders)} />
        <StatCard icon={<Clock size={18} />} label="Pending orders" value={String(d.pendingOrders)} hint="Awaiting fulfilment" />
        <StatCard icon={<Users size={18} />} label="Customers" value={String(d.customers)} />
        <StatCard icon={<Package size={18} />} label="Products" value={String(d.products)} hint="Active + drafts" />
        <StatCard icon={<AlertTriangle size={18} />} label="Low stock" value={String(d.lowStock.length)} hint="3 or fewer pieces left" />
      </section>

      <section className="grid gap-4 lg:grid-cols-2" aria-label="Top selling and low stock">
        <div className="rounded-3xl bg-white p-6 shadow-sm">
          <h2 className="font-serif text-2xl font-bold">Top-selling artworks</h2>
          {d.topSelling.length === 0
            ? <p className="mt-4 rounded-2xl bg-[#eee9e1] p-5 text-sm text-black/55">No paid orders yet — once artworks sell, your bestsellers will appear here.</p>
            : <ol className="mt-4 grid gap-3">
                {d.topSelling.map((t, i) => (
                  <li key={i} className="flex items-center gap-3 rounded-2xl bg-[#eee9e1]/70 p-3">
                    <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-[#9a5d19] font-serif text-sm font-bold text-white">{i + 1}</span>
                    {t.image
                      ? <img src={t.image} alt="" className="h-12 w-12 rounded-xl object-cover" loading="lazy" />
                      : <span className="h-12 w-12 rounded-xl bg-[#d9d0c3]" />}
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-semibold">{t.title}</span>
                      <span className="text-xs text-black/50">{t.qty} sold · {formatINR(t.revenue)}</span>
                    </span>
                  </li>
                ))}
              </ol>}
        </div>
        <div className="rounded-3xl bg-white p-6 shadow-sm">
          <h2 className="font-serif text-2xl font-bold">Low-stock artworks</h2>
          {d.lowStock.length === 0
            ? <p className="mt-4 rounded-2xl bg-[#eee9e1] p-5 text-sm text-black/55">All published artworks have healthy stock levels.</p>
            : <ul className="mt-4 grid gap-3">
                {d.lowStock.map(p => (
                  <li key={p._id} className="flex items-center justify-between gap-3 rounded-2xl bg-[#eee9e1]/70 p-3">
                    <span className="min-w-0 truncate text-sm font-semibold">{p.title}</span>
                    <span className={`shrink-0 rounded-full px-3 py-1 text-xs font-bold ${p.stock === 0 ? "bg-red-600/10 text-red-700" : "bg-orange-600/10 text-orange-700"}`}>
                      {p.stock === 0 ? "Sold out" : p.stock + " left"}
                    </span>
                  </li>
                ))}
                <li><Link href="/admin/products/sold-out" className="inline-block text-sm font-semibold text-[#9a5d19] hover:underline">Manage sold-out artwork →</Link></li>
              </ul>}
        </div>
      </section>

      <section className="rounded-3xl bg-white p-6 shadow-sm" aria-label="Recent orders">
        <div className="flex items-center justify-between gap-3">
          <h2 className="font-serif text-2xl font-bold">Recent orders</h2>
          <Link href="/admin/orders" className="text-sm font-semibold text-[#9a5d19] hover:underline">View all →</Link>
        </div>
        {d.recentOrders.length === 0
          ? <p className="mt-4 rounded-2xl bg-[#eee9e1] p-5 text-sm text-black/55">No orders yet.</p>
          : <div className="mt-4 overflow-x-auto">
              <table className="w-full min-w-[560px] text-left text-sm">
                <thead><tr className="border-b text-xs uppercase tracking-wider text-black/45">
                  <th className="pb-3 pr-4">Order</th><th className="pb-3 pr-4">Customer</th><th className="pb-3 pr-4">Total</th><th className="pb-3 pr-4">Status</th><th className="pb-3">Date</th>
                </tr></thead>
                <tbody>
                  {d.recentOrders.map(o => (
                    <tr key={o._id} className="border-b last:border-0">
                      <td className="py-3 pr-4"><Link href={`/admin/orders/${o._id}`} className="font-semibold text-[#9a5d19] hover:underline">#{o._id.slice(-8).toUpperCase()}</Link></td>
                      <td className="py-3 pr-4">{o.customerName}</td>
                      <td className="py-3 pr-4">{formatINR(o.total)}</td>
                      <td className="py-3 pr-4"><StatusBadge value={o.status} /></td>
                      <td className="py-3">{o.createdAt ? new Date(o.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short" }) : "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>}
      </section>
    </div>
    </AdminShell>
  );
}
