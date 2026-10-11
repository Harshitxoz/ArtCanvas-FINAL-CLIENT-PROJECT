import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { getDb } from "@/lib/db";
import { getSession, requireAdmin } from "@/lib/auth";
import { orderStatusSchema, orderShippingSchema, orderRefundSchema } from "@/lib/validations";
import { getRazorpay } from "@/lib/razorpay";
import { sendAndRecordOrderNotification, type ShippingNotificationData } from "@/lib/email";
import type { OrderStatus, NotificationType } from "@/types";

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
  for (const k of ["shippingCarrier", "trackingNumber", "trackingUrl", "estimatedDelivery", "adminShippingNotes", "customerMessage"]) {
    if (data[k] !== undefined) out[k] = data[k];
  }
  return out;
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAdmin();
    const { id } = await params;
    if (!ObjectId.isValid(id)) return NextResponse.json({ error: "Invalid id" }, { status: 400 });

    const body = await req.json();

    // Check for explicit notification resend request from admin
    if (body.action === "resend_notification") {
      const type: NotificationType = body.notificationType || "order_status_update";
      const targetStatus: OrderStatus = body.status || "processing";
      const result = await sendAndRecordOrderNotification({
        orderId: id,
        type,
        targetStatus,
        forceResend: true,
        customMessage: body.customMessage
      });
      return NextResponse.json(result);
    }

    const parsed = orderStatusSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid status data", details: parsed.error.flatten().fieldErrors }, { status: 400 });
    }

    const db = await getDb();
    const existingOrder = await db.collection("orders").findOne({ _id: new ObjectId(id) });
    if (!existingOrder) return NextResponse.json({ error: "Order not found" }, { status: 404 });

    const newStatus = parsed.data.status;
    const shippingUpdates: Record<string, unknown> = {};
    if (parsed.data.shippingCarrier) shippingUpdates.shippingCarrier = parsed.data.shippingCarrier;
    if (parsed.data.trackingNumber) shippingUpdates.trackingNumber = parsed.data.trackingNumber;
    if (parsed.data.trackingUrl) shippingUpdates.trackingUrl = parsed.data.trackingUrl;
    if (parsed.data.estimatedDelivery) shippingUpdates.estimatedDelivery = parsed.data.estimatedDelivery;
    if (parsed.data.customerMessage) shippingUpdates.customerMessage = parsed.data.customerMessage;

    // 1. Update database record first
    const result = await db.collection("orders").updateOne(
      { _id: new ObjectId(id) },
      {
        $set: {
          status: newStatus,
          ...shippingUpdates,
          updatedAt: new Date()
        }
      }
    );

    if (!result.matchedCount) return NextResponse.json({ error: "Order not found" }, { status: 404 });

    // 2. Dispatch customer email notification if requested and status or tracking has changed
    let notificationResult = null;
    const shouldNotify = parsed.data.notifyCustomer !== false;
    const isStatusChanged = existingOrder.status !== newStatus;
    // Only send notification if status actually changed, OR if status is shipped and new tracking details were added/changed
    const isNewTrackingAdded =
      newStatus === "shipped" &&
      Boolean(parsed.data.trackingNumber) &&
      parsed.data.trackingNumber !== (existingOrder.trackingNumber || "");

    if (shouldNotify && (isStatusChanged || isNewTrackingAdded)) {
      let notifType: NotificationType = "order_status_update";
      if (newStatus === "shipped") notifType = "order_shipped";
      else if (newStatus === "delivered") notifType = "order_delivered";
      else if (newStatus === "cancelled") notifType = "order_cancelled";
      else if (newStatus === "refunded") notifType = "order_refunded";

      const shippingPayload: ShippingNotificationData = {
        shippingCarrier: (parsed.data.shippingCarrier || existingOrder.shippingCarrier) as string | undefined,
        trackingNumber: (parsed.data.trackingNumber || existingOrder.trackingNumber) as string | undefined,
        trackingUrl: (parsed.data.trackingUrl || existingOrder.trackingUrl) as string | undefined,
        estimatedDelivery: (parsed.data.estimatedDelivery || existingOrder.estimatedDelivery) as string | undefined,
        customerMessage: parsed.data.customerMessage
      };

      notificationResult = await sendAndRecordOrderNotification({
        orderId: id,
        type: notifType,
        targetStatus: newStatus,
        shippingData: shippingPayload,
        customMessage: parsed.data.customerMessage
      });
    }

    return NextResponse.json({ ok: true, status: newStatus, notification: notificationResult });
  } catch (e) {
    const message = e instanceof Error ? e.message : "";
    if (message === "UNAUTHORIZED") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    return NextResponse.json({ error: "Could not update order status" }, { status: 500 });
  }
}

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAdmin();
    const { id } = await params;
    if (!ObjectId.isValid(id)) return NextResponse.json({ error: "Invalid id" }, { status: 400 });

    const parsed = orderShippingSchema.safeParse(await req.json());
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid shipping data", details: parsed.error.flatten().fieldErrors }, { status: 400 });
    }

    const db = await getDb();
    const existingOrder = await db.collection("orders").findOne({ _id: new ObjectId(id) });
    if (!existingOrder) return NextResponse.json({ error: "Order not found" }, { status: 404 });

    const cleaned = cleanShipping(parsed.data);
    const update: Record<string, unknown> = { ...cleaned, updatedAt: new Date() };

    // Automatically transition to shipped if carrier or tracking number is supplied and status is earlier
    let targetStatus = existingOrder.status;
    if (cleaned.trackingNumber && ["paid", "processing", "packed"].includes(existingOrder.status)) {
      update.status = "shipped";
      targetStatus = "shipped";
    }

    // 1. Update database record first
    const result = await db.collection("orders").updateOne({ _id: new ObjectId(id) }, { $set: update });
    if (!result.matchedCount) return NextResponse.json({ error: "Order not found" }, { status: 404 });

    // 2. Dispatch Shipped notification if tracking number is present, customer notification is enabled,
    // and either status transitioned to shipped or tracking number is newly updated
    let notificationResult = null;
    const hasStatusChangedToShipped = update.status === "shipped" && existingOrder.status !== "shipped";
    const hasTrackingChanged = Boolean(cleaned.trackingNumber && cleaned.trackingNumber !== (existingOrder.trackingNumber || ""));

    if (parsed.data.notifyCustomer !== false && cleaned.trackingNumber && (hasStatusChangedToShipped || hasTrackingChanged)) {
      const shippingPayload: ShippingNotificationData = {
        shippingCarrier: String(cleaned.shippingCarrier || ""),
        trackingNumber: String(cleaned.trackingNumber || ""),
        trackingUrl: String(cleaned.trackingUrl || ""),
        estimatedDelivery: String(cleaned.estimatedDelivery || ""),
        customerMessage: String(cleaned.customerMessage || "")
      };

      notificationResult = await sendAndRecordOrderNotification({
        orderId: id,
        type: "order_shipped",
        targetStatus,
        shippingData: shippingPayload
      });
    }

    return NextResponse.json({ ok: true, status: targetStatus, notification: notificationResult });
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
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid refund data", details: parsed.error.flatten().fieldErrors }, { status: 400 });
    }

    const db = await getDb();
    const order = await db.collection("orders").findOne({ _id: new ObjectId(id) });
    if (!order) return NextResponse.json({ error: "Order not found" }, { status: 404 });
    if (!order.paymentId) return NextResponse.json({ error: "This order has no recorded payment to refund." }, { status: 409 });
    if (order.refund && order.refund.id) return NextResponse.json({ error: "This order has already been refunded." }, { status: 409 });

    const refundAmount = parsed.data.amount;
    if (refundAmount <= 0 || refundAmount > Number(order.total)) {
      return NextResponse.json({ error: "Refund amount must be greater than 0 and not exceed the order total." }, { status: 400 });
    }

    // 1. Process Razorpay refund
    const razorpay = getRazorpay();
    const razorpayRefund = await razorpay.payments.refund(order.paymentId, {
      amount: Math.round(refundAmount * 100),
      notes: { orderId: String(order._id) }
    });
    const refundId = String(razorpayRefund?.id || `${order.paymentId}_refund`);
    const now = new Date();

    // 2. Record refund in database
    const refundData = {
      id: refundId,
      amount: refundAmount,
      createdAt: now.toISOString(),
      note: parsed.data.note || ""
    };

    await db.collection("orders").updateOne(
      { _id: new ObjectId(id) },
      {
        $set: {
          refund: refundData,
          status: "refunded",
          updatedAt: now
        }
      }
    );

    // 3. Dispatch customer refund notification
    sendAndRecordOrderNotification({
      orderId: id,
      type: "order_refunded",
      targetStatus: "refunded",
      refundData
    }).catch(err => {
      console.error("[REFUND_NOTIFICATION_WARNING]", err);
    });

    return NextResponse.json({ ok: true, refundId });
  } catch (e) {
    const message = e instanceof Error ? e.message : "";
    if (message === "UNAUTHORIZED") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (message === "Razorpay is not configured.") return NextResponse.json({ error: "Payment gateway is not configured." }, { status: 503 });
    return NextResponse.json({ error: "Could not process refund. Please verify the payment details and try again." }, { status: 500 });
  }
}

