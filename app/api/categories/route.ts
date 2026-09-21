import { NextResponse } from "next/server";
import { z } from "zod";
import { getDb } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";

const categorySchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").max(80),
  slug: z
    .string()
    .min(2, "Slug must be at least 2 characters")
    .max(100)
    .regex(/^[a-z0-9-]+$/, "Slug can only contain lowercase letters, numbers, and hyphens"),
  description: z.string().max(500).default(""),
  image: z.string().max(1000).default(""),
  active: z.boolean().default(true),
});

export async function GET() {
  try {
    const db = await getDb();
    const categories = await db
      .collection("categories")
      .find({})
      .sort({ name: 1 })
      .toArray();

    return NextResponse.json(categories.map((doc) => ({ ...doc, _id: String(doc._id) })));
  } catch (error) {
    console.error("[CATEGORIES_GET_ERROR]", error);
    return NextResponse.json({ error: "Database unavailable" }, { status: 503 });
  }
}

export async function POST(req: Request) {
  try {
    await requireAdmin();
    const body = await req.json();
    const parsed = categorySchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid category data", details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { name, slug, description, image, active } = parsed.data;
    const db = await getDb();

    const existing = await db.collection("categories").findOne({
      $or: [{ slug }, { name }],
    });

    if (existing) {
      return NextResponse.json(
        { error: "A category with this name or slug already exists" },
        { status: 409 }
      );
    }

    const now = new Date();
    const result = await db.collection("categories").insertOne({
      name,
      slug,
      description,
      image,
      active,
      createdAt: now,
      updatedAt: now,
    });

    return NextResponse.json({ ok: true, id: String(result.insertedId) }, { status: 201 });
  } catch (error) {
    const isUnauthorized = error instanceof Error && error.message === "UNAUTHORIZED";
    return NextResponse.json(
      { error: isUnauthorized ? "Unauthorized" : "Could not create category" },
      { status: isUnauthorized ? 401 : 500 }
    );
  }
}
