export const dynamic = "force-dynamic";
import { AdminShell } from "@/components/admin/AdminShell";
import { requireAdmin } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { formatINR } from "@/lib/utils";

export const metadata = { title: "Analytics — ArtCanvas Admin" };

interface AnalyticsData {
  ok: boolean;
  daily: { day: string; label: string; revenue: number; orders: number }[];
  byStatus: { status: string; count: number }[];
  byArtType: { artType: string; revenue: number; qty: number }[];
  byCategory: { category: string; revenue: number; orders: number }[];
}

export default async function AnalyticsAdmin() {
  await requireAdmin();
  const data = await loadAnalytics();
  const maxRevenue = Math.max(...data.daily.map(d => d.revenue), 1);

  return (
    <AdminShell>
      <header>
        <h1 className="font-serif text-4xl font-bold">Analytics</h1>
        <p className="mt-1 text-sm text-black/55">Revenue and order trends from real store data (paid orders only).</p>
      </header>

      {!data.ok ? (
        <div className="mt-6 rounded-3xl bg-white p-10 text-center shadow-sm">
          <p className="font-serif text-2xl font-bold">Could not load analytics</p>
          <p className="mt-2 text-sm text-black/55">The database is not reachable right now. Please try again shortly.</p>
        </div>
      ) : (
        <div className="mt-6 grid gap-5">
          <section className="rounded-3xl bg-white p-6 shadow-sm" aria-label="Daily revenue, last 14 days">
            <h2 className="font-serif text-2xl font-bold">Revenue — last 14 days</h2>
            {data.daily.every(d => d.revenue === 0) ? (
              <p className="mt-4 rounded-2xl bg-[#eee9e1] p-5 text-sm text-black/55">No paid orders in the last 14 days yet.</p>
            ) : (
              <ul className="mt-4 grid gap-2">
                {data.daily.map(d => (
                  <li key={d.day} className="grid grid-cols-[86px_1fr_130px] items-center gap-3 text-sm">
                    <span className="text-xs font-semibold text-black/55">{d.label}</span>
                    <span className="h-5 min-w-[4px] rounded-full bg-[#9a5d19]/85" style={{ width: `${Math.max((d.revenue / maxRevenue) * 100, 2)}%` }} role="presentation" />
                    <span className="text-right text-xs font-semibold">{d.revenue > 0 ? formatINR(d.revenue) : "—"} <span className="font-normal text-black/45">({d.orders})</span></span>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <div className="grid gap-5 lg:grid-cols-2">
            <section className="rounded-3xl bg-white p-6 shadow-sm" aria-label="Orders by status">
              <h2 className="font-serif text-2xl font-bold">Orders by status</h2>
              {data.byStatus.length === 0 ? (
                <p className="mt-4 rounded-2xl bg-[#eee9e1] p-5 text-sm text-black/55">No orders yet.</p>
              ) : (
                <ul className="mt-4 grid gap-2 text-sm">
                  {data.byStatus.map(s => (
                    <li key={s.status} className="flex items-center justify-between rounded-xl bg-[#eee9e1]/70 px-4 py-2.5">
                      <span className="font-semibold capitalize">{s.status}</span>
                      <span className="font-bold text-[#9a5d19]">{s.count}</span>
                    </li>
                  ))}
                </ul>
              )}
            </section>

            <section className="rounded-3xl bg-white p-6 shadow-sm" aria-label="Revenue by art type">
              <h2 className="font-serif text-2xl font-bold">Revenue by art type</h2>
              {data.byArtType.length === 0 ? (
                <p className="mt-4 rounded-2xl bg-[#eee9e1] p-5 text-sm text-black/55">No paid orders yet.</p>
              ) : (
                <ul className="mt-4 grid gap-2 text-sm">
                  {data.byArtType.map(a => (
                    <li key={a.artType} className="flex items-center justify-between rounded-xl bg-[#eee9e1]/70 px-4 py-2.5">
                      <span className="font-semibold">{a.artType === "hand-painted" ? "Hand-Painted" : a.artType === "printed-canvas" ? "Printed Canvas" : a.artType}</span>
                      <span className="text-right"><span className="font-bold text-[#9a5d19]">{formatINR(a.revenue)}</span><span className="block text-xs text-black/45">{a.qty} sold</span></span>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </div>

          <section className="rounded-3xl bg-white p-6 shadow-sm" aria-label="Revenue by category">
            <h2 className="font-serif text-2xl font-bold">Revenue by category</h2>
            {data.byCategory.length === 0 ? (
              <p className="mt-4 rounded-2xl bg-[#eee9e1] p-5 text-sm text-black/55">No paid orders yet.</p>
            ) : (
              <ul className="mt-4 grid gap-2 text-sm sm:grid-cols-2">
                {data.byCategory.map(c => (
                  <li key={c.category} className="flex items-center justify-between rounded-xl bg-[#eee9e1]/70 px-4 py-2.5">
                    <span className="font-semibold capitalize">{c.category.replace("-", " ")}</span>
                    <span className="text-right"><span className="font-bold text-[#9a5d19]">{formatINR(c.revenue)}</span><span className="block text-xs text-black/45">{c.orders} order{c.orders === 1 ? "" : "s"}</span></span>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      )}
    </AdminShell>
  );
}


async function loadAnalytics(): Promise<AnalyticsData> {
  const empty: AnalyticsData = { ok: false, daily: [], byStatus: [], byArtType: [], byCategory: [] };
  try {
    const db = await getDb();
    const orders = db.collection("orders");
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    start.setDate(start.getDate() - 13);

    const [daily, byStatus, byArtType, byCategory] = await Promise.all([
      orders.aggregate([
        { $match: { paymentStatus: "paid", createdAt: { $gte: start } } },
        { $group: { _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } }, revenue: { $sum: "$total" }, orders: { $sum: 1 } } }
      ]).toArray() as Promise<{ _id?: unknown; revenue?: unknown; orders?: unknown }[]>,
      orders.aggregate([{ $group: { _id: "$status", count: { $sum: 1 } } }, { $sort: { count: -1 } }]).toArray() as Promise<{ _id?: unknown; count?: unknown }[]>,
      orders.aggregate([
        { $match: { paymentStatus: "paid" } },
        { $unwind: "$items" },
        { $lookup: { from: "products", localField: "items.productId", foreignField: "_id", as: "product" } },
        { $unwind: { path: "$product", preserveNullAndEmptyArrays: true } },
        { $group: { _id: "$product.artType", revenue: { $sum: { $multiply: ["$items.price", "$items.quantity"] } }, qty: { $sum: "$items.quantity" } } },
        { $sort: { revenue: -1 } }
      ]).toArray() as Promise<{ _id?: unknown; revenue?: unknown; qty?: unknown }[]>,
      orders.aggregate([
        { $match: { paymentStatus: "paid" } },
        { $unwind: "$items" },
        { $lookup: { from: "products", localField: "items.productId", foreignField: "_id", as: "product" } },
        { $unwind: { path: "$product", preserveNullAndEmptyArrays: true } },
        { $group: { _id: { $ifNull: ["$product.category", "uncategorised"] }, revenue: { $sum: { $multiply: ["$items.price", "$items.quantity"] } }, orderIds: { $addToSet: "$_id" } } },
        { $project: { revenue: 1, orderCount: { $size: "$orderIds" } } },
        { $sort: { revenue: -1 } },
        { $limit: 8 }
      ]).toArray() as Promise<{ _id?: unknown; revenue?: unknown; orderCount?: unknown }[]>
    ]);

    const dailyMap = new Map(daily.map(d => [String(d._id), { revenue: Number(d.revenue) || 0, orders: Number(d.orders) || 0 }]));
    const days: AnalyticsData["daily"] = [];
    for (let i = 13; i >= 0; i--) {
      const date = new Date();
      date.setHours(0, 0, 0, 0);
      date.setDate(date.getDate() - i);
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
      const hit = dailyMap.get(key) || { revenue: 0, orders: 0 };
      days.push({ day: key, label: date.toLocaleDateString("en-IN", { day: "numeric", month: "short" }), revenue: hit.revenue, orders: hit.orders });
    }

    return {
      ok: true,
      daily: days,
      byStatus: byStatus.map((d: { _id?: unknown; count?: unknown }) => ({ status: String(d._id || "pending"), count: Number(d.count) || 0 })),
      byArtType: byArtType.map((d: { _id?: unknown; revenue?: unknown; qty?: unknown }) => ({ artType: String(d._id || "unknown"), revenue: Number(d.revenue) || 0, qty: Number(d.qty) || 0 })),
      byCategory: byCategory.map((d: { _id?: unknown; revenue?: unknown; orderCount?: unknown }) => ({ category: String(d._id), revenue: Number(d.revenue) || 0, orders: Number(d.orderCount) || 0 }))
    };
  } catch {
    return empty;
  }
}
