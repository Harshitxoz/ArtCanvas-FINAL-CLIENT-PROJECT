import { NextResponse } from "next/server";
import crypto from "node:crypto";
import { ObjectId } from "mongodb";
import { getDb, getClient } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { getRazorpay } from "@/lib/razorpay";
import { sendAndRecordOrderNotification } from "@/lib/email";

const LEASE_DURATION_MS = 60_000; // 60 seconds bounded lease

export async function POST(req: Request) {
  let orderId: string | undefined;
  let attemptToken: string | undefined;

  try {
    const body = await req.json();
    orderId = body.orderId;
    const { razorpayOrderId, paymentId, signature } = body;

    const secret = process.env.RAZORPAY_KEY_SECRET;
    if (!secret) {
      return NextResponse.json(
        { error: "Payment gateway is not configured." },
        { status: 503 }
      );
    }

    if (!orderId || !paymentId || !signature) {
      return NextResponse.json(
        { error: "Missing required payment verification fields." },
        { status: 400 }
      );
    }

    if (!ObjectId.isValid(orderId)) {
      return NextResponse.json({ error: "Invalid order ID." }, { status: 400 });
    }

    const db = await getDb();
    const order = await db.collection("orders").findOne({ _id: new ObjectId(orderId) });

    if (!order) {
      return NextResponse.json({ error: "Order not found." }, { status: 404 });
    }

    // 1. Session / Ownership validation (preserves legitimate guest checkout)
    const session = await getSession();
    if (order.userId) {
      if (!session || (session.role !== "admin" && String(order.userId) !== session.id)) {
        return NextResponse.json({ error: "Unauthorized access to this order." }, { status: 403 });
      }
    }

    // 2. Idempotency fast-path: if already settled, return exact status without duplicate side-effects
    if (order.paymentStatus === "paid" && order.status === "paid") {
      return NextResponse.json({ ok: true, alreadyPaid: true });
    }

    if (order.status === "refunded") {
      return NextResponse.json(
        { error: "Selected artwork went out of stock. Your payment has been refunded.", outOfStock: true, refunded: true },
        { status: 409 }
      );
    }

    if (order.refundStatus === "refund_pending" || (order.status === "cancelled" && order.inventoryShortage)) {
      return NextResponse.json(
        { error: "Selected artwork went out of stock. Your refund is pending processing.", outOfStock: true, refundPending: true },
        { status: 409 }
      );
    }

    if (order.status === "cancelled") {
      return NextResponse.json(
        { error: "Order has already been cancelled.", status: "cancelled" },
        { status: 409 }
      );
    }

    // 3. Stored Razorpay order ID validation
    if (!order.razorpayOrderId) {
      return NextResponse.json(
        { error: "Order is missing an associated gateway order ID." },
        { status: 400 }
      );
    }

    if (razorpayOrderId && razorpayOrderId !== order.razorpayOrderId) {
      return NextResponse.json(
        { error: "Razorpay order ID does not match order record." },
        { status: 400 }
      );
    }

    // 4. Secure HMAC-SHA256 signature verification using stored razorpayOrderId
    const signPayload = `${order.razorpayOrderId}|${paymentId}`;
    const expectedSignature = crypto.createHmac("sha256", secret).update(signPayload).digest("hex");

    const expectedBuf = Buffer.from(expectedSignature);
    const providedBuf = Buffer.from(signature);

    if (
      expectedBuf.length !== providedBuf.length ||
      !crypto.timingSafeEqual(expectedBuf, providedBuf)
    ) {
      return NextResponse.json({ error: "Invalid payment signature." }, { status: 400 });
    }

    // 5. Fetch payment details directly from Razorpay API to validate amount, currency, and status
    const razorpay = getRazorpay();
    let paymentDetails;
    try {
      paymentDetails = await razorpay.payments.fetch(paymentId);
    } catch (fetchErr) {
      console.error("[RAZORPAY_FETCH_PAYMENT_ERROR]", fetchErr);
      return NextResponse.json(
        { error: "Could not verify payment with payment gateway." },
        { status: 502 }
      );
    }

    if (!paymentDetails || paymentDetails.order_id !== order.razorpayOrderId) {
      return NextResponse.json(
        { error: "Payment does not belong to the verified order." },
        { status: 400 }
      );
    }

    const expectedAmountPaise = Math.round(order.total * 100);
    if (Number(paymentDetails.amount) !== expectedAmountPaise) {
      return NextResponse.json(
        { error: "Payment amount does not match server-calculated order total." },
        { status: 400 }
      );
    }

    if (paymentDetails.currency !== "INR") {
      return NextResponse.json(
        { error: "Payment currency mismatch." },
        { status: 400 }
      );
    }

    if (paymentDetails.status !== "captured" && paymentDetails.status !== "authorized") {
      return NextResponse.json(
        { error: `Payment is not in an approved state (${paymentDetails.status}).` },
        { status: 400 }
      );
    }

    // If authorized and manual capture mode, capture the payment before database transaction
    if (paymentDetails.status === "authorized") {
      try {
        await razorpay.payments.capture(paymentId, expectedAmountPaise, "INR");
      } catch (captureErr) {
        console.error("[RAZORPAY_MANUAL_CAPTURE_ERROR]", captureErr);
      }
    }

    // 6. Recoverable lease-based processing lock with attempt identifier and fencing token
    attemptToken = crypto.randomUUID();
    const now = new Date();
    const leaseExpiresAt = new Date(now.getTime() + LEASE_DURATION_MS);

    const claim = await db.collection("orders").findOneAndUpdate(
      {
        _id: new ObjectId(orderId),
        paymentStatus: { $ne: "paid" },
        status: { $nin: ["refunded", "cancelled"] },
        $or: [
          { verificationProcessing: { $ne: true } },
          { verificationLeaseExpiresAt: { $lt: now } }
        ]
      },
      {
        $set: {
          verificationProcessing: true,
          verificationToken: attemptToken,
          verificationLeaseExpiresAt: leaseExpiresAt,
          paymentId,
          updatedAt: now
        }
      },
      { returnDocument: "after" }
    );

    if (!claim) {
      // Another worker holds an active unexpired lock.
      // Poll boundedly (5 iterations x 1000ms) to allow in-flight worker to settle without falsely erroring.
      for (let i = 0; i < 5; i++) {
        await new Promise((resolve) => setTimeout(resolve, 1000));
        const freshOrder = await db.collection("orders").findOne({ _id: new ObjectId(orderId) });
        if (freshOrder?.paymentStatus === "paid" && freshOrder?.status === "paid") {
          return NextResponse.json({ ok: true, alreadyPaid: true });
        }
        if (freshOrder?.status === "refunded") {
          return NextResponse.json(
            { error: "Selected artwork went out of stock. Your payment has been refunded.", outOfStock: true, refunded: true },
            { status: 409 }
          );
        }
        if (freshOrder?.refundStatus === "refund_pending" || (freshOrder?.status === "cancelled" && freshOrder?.inventoryShortage)) {
          return NextResponse.json(
            { error: "Selected artwork went out of stock. Your refund is pending processing.", outOfStock: true, refundPending: true },
            { status: 409 }
          );
        }
      }

      // In-flight worker is still processing after bounded poll
      return NextResponse.json(
        {
          error: "Payment verification is in progress. Please wait a moment...",
          processing: true
        },
        { status: 202 }
      );
    }

    // 7. Atomic Inventory Settlement (via MongoDB multi-document ACID transaction)
    const client = await getClient();
    const sessionClient = client.startSession();
    let inventoryShortageDetected = false;
    let fencingMismatchDetected = false;

    try {
      await sessionClient.withTransaction(async () => {
        // Fencing check: ensure this attempt token still owns the lock
        const lockedOrder = await db.collection("orders").findOne(
          { _id: new ObjectId(orderId), verificationToken: attemptToken },
          { session: sessionClient }
        );

        if (!lockedOrder) {
          fencingMismatchDetected = true;
          throw new Error("FENCING_TOKEN_MISMATCH");
        }

        if (lockedOrder.paymentStatus === "paid") {
          return;
        }

        // Conditional stock decrements for all items
        for (const item of (order.items || [])) {
          if (!ObjectId.isValid(String(item.productId))) {
            inventoryShortageDetected = true;
            throw new Error("INVENTORY_SHORTAGE");
          }

          const pId = new ObjectId(String(item.productId));
          const qty = Number(item.quantity) || 1;

          const stockUpdate = await db.collection("products").updateOne(
            {
              _id: pId,
              "sizes.label": item.size,
              "sizes.stock": { $gte: qty }
            },
            {
              $inc: { "sizes.$.stock": -qty },
              $set: { updatedAt: new Date() }
            },
            { session: sessionClient }
          );

          if (stockUpdate.modifiedCount !== 1) {
            inventoryShortageDetected = true;
            throw new Error("INVENTORY_SHORTAGE");
          }
        }

        // Increment coupon usage if applied
        if (order.couponCode) {
          await db.collection("coupons").updateOne(
            { code: order.couponCode, active: true },
            { $inc: { usedCount: 1 } },
            { session: sessionClient }
          );
        }

        // Finalize order payment and inventory status
        const finalizeResult = await db.collection("orders").updateOne(
          {
            _id: new ObjectId(orderId),
            verificationToken: attemptToken
          },
          {
            $set: {
              paymentStatus: "paid",
              status: "paid",
              paymentId,
              razorpayOrderId: order.razorpayOrderId,
              verificationProcessing: false,
              stockDeducted: true,
              updatedAt: new Date()
            },
            $unset: {
              verificationToken: "",
              verificationLeaseExpiresAt: ""
            }
          },
          { session: sessionClient }
        );

        if (finalizeResult.modifiedCount !== 1) {
          fencingMismatchDetected = true;
          throw new Error("FENCING_TOKEN_MISMATCH");
        }
      });
    } catch (txError: unknown) {
      const errMessage = txError instanceof Error ? txError.message : String(txError);

      // Handle standalone MongoDB fallback if transactions are unsupported on local/dev cluster
      if (errMessage.includes("Transaction numbers are only allowed on a replica set member")) {
        console.warn("[MONGO_STANDALONE_FALLBACK] Multi-document transactions unsupported on standalone cluster. Executing compensating sequence.");
        const decrementedItems: { productId: ObjectId; size: string; quantity: number }[] = [];
        let fallbackShortage = false;

        for (const item of (order.items || [])) {
          const pId = new ObjectId(String(item.productId));
          const qty = Number(item.quantity) || 1;
          const res = await db.collection("products").updateOne(
            { _id: pId, "sizes.label": item.size, "sizes.stock": { $gte: qty } },
            { $inc: { "sizes.$.stock": -qty }, $set: { updatedAt: new Date() } }
          );
          if (res.modifiedCount === 1) {
            decrementedItems.push({ productId: pId, size: item.size, quantity: qty });
          } else {
            fallbackShortage = true;
            break;
          }
        }

        if (fallbackShortage) {
          for (const comp of decrementedItems) {
            await db.collection("products").updateOne(
              { _id: comp.productId, "sizes.label": comp.size },
              { $inc: { "sizes.$.stock": comp.quantity }, $set: { updatedAt: new Date() } }
            );
          }
          inventoryShortageDetected = true;
        } else {
          if (order.couponCode) {
            await db.collection("coupons").updateOne(
              { code: order.couponCode, active: true },
              { $inc: { usedCount: 1 } }
            );
          }
          await db.collection("orders").updateOne(
            { _id: new ObjectId(orderId), verificationToken: attemptToken },
            {
              $set: {
                paymentStatus: "paid",
                status: "paid",
                paymentId,
                razorpayOrderId: order.razorpayOrderId,
                verificationProcessing: false,
                stockDeducted: true,
                updatedAt: new Date()
              },
              $unset: { verificationToken: "", verificationLeaseExpiresAt: "" }
            }
          );
        }
      } else if (!inventoryShortageDetected && !fencingMismatchDetected) {
        throw txError;
      }
    } finally {
      await sessionClient.endSession();
    }

    if (fencingMismatchDetected) {
      return NextResponse.json(
        { error: "Verification attempt was superseded by a newer request.", superseded: true },
        { status: 409 }
      );
    }

    // 8. Handle inventory shortage after captured payment
    if (inventoryShortageDetected) {
      // Transaction was aborted, so 0 stock was decremented.
      // Attempt safe automatic refund via Razorpay:
      let refundRecord: { id: string; amount: number; createdAt: string; note: string } | null = null;
      let refundErrorMessage = "";

      try {
        const refundRes = await razorpay.payments.refund(paymentId, {
          amount: expectedAmountPaise,
          notes: {
            orderId,
            reason: "Artwork out of stock during checkout verification"
          }
        });
        refundRecord = {
          id: String(refundRes?.id || `${paymentId}_auto_refund`),
          amount: order.total,
          createdAt: new Date().toISOString(),
          note: "Automatic refund: Selected artwork went out of stock during checkout."
        };
      } catch (refundErr) {
        refundErrorMessage = refundErr instanceof Error ? refundErr.message : "Gateway refund failed";
        console.error("[AUTO_REFUND_ERROR]", refundErr);
      }

      if (refundRecord) {
        // Refund succeeded
        await db.collection("orders").updateOne(
          { _id: new ObjectId(orderId) },
          {
            $set: {
              status: "refunded",
              paymentStatus: "paid",
              refundStatus: "completed",
              refund: refundRecord,
              inventoryShortage: true,
              verificationProcessing: false,
              adminShippingNotes: "Automated refund processed via Razorpay: Selected artwork was out of stock.",
              updatedAt: new Date()
            },
            $unset: { verificationToken: "", verificationLeaseExpiresAt: "" }
          }
        );

        sendAndRecordOrderNotification({
          orderId,
          type: "order_refunded",
          targetStatus: "refunded",
          refundData: refundRecord
        }).catch((err) => {
          console.error("[REFUND_NOTIFICATION_ERROR]", err);
        });

        return NextResponse.json(
          {
            error: "Selected artwork went out of stock. Your payment has been refunded.",
            outOfStock: true,
            refunded: true
          },
          { status: 409 }
        );
      }

      // Refund failed: record explicit refund_pending state for admin recovery
      await db.collection("orders").updateOne(
        { _id: new ObjectId(orderId) },
        {
          $set: {
            status: "cancelled",
            paymentStatus: "paid",
            refundStatus: "refund_pending",
            inventoryShortage: true,
            verificationProcessing: false,
            adminShippingNotes: "CRITICAL: Artwork out of stock after payment. Automatic refund could not be processed. Administrator must process refund manually via Order Details.",
            refundError: refundErrorMessage,
            updatedAt: new Date()
          },
          $unset: { verificationToken: "", verificationLeaseExpiresAt: "" }
        }
      );

      return NextResponse.json(
        {
          error: "Selected artwork went out of stock. Your refund is pending processing. Our team has been notified.",
          outOfStock: true,
          refundPending: true,
          refunded: false
        },
        { status: 409 }
      );
    }

    // 9. Payment confirmed & settled! Dispatch confirmation notification
    sendAndRecordOrderNotification({
      orderId,
      type: "payment_confirmed",
      targetStatus: "paid"
    }).catch((emailErr) => {
      console.error("[EMAIL_DISPATCH_WARNING]", emailErr);
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[PAYMENT_VERIFY_ERROR]", error);

    // Release lease on unhandled error if this attempt still holds the token
    if (orderId && ObjectId.isValid(orderId) && attemptToken) {
      try {
        const db = await getDb();
        await db.collection("orders").updateOne(
          { _id: new ObjectId(orderId), verificationToken: attemptToken },
          {
            $set: { verificationProcessing: false },
            $unset: { verificationLeaseExpiresAt: "" }
          }
        );
      } catch {
        /* ignore error during unlock */
      }
    }

    return NextResponse.json({ error: "Could not verify payment." }, { status: 500 });
  }
}


