import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { getDb } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function PATCH(req: Request, { params }: RouteParams) {
  try {
    await requireAdmin();
    const { id } = await params;

    if (!ObjectId.isValid(id)) {
      return NextResponse.json({ error: "Invalid coupon ID" }, { status: 400 });
    }

    const body = await req.json();
    const updateData: Record<string, unknown> = { ...body };

    if (updateData.expiresAt) {
      updateData.expiresAt = new Date(updateData.expiresAt as string);
    }
    updateData.updatedAt = new Date();
    delete updateData._id;

    const db = await getDb();
    const result = await db.collection("coupons").updateOne(
      { _id: new ObjectId(id) },
      { $set: updateData }
    );

    if (result.matchedCount === 0) {
      return NextResponse.json({ error: "Coupon not found" }, { status: 404 });
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    const isUnauthorized = error instanceof Error && error.message === "UNAUTHORIZED";
    return NextResponse.json(
      { error: isUnauthorized ? "Unauthorized" : "Could not update coupon" },
      { status: isUnauthorized ? 401 : 500 }
    );
  }
}

export async function DELETE(_req: Request, { params }: RouteParams) {
  try {
    await requireAdmin();
    const { id } = await params;

    if (!ObjectId.isValid(id)) {
      return NextResponse.json({ error: "Invalid coupon ID" }, { status: 400 });
    }

    const db = await getDb();
    const result = await db.collection("coupons").deleteOne({ _id: new ObjectId(id) });

    if (result.deletedCount === 0) {
      return NextResponse.json({ error: "Coupon not found" }, { status: 404 });
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    const isUnauthorized = error instanceof Error && error.message === "UNAUTHORIZED";
    return NextResponse.json(
      { error: isUnauthorized ? "Unauthorized" : "Could not delete coupon" },
      { status: isUnauthorized ? 401 : 500 }
    );
  }
}
