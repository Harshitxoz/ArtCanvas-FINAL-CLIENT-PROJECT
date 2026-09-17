import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { getDb } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { productSchema } from "@/lib/validations";

async function ensureIndexes(db: Awaited<ReturnType<typeof getDb>>) {
  try {
    await db.collection("products").createIndexes([
      { key: { slug: 1 }, name: "slug_unique", unique: true },
      { key: { artType: 1, category: 1 } },
      { key: { status: 1, createdAt: -1 } },
      { key: { createdAt: -1 } }
    ]);
  } catch {}
}

export async function GET(req: Request) {
  try {
    const db = await getDb();
    await ensureIndexes(db);
    const products = await db.collection("products").find({}).sort({ createdAt: -1 }).limit(500).toArray();
    return NextResponse.json(products.map(d => ({ ...d, _id: String(d._id) })));
  } catch {
    return NextResponse.json({ error: "Database unavailable." }, { status: 503 });
  }
}

export async function POST(req: Request) {
  try {
    await requireAdmin();
    const parsed = productSchema.safeParse(await req.json());
    if (!parsed.success) return NextResponse.json({ error: "Invalid product data.", details: parsed.error.flatten() }, { status: 400 });
    const db = await getDb();
    await ensureIndexes(db);
    const existing = await db.collection("products").findOne({ slug: parsed.data.slug });
    if (existing) return NextResponse.json({ error: "An artwork with this slug already exists." }, { status: 409 });
    const now = new Date();
    // active is derived from status for backward compatibility with the storefront.
    const active = parsed.data.status === "published" ? (parsed.data.active ?? true) : false;
    const result = await db.collection("products").insertOne({ ...parsed.data, active, createdAt: now, updatedAt: now });
    return NextResponse.json({ id: String(result.insertedId) }, { status: 201 });
  } catch (e) {
    const unauthorized = e instanceof Error && e.message === "UNAUTHORIZED";
    if (!unauthorized) console.error("[PRODUCT_CREATE_ERROR]", e);
    return NextResponse.json({ error: unauthorized ? "Unauthorized" : "Could not create product." }, { status: unauthorized ? 401 : 500 });
  }
}

