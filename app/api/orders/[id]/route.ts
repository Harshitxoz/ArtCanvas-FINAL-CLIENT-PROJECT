import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { getDb } from "@/lib/db";
import { getSession, requireAdmin } from "@/lib/auth";
import { orderStatusSchema } from "@/lib/validations";

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!ObjectId.isValid(id)) return NextResponse.json({ error: "Invalid id" }, { status: 400 });
  const user = await getSession();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const db = await getDb();
    const o = await db.collection("orders").findOne({ _id: new ObjectId(id) });
    if (!o) return NextResponse.json({ error: "Not found" }, { status: 404 });
    if (user.role !== "admin" && String(o.userId) !== user.id) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    return NextResponse.json({ ...o, _id: String(o._id) });
  } catch {
    return NextResponse.json({ error: "Database unavailable" }, { status: 503 });
  }
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAdmin();
    const { id } = await params;
    if (!ObjectId.isValid(id)) return NextResponse.json({ error: "Invalid id" }, { status: 400 });
    const parsed = orderStatusSchema.safeParse(await req.json());
    if (!parsed.success) return NextResponse.json({ error: "Invalid status" }, { status: 400 });
    const db = await getDb();
    const result = await db.collection("orders").updateOne(
      { _id: new ObjectId(id) },
      { $set: { status: parsed.data.status, updatedAt: new Date() } }
    );
    if (!result.matchedCount) return NextResponse.json({ error: "Order not found" }, { status: 404 });
    return NextResponse.json({ ok: true });
  } catch (e) {
    const message = e instanceof Error ? e.message : "";
    if (message === "UNAUTHORIZED") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    return NextResponse.json({ error: "Could not update order" }, { status: 500 });
  }
}
