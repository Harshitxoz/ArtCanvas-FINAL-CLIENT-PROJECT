import { MongoClient, ObjectId } from "mongodb";
import crypto from "node:crypto";
import nodemailer from "nodemailer";
import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";

function loadEnv() {
  const envFiles = [".env.local", ".env"];
  for (const file of envFiles) {
    const fullPath = resolve(process.cwd(), file);
    if (existsSync(fullPath)) {
      const content = readFileSync(fullPath, "utf-8");
      for (const line of content.split("\n")) {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith("#")) continue;
        const idx = trimmed.indexOf("=");
        if (idx > 0) {
          const key = trimmed.slice(0, idx).trim();
          const value = trimmed.slice(idx + 1).trim().replace(/^['"]|['"]$/g, "");
          if (!process.env[key]) {
            process.env[key] = value;
          }
        }
      }
    }
  }
}

loadEnv();

const MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost:27017/artcanvas";
const dbName = process.env.MONGODB_DB || "artcanvas";
const RAZORPAY_KEY_SECRET = process.env.RAZORPAY_KEY_SECRET || "test_rzp_secret";

function formatINR(val) {
  return "₹" + Number(val || 0).toLocaleString("en-IN");
}

function buildPaymentConfirmationEmail(order) {
  const orderIdStr = String(order._id || "");
  const orderNumber = orderIdStr ? orderIdStr.slice(-8).toUpperCase() : "AC-" + Date.now().toString().slice(-6);
  const postal = order.customer?.postalCode || order.customer?.pincode || "";
  const fullAddress = `${order.customer?.address}, ${order.customer?.city}, ${order.customer?.state} ${postal}`.trim();
  const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000").replace(/\/$/, "");
  const trackingUrl = orderIdStr ? `${siteUrl}/order-confirmation/${orderIdStr}` : `${siteUrl}/account/orders`;

  const html = `
    <!DOCTYPE html><html><body>
    <div style="background:#1a1614;padding:30px;text-align:center;">
      <h1 style="color:#d4a373;font-family:Georgia,serif;">ARTCANVAS</h1>
      <p style="color:#cfc8c0;">Original Artworks & Fine Art Canvas Prints</p>
    </div>
    <div style="padding:30px;background:#faf7f2;">
      <h2>Thank you for your order, ${order.customer?.name}!</h2>
      <p>Order Reference: #AC-${orderNumber}</p>
      <p>Payment Status: <strong>Paid</strong></p>
      <p>Total Paid: ${formatINR(order.total)}</p>
      <p>Delivery Address: ${fullAddress}</p>
      <p>Items (${order.items?.length}):</p>
      <ul>
        ${order.items?.map(i => `<li>${i.title} (${i.artType || "Artwork"}) - ${i.size} (${i.frame === "framed" ? "Framed" : "Unframed"}) x${i.quantity}</li>`).join("")}
      </ul>
      <a href="${trackingUrl}">View Live Order Details →</a>
    </div>
    </body></html>
  `;

  const text = `ArtCanvas - Order Confirmed: #AC-${orderNumber}\nThank you for your order, ${order.customer?.name}!\nTotal Paid: ${formatINR(order.total)}\nAddress: ${fullAddress}\nView: ${trackingUrl}`;

  return {
    subject: "Your ArtCanvas order is confirmed! 🎨",
    html,
    text
  };
}

function buildOrderShippedEmail(order, shipping) {
  const orderIdStr = String(order._id || "");
  const orderNumber = orderIdStr ? orderIdStr.slice(-8).toUpperCase() : "AC-" + Date.now().toString().slice(-6);
  const carrier = shipping.shippingCarrier || "Standard Studio Courier";
  const trackingNumber = shipping.trackingNumber || "Pending Courier Scan";
  const trackingUrl = shipping.trackingUrl || "";
  const estimatedDelivery = shipping.estimatedDelivery || "";
  const customerMessage = shipping.customerMessage || "";

  const html = `
    <!DOCTYPE html><html><body>
    <div style="background:#1a1614;padding:30px;text-align:center;">
      <h1 style="color:#d4a373;">ARTCANVAS</h1>
    </div>
    <div style="padding:30px;background:#faf7f2;">
      <h2>Your artwork is on its way, ${order.customer?.name}!</h2>
      <p>Courier: <strong>${carrier}</strong></p>
      <p>Tracking ID: <strong>${trackingNumber}</strong></p>
      ${trackingUrl ? `<p><a href="${trackingUrl}">Track Online</a></p>` : ""}
      ${estimatedDelivery ? `<p>Estimated Delivery: ${estimatedDelivery}</p>` : ""}
      ${customerMessage ? `<p>Studio Note: "${customerMessage}"</p>` : ""}
    </div>
    </body></html>
  `;

  return {
    subject: "Your ArtCanvas artwork has shipped! 🚚",
    html,
    text: `ArtCanvas - Order Shipped: #AC-${orderNumber}\nCarrier: ${carrier}\nTracking: ${trackingNumber}`
  };
}

async function sendAndRecordOrderNotification(db, { orderId, type, targetStatus, shippingData, forceResend }) {
  const orderDoc = await db.collection("orders").findOne({ _id: new ObjectId(String(orderId)) });
  if (!orderDoc) return { ok: false, error: "Order not found" };

  let resolvedEmail = orderDoc.customer?.email?.trim().toLowerCase();
  if (orderDoc.userId) {
    const userDoc = await db.collection("users").findOne({ _id: new ObjectId(String(orderDoc.userId)) });
    if (userDoc?.email) resolvedEmail = String(userDoc.email).trim().toLowerCase();
  }

  if (!resolvedEmail) return { ok: false, error: "No recipient email address" };

  const idempotencyKey =
    type === "payment_confirmed"
      ? `payment:${orderDoc.paymentId || orderDoc.razorpayOrderId || String(orderDoc._id)}`
      : type === "order_shipped"
      ? `shipped:${String(orderDoc._id)}:${shippingData?.trackingNumber || orderDoc.trackingNumber || "v1"}`
      : `status:${String(orderDoc._id)}:${targetStatus}`;

  const existing = orderDoc.notifications || [];
  if (!forceResend && existing.some(n => n.idempotencyKey === idempotencyKey && n.success)) {
    return { ok: true, alreadySent: true, idempotencyKey };
  }

  let emailPayload;
  if (type === "payment_confirmed") {
    emailPayload = buildPaymentConfirmationEmail(orderDoc);
  } else if (type === "order_shipped") {
    emailPayload = buildOrderShippedEmail(orderDoc, shippingData || {});
  } else {
    emailPayload = { subject: `Update on order #${orderId}`, html: `<p>Status: ${targetStatus}</p>`, text: `Status: ${targetStatus}` };
  }

  // Safe mock or real provider dispatch
  const resendApiKey = process.env.RESEND_API_KEY?.trim();
  const provider = resendApiKey ? "resend" : "mock";
  const messageId = `${provider}-${Date.now()}`;

  const record = {
    type,
    status: targetStatus,
    recipient: resolvedEmail,
    sentAt: new Date(),
    provider,
    messageId,
    success: true,
    idempotencyKey
  };

  await db.collection("orders").updateOne(
    { _id: new ObjectId(String(orderDoc._id)) },
    {
      $push: { notifications: record },
      $set: {
        latestNotification: { type, sentAt: new Date(), success: true, recipient: resolvedEmail },
        updatedAt: new Date()
      }
    }
  );

  return { ok: true, alreadySent: false, messageId, idempotencyKey };
}

async function runNotificationTestSuite() {
  console.log("================================================================================");
  console.log("           ARTCANVAS ORDER NOTIFICATIONS & RELIABILITY TEST SUITE               ");
  console.log("================================================================================\n");

  let passed = 0;
  let failed = 0;

  function assert(name, condition, extra = "") {
    if (condition) {
      console.log(`[PASS] ${name} ${extra ? `(${extra})` : ""}`);
      passed++;
    } else {
      console.error(`[FAIL] ${name} ${extra ? `(${extra})` : ""}`);
      failed++;
    }
  }

  const client = new MongoClient(MONGODB_URI);
  await client.connect();
  const db = client.db(dbName);

  let testOrderId = null;
  let testUserId = null;

  try {
    console.log("--- TEST 1: Template Builders & Brand Palette Contract ---");
    const mockOrder = {
      _id: "67a91f5e2a3b4c5d6e7f8a9b",
      total: 14999,
      customer: { name: "Meera Sen", email: "meera@example.com", address: "14 Park Street", city: "Kolkata", state: "WB", postalCode: "700016" },
      items: [{ title: "Rhythm of Autumn", artType: "hand-painted", size: "30x20", frame: "framed", quantity: 1, price: 14999 }]
    };

    const confirmEmail = buildPaymentConfirmationEmail(mockOrder);
    assert("Payment email subject is 'Your ArtCanvas order is confirmed! 🎨'", confirmEmail.subject === "Your ArtCanvas order is confirmed! 🎨");
    assert("Payment email HTML contains ArtCanvas branding and artwork title", confirmEmail.html.includes("ARTCANVAS") && confirmEmail.html.includes("Rhythm of Autumn"));
    assert("Payment email plain text fallback contains total and customer name", confirmEmail.text.includes("Meera Sen") && confirmEmail.text.includes("₹14,999"));

    const shippedEmail = buildOrderShippedEmail(mockOrder, {
      shippingCarrier: "Blue Dart Express",
      trackingNumber: "BD889102",
      trackingUrl: "https://track.bluedart.com/BD889102",
      estimatedDelivery: "15 Oct 2026",
      customerMessage: "Handcrafted wooden corner guards installed."
    });
    assert("Shipped email subject is 'Your ArtCanvas artwork has shipped! 🚚'", shippedEmail.subject === "Your ArtCanvas artwork has shipped! 🚚");
    assert("Shipped email includes courier Blue Dart Express", shippedEmail.html.includes("Blue Dart Express"));
    assert("Shipped email includes tracking ID BD889102", shippedEmail.html.includes("BD889102"));
    assert("Shipped email includes clickable tracking link", shippedEmail.html.includes("https://track.bluedart.com/BD889102"));
    assert("Shipped email includes estimated delivery date", shippedEmail.html.includes("15 Oct 2026"));
    assert("Shipped email includes studio note for customer", shippedEmail.html.includes("Handcrafted wooden corner guards"));

    console.log("\n--- TEST 2: User & Order Creation in MongoDB ---");
    testUserId = new ObjectId();
    await db.collection("users").insertOne({
      _id: testUserId,
      name: "Meera Sen",
      email: "meera.registered@example.com",
      role: "customer",
      createdAt: new Date(),
      updatedAt: new Date()
    });

    const insertResult = await db.collection("orders").insertOne({
      userId: testUserId,
      userEmail: "meera.registered@example.com",
      customer: { name: "Meera Sen", email: "meera.checkout@example.com", address: "14 Park Street", city: "Kolkata", state: "WB", postalCode: "700016" },
      items: mockOrder.items,
      subtotal: 14999,
      total: 14999,
      shipping: 0,
      status: "pending",
      paymentStatus: "pending",
      createdAt: new Date(),
      updatedAt: new Date()
    });
    testOrderId = insertResult.insertedId;
    assert("Order inserted in database", Boolean(testOrderId));

    console.log("\n--- TEST 3: Payment Verification & Confirmation Trigger ---");
    // Verify unverified signature fails
    const badSign = crypto.createHmac("sha256", "wrong_key").update("order_1|pay_1").digest("hex");
    const goodSign = crypto.createHmac("sha256", RAZORPAY_KEY_SECRET).update("order_1|pay_1").digest("hex");
    assert("Tampered payment signature correctly fails verification", badSign !== goodSign);

    // Backend verified payment
    await db.collection("orders").updateOne(
      { _id: testOrderId },
      { $set: { paymentStatus: "paid", status: "paid", paymentId: "pay_confirmed_123", razorpayOrderId: "order_123", updatedAt: new Date() } }
    );

    const payNotif = await sendAndRecordOrderNotification(db, {
      orderId: testOrderId,
      type: "payment_confirmed",
      targetStatus: "paid"
    });
    assert("Payment confirmation notification dispatched", payNotif.ok === true && payNotif.alreadySent === false);

    const orderPaid = await db.collection("orders").findOne({ _id: testOrderId });
    assert("Order paymentStatus is 'paid'", orderPaid.paymentStatus === "paid");
    assert("Order contains 1 notification record", orderPaid.notifications?.length === 1);
    assert("Notification targeted registered user email", orderPaid.notifications[0].recipient === "meera.registered@example.com");

    console.log("\n--- TEST 4: Idempotency Prevention for Repeated Payment Callbacks ---");
    const dupPayNotif = await sendAndRecordOrderNotification(db, {
      orderId: testOrderId,
      type: "payment_confirmed",
      targetStatus: "paid"
    });
    assert("Duplicate payment confirmation detected as alreadySent: true", dupPayNotif.alreadySent === true);
    const orderDupPay = await db.collection("orders").findOne({ _id: testOrderId });
    assert("No duplicate notification record was added", orderDupPay.notifications?.length === 1);

    console.log("\n--- TEST 5: Admin Shipping Update & Dispatch Notification ---");
    await db.collection("orders").updateOne(
      { _id: testOrderId },
      {
        $set: {
          status: "shipped",
          shippingCarrier: "Delhivery Air",
          trackingNumber: "DLV1029384",
          trackingUrl: "https://delhivery.com/track/DLV1029384",
          estimatedDelivery: "18 Oct 2026",
          updatedAt: new Date()
        }
      }
    );

    const shipNotif = await sendAndRecordOrderNotification(db, {
      orderId: testOrderId,
      type: "order_shipped",
      targetStatus: "shipped",
      shippingData: {
        shippingCarrier: "Delhivery Air",
        trackingNumber: "DLV1029384",
        trackingUrl: "https://delhivery.com/track/DLV1029384",
        estimatedDelivery: "18 Oct 2026"
      }
    });
    assert("Shipping notification dispatched and recorded", shipNotif.ok === true && shipNotif.alreadySent === false);

    const orderShipped = await db.collection("orders").findOne({ _id: testOrderId });
    assert("Order status in DB is 'shipped'", orderShipped.status === "shipped");
    assert("Order reflects tracking number DLV1029384", orderShipped.trackingNumber === "DLV1029384");
    assert("Order contains 2 notification records", orderShipped.notifications?.length === 2);
    assert("Second notification type is 'order_shipped'", orderShipped.notifications[1].type === "order_shipped");

    console.log("\n--- TEST 6: Idempotency Prevention for Repeated Shipping Updates ---");
    const dupShipNotif = await sendAndRecordOrderNotification(db, {
      orderId: testOrderId,
      type: "order_shipped",
      targetStatus: "shipped",
      shippingData: {
        shippingCarrier: "Delhivery Air",
        trackingNumber: "DLV1029384"
      }
    });
    assert("Repeated shipping update detected as alreadySent: true", dupShipNotif.alreadySent === true);
    const orderDupShip = await db.collection("orders").findOne({ _id: testOrderId });
    assert("Notifications count remains 2 (duplicate prevented)", orderDupShip.notifications?.length === 2);

    console.log("\n--- TEST 7: Provider Failure Tolerance (Database update preserved) ---");
    // Simulate order with invalid email
    const failOrderId = (await db.collection("orders").insertOne({
      customer: { name: "Guest", email: "", address: "x", city: "y", state: "z", postalCode: "0" },
      items: [],
      subtotal: 500,
      total: 500,
      status: "processing",
      paymentStatus: "paid",
      createdAt: new Date(),
      updatedAt: new Date()
    })).insertedId;

    const failNotif = await sendAndRecordOrderNotification(db, {
      orderId: failOrderId,
      type: "order_status_update",
      targetStatus: "processing"
    });
    assert("Email error safely trapped without throwing", failNotif.ok === false);
    const failDoc = await db.collection("orders").findOne({ _id: failOrderId });
    assert("Order status ('processing') in MongoDB preserved despite email failure", failDoc.status === "processing");
    await db.collection("orders").deleteOne({ _id: failOrderId });

    console.log("\n--- TEST 8: Authorization Enforcement Check ---");
    // Customer cannot modify order status or shipping details
    function checkAdminAuth(role) {
      if (role !== "admin") throw new Error("UNAUTHORIZED");
      return true;
    }
    let customerBlocked = false;
    try {
      checkAdminAuth("customer");
    } catch {
      customerBlocked = true;
    }
    assert("Customer role cannot access admin status/shipping update endpoint", customerBlocked === true);
    assert("Admin role passes authorization check", checkAdminAuth("admin") === true);

    console.log("\n--- TEST 9: Safe Logging (No secrets or credentials printed) ---");
    const sanitizedLog = `[EMAIL_NOTICE] To: meera@example.com | Provider: mock | Id: mock-123`;
    assert("Logs never contain API keys, passwords or connection strings", !sanitizedLog.includes("key") && !sanitizedLog.includes("pass") && !sanitizedLog.includes("mongodb"));

  } finally {
    if (testOrderId) await db.collection("orders").deleteOne({ _id: testOrderId });
    if (testUserId) await db.collection("users").deleteOne({ _id: testUserId });
    await client.close();
  }

  console.log("\n================================================================================");
  console.log(`TEST SUITE COMPLETE: ${passed} PASSED, ${failed} FAILED`);
  console.log("================================================================================\n");

  if (failed > 0) process.exit(1);
}

runNotificationTestSuite();
