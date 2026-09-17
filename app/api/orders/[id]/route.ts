import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { getDb } from "@/lib/db";
import { getSession, requireAdmin } from "@/lib/auth";
import { orderStatusSchema, orderShippingSchema, orderRefundSchema } from "@/lib/validations";
import { getRazorpay } from "@/lib/razorpay";

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

function cleanShipping(data: Record<string, unknown>) {
  const out: Record<string, unknown> = {};
  for (const k of ["shippingCarrier", "trackingNumber", "trackingUrl", "estimatedDelivery", "adminShippingNotes"]) {
    if (data[k] !== undefined) out[k] = data[k];
  }
  return out;
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

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAdmin();
    const { id } = await params;
    if (!ObjectId.isValid(id)) return NextResponse.json({ error: "Invalid id" }, { status: 400 });
    const parsed = orderShippingSchema.safeParse(await req.json());
    if (!parsed.success) return NextResponse.json({ error: "Invalid shipping data", details: parsed.error.flatten().fieldErrors }, { status: 400 });
    const db = await getDb();
    const update: Record<string, unknown> = { ...cleanShipping(parsed.data), updatedAt: new Date() };
    const result = await db.collection("orders").updateOne({ _id: new ObjectId(id) }, { $set: update });
    if (!result.matchedCount) return NextResponse.json({ error: "Order not found" }, { status: 404 });
    return NextResponse.json({ ok: true });
  } catch (e) {
    const message = e instanceof Error ? e.message : "";
    if (message === "UNAUTHORIZED") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    return NextResponse.json({ error: "Could not update shipping" }, { status: 500 });
  }
}

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAdmin();
    const { id } = await params;
    if (!ObjectId.isValid(id)) return NextResponse.json({ error: "Invalid id" }, { status: 400 });
    const parsed = orderRefundSchema.safeParse(await req.json());
    if (!parsed.success) return NextResponse.json({ error: "Invalid refund data", details: parsed.error.flatten().fieldErrors }, { status: 400 });
    const db = await getDb();
    const order = await db.collection("orders").findOne({ _id: new ObjectId(id) });
    if (!order) return NextResponse.json({ error: "Order not found" }, { status: 404 });
    if (!order.paymentId) return NextResponse.json({ error: "This order has no recorded payment to refund." }, { status: 409 });
    if (order.refund && order.refund.id) return NextResponse.json({ error: "This order has already been refunded." }, { status: 409 });
    const refundAmount = parsed.data.amount;
    if (refundAmount <= 0 || refundAmount > Number(order.total)) return NextResponse.json({ error: "Refund amount must be greater than 0 and not exceed the order total." }, { status: 400 });
    const razorpay = getRazorpay();
    const razorpayRefund = await razorpay.paymentRefunds.refund(order.paymentId, { amount: Math.round(refundAmount * 100), notes: { orderId: String(order._id) } });
    const refundId = String(razorpayRefund?.id || `${order.paymentId}_refund`);
    const now = new Date();
    await db.collection("orders").updateOne(
      { _id: new ObjectId(id) },
      { $set: { refund: { id: refundId, amount: refundAmount, createdAt: now.toISOString(), note: parsed.data.note || "" }, status: "refunded", updatedAt: now } }
    );
    return NextResponse.json({ ok: true, refundId });
  } catch (e) {
    const message = e instanceof Error ? e.message : "";
    if (message === "UNAUTHORIZED") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (message === "Razorpay is not configured.") return NextResponse.json({ error: "Payment gateway is not configured." }, { status: 503 });
    return NextResponse.json({ error: "Could not process refund. Please verify the payment details and try again." }, { status: 500 });
  }
}
