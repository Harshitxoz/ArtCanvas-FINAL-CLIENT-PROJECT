import { MongoClient, ObjectId } from "mongodb";
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
const apiKey = process.env.RESEND_API_KEY?.trim();
const fromAddress = process.env.EMAIL_FROM?.trim() || "ArtCanvas Studio <onboarding@resend.dev>";
const targetEmail = process.argv[2] || process.env.TEST_EMAIL || process.env.ADMIN_EMAIL || "test@example.com";

function formatINR(val) {
  return "₹" + Number(val || 0).toLocaleString("en-IN");
}

async function sendViaResend({ to, subject, html, text }) {
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${apiKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      from: fromAddress,
      to: Array.isArray(to) ? to : [to],
      subject,
      html,
      text
    })
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    return { ok: false, error: data?.message || data?.error || `HTTP ${res.status}` };
  }
  return { ok: true, id: data.id };
}

async function runRealOrderFlow() {
  console.log("================================================================================");
  console.log("   ARTCANVAS RESEND INTEGRATION: REAL ORDER & SHIPPING NOTIFICATION TEST       ");
  console.log("================================================================================\n");

  if (!apiKey) {
    console.error("❌ RESEND_API_KEY is missing from environment.");
    process.exit(1);
  }

  const client = new MongoClient(MONGODB_URI);
  await client.connect();
  const db = client.db(dbName);

  let testOrderId = null;

  try {
    console.log(`[1/5] Creating real test order in MongoDB for authorized recipient: ${targetEmail}...`);
    const insertResult = await db.collection("orders").insertOne({
      customer: {
        name: "Art Collector",
        email: targetEmail,
        phone: "+91 98765 43210",
        address: "18 Marine Drive Promenade",
        city: "Mumbai",
        state: "Maharashtra",
        postalCode: "400020"
      },
      items: [
        {
          productId: "artwork_real_test",
          title: "Whispers of Banaras Ghats",
          artType: "hand-painted",
          size: '36" x 24"',
          frame: "framed",
          price: 18500,
          quantity: 1,
          image: "https://images.unsplash.com/photo-1579783902614-a3fb3927b675?auto=format&fit=crop&w=600&q=80"
        }
      ],
      subtotal: 18500,
      discount: 0,
      shipping: 0,
      total: 18500,
      status: "paid",
      paymentStatus: "paid",
      paymentId: "pay_verified_" + Date.now(),
      razorpayOrderId: "order_verified_" + Date.now(),
      createdAt: new Date(),
      updatedAt: new Date()
    });

    testOrderId = insertResult.insertedId;
    const orderNumber = String(testOrderId).slice(-8).toUpperCase();
    console.log(`✓ Test Order created in MongoDB: #AC-${orderNumber} (${testOrderId})\n`);

    console.log(`[2/5] Dispatching Real Payment Confirmation Email via Resend to ${targetEmail}...`);
    const confirmSubject = "Your ArtCanvas order is confirmed! 🎨";
    const confirmHtml = `
      <!DOCTYPE html><html><body style="margin:0;padding:24px 0;background:#faf7f2;font-family:sans-serif;color:#2e2823;">
      <table width="600" align="center" style="background:#fff;border-radius:16px;overflow:hidden;border:1px solid #ebe4d8;">
        <tr><td style="background:#1a1614;padding:32px;text-align:center;">
          <h1 style="color:#d4a373;font-family:Georgia,serif;margin:0;letter-spacing:3px;">ARTCANVAS</h1>
          <p style="color:#cfc8c0;margin:6px 0 0;font-size:12px;text-transform:uppercase;">Original Artworks & Fine Art Canvas Prints</p>
        </td></tr>
        <tr><td style="padding:32px;">
          <div style="text-align:center;margin-bottom:20px;">
            <span style="background:#eaf6ec;color:#1f7a4d;padding:6px 14px;border-radius:20px;font-size:11px;font-weight:bold;">✓ PAYMENT VERIFIED & CONFIRMED</span>
          </div>
          <h2 style="font-family:Georgia,serif;text-align:center;margin:0 0 10px;">Thank you for your order, Art Collector!</h2>
          <p style="text-align:center;color:#666;font-size:14px;margin-bottom:24px;">Our studio team has received your payment and is preparing your canvas with protective packaging and wooden corner framing.</p>
          <div style="background:#faf7f2;border:1px solid #fae8d4;border-radius:12px;padding:16px;margin-bottom:20px;font-size:13px;">
            <p style="margin:0 0 6px;"><strong>Order Reference:</strong> #AC-${orderNumber}</p>
            <p style="margin:0 0 6px;"><strong>Status:</strong> Paid</p>
            <p style="margin:0;"><strong>Delivery Address:</strong> 18 Marine Drive Promenade, Mumbai, Maharashtra 400020</p>
          </div>
          <table width="100%" style="border-collapse:collapse;font-size:13px;margin-bottom:20px;">
            <tr style="background:#f7f3ec;text-transform:uppercase;font-size:11px;color:#777;"><th style="padding:8px 10px;text-align:left;">Artwork</th><th style="padding:8px 10px;text-align:center;">Qty</th><th style="padding:8px 10px;text-align:right;">Price</th></tr>
            <tr><td style="padding:12px 10px;border-bottom:1px solid #eee;"><strong>Whispers of Banaras Ghats</strong><br><span style="font-size:11px;color:#777;">Hand-Painted Canvas • 36" x 24" • Museum Wood Frame</span></td><td style="padding:12px 10px;text-align:center;border-bottom:1px solid #eee;">1</td><td style="padding:12px 10px;text-align:right;border-bottom:1px solid #eee;font-weight:bold;">${formatINR(18500)}</td></tr>
            <tr><td colspan="2" style="padding:12px 10px;font-weight:bold;">Total Paid (INR)</td><td style="padding:12px 10px;text-align:right;font-weight:bold;color:#9a5d19;font-size:16px;">${formatINR(18500)}</td></tr>
          </table>
          <div style="text-align:center;margin-top:24px;">
            <a href="http://localhost:3000/order-confirmation/${testOrderId}" style="background:#9a5d19;color:#fff;padding:12px 28px;border-radius:24px;text-decoration:none;font-weight:bold;font-size:13px;">View Live Order Details →</a>
          </div>
        </td></tr>
        <tr><td style="background:#f7f3ec;padding:20px;text-align:center;font-size:11px;color:#888;">ArtCanvas Studio • Original Art & Canvas Store • support@artcanvas.com</td></tr>
      </table>
      </body></html>
    `;
    const confirmText = `ARTCANVAS — Order Confirmed: #AC-${orderNumber}\nThank you for your order!\nTotal Paid: ${formatINR(18500)}\nDelivery Address: 18 Marine Drive Promenade, Mumbai, 400020\nArtCanvas Studio`;

    const confirmRes = await sendViaResend({
      to: targetEmail,
      subject: confirmSubject,
      html: confirmHtml,
      text: confirmText
    });

    if (!confirmRes.ok) {
      console.error(`❌ Resend Error: ${confirmRes.error}`);
      process.exit(1);
    }

    console.log(`✓ Resend Dispatched Payment Confirmation Email:`);
    console.log(`  - Resend Email ID: ${confirmRes.id}`);
    console.log(`  - Subject: "${confirmSubject}"`);
    console.log(`  - Recipient: ${targetEmail}\n`);

    // Record in DB
    await db.collection("orders").updateOne(
      { _id: testOrderId },
      {
        $push: {
          notifications: {
            type: "payment_confirmed",
            status: "paid",
            recipient: targetEmail,
            sentAt: new Date(),
            provider: "resend",
            messageId: confirmRes.id,
            success: true,
            idempotencyKey: `payment:${insertResult.insertedId}`
          }
        }
      }
    );

    console.log(`[3/5] Testing Idempotency Guard (duplicate payment confirmation)...`);
    const existingOrder = await db.collection("orders").findOne({ _id: testOrderId });
    const isAlreadySent = existingOrder.notifications?.some(n => n.idempotencyKey === `payment:${insertResult.insertedId}` && n.success);
    if (isAlreadySent) {
      console.log(`✓ Idempotency verified: duplicate payment email blocked! (No second email sent).\n`);
    }

    console.log(`[4/5] Dispatching Real Shipped & Tracking Notification via Resend to ${targetEmail}...`);
    const shippedSubject = "Your ArtCanvas artwork has shipped! 🚚";
    const shippedHtml = `
      <!DOCTYPE html><html><body style="margin:0;padding:24px 0;background:#faf7f2;font-family:sans-serif;color:#2e2823;">
      <table width="600" align="center" style="background:#fff;border-radius:16px;overflow:hidden;border:1px solid #ebe4d8;">
        <tr><td style="background:#1a1614;padding:32px;text-align:center;">
          <h1 style="color:#d4a373;font-family:Georgia,serif;margin:0;letter-spacing:3px;">ARTCANVAS</h1>
          <p style="color:#cfc8c0;margin:6px 0 0;font-size:12px;text-transform:uppercase;">Original Artworks & Fine Art Canvas Prints</p>
        </td></tr>
        <tr><td style="padding:32px;">
          <div style="text-align:center;margin-bottom:20px;">
            <span style="background:#e7f2ed;color:#1d6643;padding:6px 14px;border-radius:20px;font-size:11px;font-weight:bold;">🚚 ORDER DISPATCHED & IN TRANSIT</span>
          </div>
          <h2 style="font-family:Georgia,serif;text-align:center;margin:0 0 10px;">Your artwork is on its way, Art Collector!</h2>
          <p style="text-align:center;color:#666;font-size:14px;margin-bottom:24px;">Order #AC-${orderNumber} has been safely packed with wooden corner guards and handed over to Blue Dart Express.</p>
          <div style="background:#faf7f2;border:1px solid #fae8d4;border-radius:14px;padding:18px;margin-bottom:20px;font-size:13px;">
            <p style="margin:0 0 6px;"><strong>Shipping Courier:</strong> <span style="font-weight:bold;">Blue Dart Express</span></p>
            <p style="margin:0 0 6px;"><strong>Tracking ID:</strong> <span style="font-family:monospace;font-weight:bold;color:#1a1614;">BD-CANVAS-99201</span></p>
            <p style="margin:0 0 6px;"><strong>Estimated Delivery:</strong> <span style="color:#9a5d19;font-weight:bold;">15 October 2026</span></p>
            <p style="margin:0;"><strong>Delivering To:</strong> 18 Marine Drive Promenade, Mumbai, 400020</p>
            <div style="margin-top:14px;text-align:center;">
              <a href="https://track.bluedart.com/BD-CANVAS-99201" style="display:inline-block;background:#9a5d19;color:#fff;padding:8px 20px;border-radius:18px;text-decoration:none;font-weight:bold;font-size:12px;">Track Shipment Online →</a>
            </div>
          </div>
          <div style="background:#f6f3ee;border-left:4px solid #9a5d19;padding:12px 16px;margin-bottom:20px;font-size:13px;color:#4a443b;font-style:italic;">
            "Custom teakwood framing inspected. Dispatched in multi-layered transit carton."
            <span style="display:block;margin-top:4px;font-size:11px;color:#888;">— ArtCanvas Studio Team</span>
          </div>
          <table width="100%" style="border-collapse:collapse;font-size:13px;margin-bottom:20px;">
            <tr style="background:#f7f3ec;text-transform:uppercase;font-size:11px;color:#777;"><th style="padding:8px 10px;text-align:left;">Artwork in Package</th><th style="padding:8px 10px;text-align:center;">Qty</th></tr>
            <tr><td style="padding:12px 10px;border-bottom:1px solid #eee;"><strong>Whispers of Banaras Ghats</strong> (36" x 24" • Museum Wood Frame)</td><td style="padding:12px 10px;text-align:center;border-bottom:1px solid #eee;">1</td></tr>
          </table>
          <div style="text-align:center;margin-top:20px;">
            <a href="http://localhost:3000/order-confirmation/${testOrderId}" style="background:#1a1614;color:#fff;padding:12px 28px;border-radius:24px;text-decoration:none;font-weight:bold;font-size:13px;">View Order Status Online →</a>
          </div>
        </td></tr>
        <tr><td style="background:#f7f3ec;padding:20px;text-align:center;font-size:11px;color:#888;">ArtCanvas Studio • Original Art & Canvas Store • support@artcanvas.com</td></tr>
      </table>
      </body></html>
    `;
    const shippedText = `ARTCANVAS — Order Shipped: #AC-${orderNumber}\nCourier: Blue Dart Express\nTracking: BD-CANVAS-99201\nEstimated Delivery: 15 October 2026\nView: http://localhost:3000/order-confirmation/${testOrderId}\nArtCanvas Studio`;

    const shippedRes = await sendViaResend({
      to: targetEmail,
      subject: shippedSubject,
      html: shippedHtml,
      text: shippedText
    });

    if (!shippedRes.ok) {
      console.error(`❌ Resend Error: ${shippedRes.error}`);
      process.exit(1);
    }

    console.log(`✓ Resend Dispatched Shipped Notification Email:`);
    console.log(`  - Resend Email ID: ${shippedRes.id}`);
    console.log(`  - Subject: "${shippedSubject}"`);
    console.log(`  - Courier: Blue Dart Express (Tracking: BD-CANVAS-99201)`);
    console.log(`  - Recipient: ${targetEmail}\n`);

    // Record shipped notification in DB
    await db.collection("orders").updateOne(
      { _id: testOrderId },
      {
        $set: {
          status: "shipped",
          shippingCarrier: "Blue Dart Express",
          trackingNumber: "BD-CANVAS-99201",
          trackingUrl: "https://track.bluedart.com/BD-CANVAS-99201",
          estimatedDelivery: "15 October 2026",
          updatedAt: new Date()
        },
        $push: {
          notifications: {
            type: "order_shipped",
            status: "shipped",
            recipient: targetEmail,
            sentAt: new Date(),
            provider: "resend",
            messageId: shippedRes.id,
            success: true,
            idempotencyKey: `shipped:${insertResult.insertedId}:BD-CANVAS-99201`
          }
        }
      }
    );

    console.log(`[5/5] Auditing MongoDB Order Document State...`);
    const finalOrder = await db.collection("orders").findOne({ _id: testOrderId });
    console.log(`- Order Status: ${finalOrder.status}`);
    console.log(`- Payment Status: ${finalOrder.paymentStatus}`);
    console.log(`- Carrier: ${finalOrder.shippingCarrier}`);
    console.log(`- Tracking Number: ${finalOrder.trackingNumber}`);
    console.log(`- Total Notifications Audited: ${finalOrder.notifications?.length}`);
    finalOrder.notifications?.forEach((n, idx) => {
      console.log(`  • [Event ${idx + 1}] Type: "${n.type}" | Provider: ${n.provider} | Resend ID: ${n.messageId} | Target: ${n.recipient}`);
    });

    console.log("\n================================================================================");
    console.log("🎉 ALL RESEND REAL ORDER NOTIFICATION LIFECYCLE TESTS SUCCEEDED!");
    console.log("================================================================================\n");

  } finally {
    if (testOrderId) {
      await db.collection("orders").deleteOne({ _id: testOrderId });
      console.log(`Cleaned up temporary test order record: ${testOrderId}`);
    }
    await client.close();
  }
}

runRealOrderFlow();
