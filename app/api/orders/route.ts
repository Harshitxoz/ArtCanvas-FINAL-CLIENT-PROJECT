import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { getDb } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { orderSchema } from "@/lib/validations";
import { getSettings } from "@/lib/settings";
import { getRazorpay } from "@/lib/razorpay";
import type { CartItem } from "@/types";

interface ProductDocument {
  _id: ObjectId;
  title: string;
  slug: string;
  images: string[];
  sizes: { label: string; price: number; stock: number }[];
  frameAvailable?: boolean;
  framedPrice?: number;
  unframedPrice?: number;
}

const ERROR_MESSAGES: Record<string, { message: string; status: number }> = {
  OUT_OF_STOCK: { message: "One or more selected sizes are out of stock.", status: 409 },
  PRODUCT_NOT_FOUND: { message: "A selected artwork is no longer available.", status: 409 },
  FRAME_UNAVAILABLE: { message: "Framing is not available for a selected artwork.", status: 409 },
  COUPON_INVALID: { message: "That coupon code is not valid.", status: 409 },
  COUPON_EXPIRED: { message: "That coupon has expired.", status: 409 },
  COUPON_LIMIT: { message: "That coupon has reached its maximum usage limit.", status: 409 },
  MONGODB_UNAVAILABLE: { message: "Database is not configured. Please contact support.", status: 503 },
};

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const parsed = orderSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid order data.", details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const session = await getSession();
    const db = await getDb();

    // 1. Fetch products from database
    const productObjectIds = parsed.data.items
      .map((item) => item.productId)
      .filter((id) => ObjectId.isValid(id))
      .map((id) => new ObjectId(id));

    const rawProducts = await db
      .collection("products")
      .find({ _id: { $in: productObjectIds }, active: true })
      .toArray();

    const productMap = new Map<string, ProductDocument>(
      rawProducts.map((p) => [String(p._id), p as unknown as ProductDocument])
    );

    // 2. Validate items, stock, and calculate accurate pricing
    const orderItems: CartItem[] = parsed.data.items.map((item) => {
      const product = productMap.get(item.productId);
      if (!product) {
        throw new Error("PRODUCT_NOT_FOUND");
      }

      const matchingSize = product.sizes.find((s) => s.label === item.size);
      if (!matchingSize || (matchingSize.stock || 0) < item.quantity) {
        throw new Error("OUT_OF_STOCK");
      }

      const isFramed = item.frame === "framed";
      if (isFramed && product.frameAvailable !== true) {
        throw new Error("FRAME_UNAVAILABLE");
      }

      const framingDelta = isFramed
        ? Math.max(0, Number(product.framedPrice || 0) - Number(product.unframedPrice || 0))
        : 0;

      const unitPrice = matchingSize.price + framingDelta;

      return {
        productId: item.productId,
        title: product.title,
        slug: product.slug,
        image: product.images[0] || "",
        size: matchingSize.label,
        frame: isFramed ? "framed" : "unframed",
        price: unitPrice,
        quantity: item.quantity,
      };
    });

    const subtotal = orderItems.reduce((acc, item) => acc + item.price * item.quantity, 0);

    // 3. Validate coupon code if applied
    let discount = 0;
    let appliedCouponCode = "";

    if (parsed.data.couponCode) {
      const code = parsed.data.couponCode.trim().toUpperCase();
      const couponDoc = await db.collection("coupons").findOne({ code, active: true });

      if (!couponDoc) {
        throw new Error("COUPON_INVALID");
      }
      if (couponDoc.expiresAt && new Date(couponDoc.expiresAt) <= new Date()) {
        throw new Error("COUPON_EXPIRED");
      }
      if (couponDoc.usageLimit && Number(couponDoc.usedCount || 0) >= Number(couponDoc.usageLimit)) {
        throw new Error("COUPON_LIMIT");
      }

      discount =
        couponDoc.type === "percentage"
          ? Math.min(subtotal, (subtotal * Number(couponDoc.value)) / 100)
          : Math.min(subtotal, Number(couponDoc.value));

      appliedCouponCode = code;
    }

    // 4. Calculate shipping based on store settings
    const settings = await getSettings();
    const discountedSubtotal = Math.max(0, subtotal - discount);
    const freeThreshold = Number(settings.freeShippingThreshold) || 999;
    const shippingFee = Number(settings.shippingFee) || 99;
    const shipping = discountedSubtotal >= freeThreshold ? 0 : shippingFee;
    const total = discountedSubtotal + shipping;

    const now = new Date();

    // 5. Create pending order document
    const insertResult = await db.collection("orders").insertOne({
      userId: session ? new ObjectId(session.id) : undefined,
      items: orderItems,
      customer: parsed.data.customer,
      subtotal,
      discount,
      couponCode: appliedCouponCode || undefined,
      shipping,
      total,
      status: "pending",
      paymentStatus: "pending",
      createdAt: now,
      updatedAt: now,
    });

    const orderId = String(insertResult.insertedId);

    // 6. Generate Razorpay order for online payment
    let payment = null;
    try {
      const razorpay = getRazorpay();
      payment = await razorpay.orders.create({
        amount: Math.round(total * 100), // Razorpay accepts amount in paise
        currency: "INR",
        receipt: orderId,
      });
    } catch (paymentError) {
      console.error(
        "[RAZORPAY_ORDER_CREATE_ERROR]",
        paymentError instanceof Error ? paymentError.message : paymentError
      );
    }

    return NextResponse.json({
      orderId,
      payment,
      keyId: process.env.RAZORPAY_KEY_ID || process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
    });
  } catch (error) {
    console.error("[ORDER_CREATE_ERROR]", error);

    const errorMessage = error instanceof Error ? error.message : "ORDER_FAILED";
    const mapped = ERROR_MESSAGES[errorMessage];

    if (mapped) {
      return NextResponse.json({ error: mapped.message }, { status: mapped.status });
    }

    return NextResponse.json({ error: "Could not create order. Please try again." }, { status: 500 });
  }
}
