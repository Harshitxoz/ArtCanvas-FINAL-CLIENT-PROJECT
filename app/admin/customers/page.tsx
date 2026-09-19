export const dynamic = "force-dynamic";
import { AdminShell } from "@/components/admin/AdminShell";
import { requireAdmin } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { formatINR } from "@/lib/utils";

interface CustomerRow {
  _id: string;
  name: string;
  email: string;
  phone: string;
  orderCount: number;
  totalSpent: number;
  registeredAt: Date | null;
  lastOrderAt: Date | null;
}

export default async function CustomersAdmin() {
  await requireAdmin();
  let customers: CustomerRow[] = [];
  let dbError = false;
  try {
    const db = await getDb();
    const [users, orderStats] = await Promise.all([
      db.collection("users").find({ role: "customer" }).project({ name: 1, email: 1, phone: 1, createdAt: 1 }).sort({ createdAt: -1 }).limit(500).toArray() as Promise<{ _id?: unknown; name?: unknown; email?: unknown; phone?: unknown; createdAt?: unknown }[]>,
      db.collection("orders").aggregate([
        { $sort: { createdAt: -1 } },
        { $group: { _id: "$customer.email", orders: { $sum: 1 }, totalSpent: { $sum: { $cond: [{ $eq: ["$paymentStatus", "paid"] }, "$total", 0] } }, lastOrder: { $first: "$createdAt" }, phone: { $first: "$customer.phone" } } }
      ]).toArray() as Promise<{ _id?: unknown; orders?: unknown; totalSpent?: unknown; lastOrder?: unknown; phone?: unknown }[]>
    ]);
    const statsByEmail = new Map(orderStats.map((s: { _id?: unknown; orders?: unknown; totalSpent?: unknown; lastOrder?: unknown; phone?: unknown }) => [
      String(s._id || "").toLowerCase(),
      { orders: Number(s.orders) || 0, totalSpent: Number(s.totalSpent) || 0, lastOrder: s.lastOrder instanceof Date ? s.lastOrder : null, phone: String(s.phone || "") }
    ]));
    customers = users.map((u: { _id?: unknown; name?: unknown; email?: unknown; phone?: unknown; createdAt?: unknown }) => {
      const stats = statsByEmail.get(String(u.email || "").toLowerCase());
      return {
        _id: String(u._id),
        name: String(u.name || "Customer"),
        email: String(u.email || ""),
        phone: String(u.phone || stats?.phone || ""),
        orderCount: stats?.orders ?? 0,
        totalSpent: stats?.totalSpent ?? 0,
        registeredAt: u.createdAt instanceof Date ? u.createdAt : null,
        lastOrderAt: stats?.lastOrder ?? null
      };
    });
  } catch {
    dbError = true;
  }

  return (
    <AdminShell>
      <div className="grid gap-5">
        <header>
          <h1 className="font-serif text-3xl font-bold sm:text-4xl">Customers</h1>
          <p className="mt-1 text-sm text-black/55">Everyone who registered on the store, with their order activity.</p>
        </header>

        {dbError ? (
          <div className="rounded-3xl bg-white p-10 text-center shadow-sm">
            <p className="font-serif text-2xl font-bold">Could not load customers</p>
            <p className="mt-2 text-sm text-black/55">The database is not reachable right now. Please try again shortly.</p>
          </div>
        ) : customers.length === 0 ? (
          <div className="rounded-3xl bg-white p-10 text-center shadow-sm">
            <p className="font-serif text-2xl font-bold">No customers yet</p>
            <p className="mt-2 text-sm text-black/55">Customer accounts will appear here as soon as people register.</p>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-3xl bg-white shadow-sm">
            <table className="w-full min-w-[860px] text-left text-sm">
              <thead>
                <tr className="border-b text-xs uppercase tracking-wider text-black/45">
                  <th className="p-4">Name</th>
                  <th className="p-4">Email</th>
                  <th className="p-4">Phone</th>
                  <th className="p-4">Orders</th>
                  <th className="p-4">Total spent</th>
                  <th className="p-4">Registered</th>
                  <th className="p-4">Last order</th>
                </tr>
              </thead>
              <tbody>
                {customers.map(c => (
                  <tr key={c._id} className="border-b last:border-0 hover:bg-[#eee9e1]/40">
                    <td className="p-4 font-semibold">{c.name}</td>
                    <td className="p-4">{c.email}</td>
                    <td className="p-4">{c.phone || "—"}</td>
                    <td className="p-4">{c.orderCount}</td>
                    <td className="p-4 font-semibold">{c.totalSpent > 0 ? formatINR(c.totalSpent) : "—"}</td>
                    <td className="p-4">{c.registeredAt ? new Date(c.registeredAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : "—"}</td>
                    <td className="p-4">{c.lastOrderAt ? new Date(c.lastOrderAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : "—"}</td>
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
