import { NextResponse } from "next/server";
import crypto from "node:crypto";
import { ObjectId } from "mongodb";
import { getDb } from "@/lib/db";
import { sendOrderConfirmationEmail } from "@/lib/email";

export async function POST(req: Request) {
  try {
    const { orderId, razorpayOrderId, paymentId, signature } = await req.json();
    const secret = process.env.RAZORPAY_KEY_SECRET;
    if (!secret) return NextResponse.json({ error: "Payment gateway not configured" }, { status: 503 });
    if (!orderId || !paymentId || !signature) return NextResponse.json({ error: "Missing payment fields" }, { status: 400 });

    const signPayload = razorpayOrderId ? `${razorpayOrderId}|${paymentId}` : `${orderId}|${paymentId}`;
    const expected = crypto.createHmac("sha256", secret).update(signPayload).digest("hex");
    if (expected.length !== signature.length || !crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(signature))) {
      return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
    }
    if (!ObjectId.isValid(orderId)) return NextResponse.json({ error: "Invalid order id" }, { status: 400 });
    const db = await getDb();
    const order = await db.collection("orders").findOne({ _id: new ObjectId(orderId) });
    if (!order) return NextResponse.json({ error: "Order not found" }, { status: 404 });
    if (order.paymentStatus === "paid") return NextResponse.json({ ok: true });

    await db.collection("orders").updateOne(
      { _id: new ObjectId(orderId) },
      {
        $set: {
          paymentStatus: "paid",
          status: "paid",
          paymentId,
          ...(razorpayOrderId ? { razorpayOrderId } : {}),
          updatedAt: new Date()
        }
      }
    );
    if (order.couponCode) {
      await db.collection("coupons").updateOne({ code: order.couponCode, active: true }, { $inc: { usedCount: 1 } });
    }
    for (const item of (order.items || [])) {
      if (ObjectId.isValid(String(item.productId))) {
        await db.collection("products").updateOne(
          { _id: new ObjectId(String(item.productId)), "sizes.label": item.size, "sizes.stock": { $gte: Number(item.quantity) } },
          { $inc: { "sizes.$.stock": -Number(item.quantity) }, $set: { updatedAt: new Date() } }
        );
      }
    }

    // Trigger transactional order confirmation email asynchronously
    sendOrderConfirmationEmail({
      ...order,
      _id: orderId,
      paymentId,
      razorpayOrderId
    } as any).catch((emailErr) => {
      console.error("[EMAIL_DISPATCH_WARNING]", emailErr);
    });

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Could not verify payment" }, { status: 500 });
  }
}
