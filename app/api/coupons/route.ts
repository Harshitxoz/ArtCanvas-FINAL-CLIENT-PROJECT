import { NextResponse } from "next/server";
import { z } from "zod";
import { getDb } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";

const couponSchema = z.object({
  code: z
    .string()
    .min(3, "Code must be at least 3 characters")
    .max(30)
    .regex(/^[A-Za-z0-9_-]+$/, "Code must contain only letters, numbers, hyphens, and underscores"),
  type: z.enum(["percentage", "fixed"]),
  value: z.number().positive("Discount value must be positive"),
  active: z.boolean().default(true),
  expiresAt: z.string().optional().or(z.literal("")),
  usageLimit: z.number().int().positive().optional(),
});

export async function GET() {
  try {
    await requireAdmin();
    const db = await getDb();
    const coupons = await db
      .collection("coupons")
      .find({})
      .sort({ createdAt: -1 })
      .toArray();

    return NextResponse.json(coupons.map((doc) => ({ ...doc, _id: String(doc._id) })));
  } catch (error) {
    const isUnauthorized = error instanceof Error && error.message === "UNAUTHORIZED";
    return NextResponse.json(
      { error: isUnauthorized ? "Unauthorized" : "Database unavailable" },
      { status: isUnauthorized ? 401 : 503 }
    );
  }
}

export async function POST(req: Request) {
  try {
    await requireAdmin();
    const body = await req.json();
    const parsed = couponSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid coupon data", details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { code: rawCode, type, value, active, expiresAt, usageLimit } = parsed.data;
    const code = rawCode.toUpperCase();

    if (type === "percentage" && value > 100) {
      return NextResponse.json(
        { error: "Percentage discount cannot exceed 100%" },
        { status: 400 }
      );
    }

    const db = await getDb();
    const existing = await db.collection("coupons").findOne({ code });

    if (existing) {
      return NextResponse.json(
        { error: "A coupon with this code already exists" },
        { status: 409 }
      );
    }

    const now = new Date();
    const result = await db.collection("coupons").insertOne({
      code,
      type,
      value,
      active,
      expiresAt: expiresAt ? new Date(expiresAt) : undefined,
      usageLimit,
      usedCount: 0,
      createdAt: now,
      updatedAt: now,
    });

    return NextResponse.json({ ok: true, id: String(result.insertedId) }, { status: 201 });
  } catch (error) {
    const isUnauthorized = error instanceof Error && error.message === "UNAUTHORIZED";
    return NextResponse.json(
      { error: isUnauthorized ? "Unauthorized" : "Could not create coupon" },
      { status: isUnauthorized ? 401 : 500 }
    );
  }
}
