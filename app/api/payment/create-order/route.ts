import { NextResponse } from "next/server";
import { getRazorpay } from "@/lib/razorpay";

export async function POST(req: Request) {
  try {
    const { amount, receipt } = await req.json();

    if (!Number.isInteger(amount) || amount <= 0) {
      return NextResponse.json({ error: "Invalid payment amount" }, { status: 400 });
    }

    const razorpay = getRazorpay();
    const order = await razorpay.orders.create({
      amount,
      currency: "INR",
      receipt: String(receipt),
    });

    return NextResponse.json(order);
  } catch (error) {
    console.error("[RAZORPAY_CREATE_ORDER_ERROR]", error);
    return NextResponse.json(
      { error: "Payment gateway is not configured or unavailable." },
      { status: 503 }
    );
  }
}
