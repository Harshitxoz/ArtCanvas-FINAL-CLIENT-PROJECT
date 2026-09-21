import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { getDb } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { customOrderStatusSchema } from "@/lib/validations";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function PATCH(req: Request, { params }: RouteParams) {
  try {
    await requireAdmin();
    const { id } = await params;

    if (!ObjectId.isValid(id)) {
      return NextResponse.json({ error: "Invalid custom order ID" }, { status: 400 });
    }

    const body = await req.json();
    const parsed = customOrderStatusSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid status or notes", details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const db = await getDb();
    const result = await db.collection("customOrders").updateOne(
      { _id: new ObjectId(id) },
      {
        $set: {
          ...parsed.data,
          updatedAt: new Date(),
        },
      }
    );

    if (result.matchedCount === 0) {
      return NextResponse.json({ error: "Custom order not found" }, { status: 404 });
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    const isUnauthorized = error instanceof Error && error.message === "UNAUTHORIZED";
    return NextResponse.json(
      { error: isUnauthorized ? "Unauthorized" : "Could not update custom order request" },
      { status: isUnauthorized ? 401 : 500 }
    );
  }
}
