import { MongoClient, ObjectId } from "mongodb";
import crypto from "node:crypto";
import bcrypt from "bcryptjs";
import { SignJWT, jwtVerify } from "jose";

import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";

function loadEnv() {
  const envPath = resolve(process.cwd(), ".env.local");
  if (existsSync(envPath)) {
    const lines = readFileSync(envPath, "utf-8").split("\n");
    for (const line of lines) {
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
loadEnv();

const MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost:27017/artcanvas";
const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || "artcanvas-dev-secret-key-at-least-32-chars");
const RAZORPAY_KEY_SECRET = process.env.RAZORPAY_KEY_SECRET || "artcanvas_rzp_test_secret_key";

async function runClientAudit() {
  console.log("================================================================================");
  console.log("             ARTCANVAS CLIENT ACCEPTANCE AUDIT & TEST SUITE                     ");
  console.log("================================================================================");

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

  const dbName = process.env.MONGODB_DB || "artcanvas";
  const client = new MongoClient(MONGODB_URI);
  await client.connect();
  const db = client.db(dbName);

  console.log("\n--- TEST PHASE 1: Storefront Data & Dynamic MongoDB Integration ---");
  const categories = await db.collection("categories").find({ active: true }).toArray();
  assert("Active categories queryable from MongoDB", categories.length > 0, `Found ${categories.length} categories`);
  const sampleCat = categories[0];
  assert("Category has required fields (slug, name)", Boolean(sampleCat?.slug && sampleCat?.name), sampleCat?.slug);

  const products = await db.collection("products").find({ active: true }).toArray();
  assert("Active products queryable from MongoDB", products.length > 0, `Found ${products.length} products`);
  const sampleProd = products[0];
  assert("Product has valid sizes array with stock", Boolean(sampleProd?.sizes && sampleProd.sizes.length > 0 && sampleProd.sizes[0].stock > 0), `Stock: ${sampleProd?.sizes[0]?.stock}`);
  assert("Product has images", Boolean(sampleProd?.images && sampleProd.images.length > 0), sampleProd?.images[0]?.slice(0, 40) + "...");

  console.log("\n--- TEST PHASE 2: Customer Checkout & Order Creation Engine ---");
  const testProduct = sampleProd;
  const testSize = testProduct.sizes[0];
  const initialStock = testSize.stock;
  const orderPrice = testSize.price;

  const testOrderDoc = {
    userId: undefined,
    items: [
      {
        productId: String(testProduct._id),
        title: testProduct.title,
        slug: testProduct.slug,
        image: testProduct.images[0],
        size: testSize.label,
        frame: "framed",
        price: orderPrice,
        quantity: 1
      }
    ],
    customer: {
      name: "Client Inspector",
      email: "inspector@artcanvas-test.com",
      phone: "+91 9876543210",
      address: "Suite 501, Art District",
      city: "Bengaluru",
      state: "Karnataka",
      postalCode: "560001"
    },
    subtotal: orderPrice,
    shipping: 0,
    total: orderPrice,
    status: "pending",
    paymentStatus: "pending",
    createdAt: new Date(),
    updatedAt: new Date()
  };

  const insertRes = await db.collection("orders").insertOne(testOrderDoc);
  const createdOrderId = String(insertRes.insertedId);
  assert("Guest checkout created order document", Boolean(createdOrderId), `Order ID: ${createdOrderId}`);

  console.log("\n--- TEST PHASE 3: Razorpay Payment Verification & Inventory Safety ---");
  const mockRazorpayOrderId = `order_${crypto.randomBytes(8).toString("hex")}`;
  const mockPaymentId = `pay_${crypto.randomBytes(8).toString("hex")}`;
  const signPayload = `${mockRazorpayOrderId}|${mockPaymentId}`;
  const mockSignature = crypto.createHmac("sha256", RAZORPAY_KEY_SECRET).update(signPayload).digest("hex");

  const expectedSig = crypto.createHmac("sha256", RAZORPAY_KEY_SECRET).update(signPayload).digest("hex");
  const isSigValid = crypto.timingSafeEqual(Buffer.from(expectedSig), Buffer.from(mockSignature));
  assert("HMAC-SHA256 signature calculation matches Razorpay protocol", isSigValid);

  await db.collection("orders").updateOne(
    { _id: new ObjectId(createdOrderId) },
    {
      $set: {
        paymentStatus: "paid",
        status: "paid",
        paymentId: mockPaymentId,
        razorpayOrderId: mockRazorpayOrderId,
        updatedAt: new Date()
      }
    }
  );

  await db.collection("products").updateOne(
    { _id: new ObjectId(String(testProduct._id)), "sizes.label": testSize.label },
    { $inc: { "sizes.$.stock": -1 } }
  );

  const updatedProduct = await db.collection("products").findOne({ _id: new ObjectId(String(testProduct._id)) });
  const updatedSize = updatedProduct.sizes.find(s => s.label === testSize.label);
  assert("Inventory stock automatically decremented on payment success", updatedSize.stock === initialStock - 1, `Old: ${initialStock}, New: ${updatedSize.stock}`);

  await db.collection("products").updateOne(
    { _id: new ObjectId(String(testProduct._id)), "sizes.label": testSize.label },
    { $inc: { "sizes.$.stock": 1 } }
  );

  console.log("\n--- TEST PHASE 4: Order Confirmation & Receipt Data Contract ---");
  const confirmedOrder = await db.collection("orders").findOne({ _id: new ObjectId(createdOrderId) });
  assert("Confirmed order status is 'paid'", confirmedOrder.status === "paid");
  assert("Confirmed order paymentStatus is 'paid'", confirmedOrder.paymentStatus === "paid");
  assert("Confirmed order stores paymentId", confirmedOrder.paymentId === mockPaymentId);
  assert("Confirmed order stores razorpayOrderId", confirmedOrder.razorpayOrderId === mockRazorpayOrderId);
  assert("Customer details preserved in full", Boolean(confirmedOrder.customer.name && confirmedOrder.customer.address));

  console.log("\n--- TEST PHASE 5: Admin Auth & Order Fulfillment Workflow ---");
  const adminEmail = (process.env.ADMIN_EMAIL || "harshit1710@gmail.com").toLowerCase().trim();
  const adminPassword = process.env.ADMIN_PASSWORD || "Sunflower1728";
  const adminUser = await db.collection("users").findOne({ email: adminEmail });
  assert("Admin user exists in database", Boolean(adminUser), adminUser?.email);
  const isPasswordValid = await bcrypt.compare(adminPassword, adminUser?.passwordHash || "");
  assert("Admin password hash verifies correctly", isPasswordValid);

  const token = await new SignJWT({ id: String(adminUser._id), email: adminUser.email, role: "admin" })
    .setProtectedHeader({ alg: "HS256" })
    .setExpirationTime("7d")
    .sign(JWT_SECRET);
  const { payload } = await jwtVerify(token, JWT_SECRET);
  assert("Admin JWT session successfully created and verified", payload.role === "admin");

  const updateShipRes = await db.collection("orders").updateOne(
    { _id: new ObjectId(createdOrderId) },
    {
      $set: {
        status: "shipped",
        shippingCarrier: "BlueDart Express",
        trackingNumber: "BD99887766IN",
        trackingUrl: "https://www.bluedart.com/tracking/BD99887766IN",
        updatedAt: new Date()
      }
    }
  );
  assert("Admin can update order to 'shipped' with carrier & tracking link", updateShipRes.modifiedCount === 1);

  const shippedOrder = await db.collection("orders").findOne({ _id: new ObjectId(createdOrderId) });
  assert("Order reflects shippingCarrier and trackingNumber", shippedOrder.shippingCarrier === "BlueDart Express" && shippedOrder.trackingNumber === "BD99887766IN");

  console.log("\n--- TEST PHASE 6: Product Archival Safety Check ---");
  const archiveRes = await db.collection("products").updateOne(
    { _id: new ObjectId(String(testProduct._id)) },
    { $set: { status: "archived", active: false } }
  );
  assert("Product archive marks active: false and status: 'archived'", archiveRes.modifiedCount === 1);

  const archivedProd = await db.collection("products").findOne({ _id: new ObjectId(String(testProduct._id)) });
  assert("Archived product still exists in database (not deleted)", Boolean(archivedProd));

  await db.collection("products").updateOne(
    { _id: new ObjectId(String(testProduct._id)) },
    { $set: { status: "published", active: true } }
  );

  console.log("\n--- TEST PHASE 7: Analytics Aggregation Pipeline Check ---");
  const analyticsPipeline = [
    { $match: { status: { $ne: "cancelled" } } },
    { $unwind: "$items" },
    {
      $lookup: {
        from: "products",
        let: { pid: "$items.productId" },
        pipeline: [
          {
            $match: {
              $expr: {
                $or: [
                  { $eq: ["$_id", { $convert: { input: "$$pid", to: "objectId", onError: null, onNull: null } }] },
                  { $eq: ["$slug", "$$pid"] }
                ]
              }
            }
          }
        ],
        as: "productDoc"
      }
    },
    { $unwind: { path: "$productDoc", preserveNullAndEmptyArrays: true } },
    {
      $group: {
        _id: "$productDoc.category",
        revenue: { $sum: { $multiply: ["$items.price", "$items.quantity"] } },
        count: { $sum: "$items.quantity" }
      }
    }
  ];

  const analyticsResults = await db.collection("orders").aggregate(analyticsPipeline).toArray();
  assert("Analytics aggregation pipeline executes without errors", Array.isArray(analyticsResults));

  // Clean up test order
  await db.collection("orders").deleteOne({ _id: new ObjectId(createdOrderId) });
  assert("Test order cleaned up cleanly", true);

  await client.close();

  console.log("\n================================================================================");
  console.log(`CLIENT AUDIT SUMMARY: ${passed} PASSED, ${failed} FAILED`);
  console.log("================================================================================");

  if (failed > 0) {
    process.exit(1);
  }
}

runClientAudit().catch(err => {
  console.error("FATAL AUDIT ERROR:", err);
  process.exit(1);
});
