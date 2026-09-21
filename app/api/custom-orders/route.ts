import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { getSession, requireAdmin } from "@/lib/auth";
import { customOrderRequestSchema } from "@/lib/validations";

export async function GET() {
  try {
    await requireAdmin();
    const db = await getDb();
    const customOrders = await db
      .collection("customOrders")
      .find({})
      .sort({ createdAt: -1 })
      .limit(500)
      .toArray();

    return NextResponse.json(customOrders.map((doc) => ({ ...doc, _id: String(doc._id) })));
  } catch (error) {
    const isUnauthorized = error instanceof Error && error.message === "UNAUTHORIZED";
    return NextResponse.json(
      { error: isUnauthorized ? "Unauthorized" : "Database unavailable" },
      { status: isUnauthorized ? 401 : 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const parsed = customOrderRequestSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid custom artwork request", details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const session = await getSession();
    const db = await getDb();
    const now = new Date();

    const doc = {
      ...parsed.data,
      userId: session?.id || null,
      status: "new",
      adminNotes: "",
      createdAt: now,
      updatedAt: now,
    };

    const result = await db.collection("customOrders").insertOne(doc);

    return NextResponse.json({ ok: true, id: String(result.insertedId) }, { status: 201 });
  } catch (error) {
    console.error("[CUSTOM_ORDER_SUBMIT_ERROR]", error);
    return NextResponse.json(
      { error: "Could not submit custom artwork request. Please try again." },
      { status: 500 }
    );
  }
}
