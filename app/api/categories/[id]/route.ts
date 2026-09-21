import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { z } from "zod";
import { getDb } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";

const categoryUpdateSchema = z.object({
  name: z.string().min(2).max(80),
  slug: z.string().min(2).max(100).regex(/^[a-z0-9-]+$/),
  description: z.string().max(500),
  image: z.string().max(1000),
  active: z.boolean(),
}).partial();

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function PATCH(req: Request, { params }: RouteParams) {
  try {
    await requireAdmin();
    const { id } = await params;

    if (!ObjectId.isValid(id)) {
      return NextResponse.json({ error: "Invalid category ID" }, { status: 400 });
    }

    const body = await req.json();
    const parsed = categoryUpdateSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid category update data", details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const db = await getDb();
    const result = await db.collection("categories").updateOne(
      { _id: new ObjectId(id) },
      { $set: { ...parsed.data, updatedAt: new Date() } }
    );

    if (result.matchedCount === 0) {
      return NextResponse.json({ error: "Category not found" }, { status: 404 });
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    const isUnauthorized = error instanceof Error && error.message === "UNAUTHORIZED";
    return NextResponse.json(
      { error: isUnauthorized ? "Unauthorized" : "Could not update category" },
      { status: isUnauthorized ? 401 : 500 }
    );
  }
}

export async function DELETE(_req: Request, { params }: RouteParams) {
  try {
    await requireAdmin();
    const { id } = await params;

    if (!ObjectId.isValid(id)) {
      return NextResponse.json({ error: "Invalid category ID" }, { status: 400 });
    }

    const db = await getDb();
    const category = await db.collection("categories").findOne({ _id: new ObjectId(id) });

    if (!category) {
      return NextResponse.json({ error: "Category not found" }, { status: 404 });
    }

    const productCount = await db.collection("products").countDocuments({
      category: String(category.slug),
    });

    if (productCount > 0) {
      return NextResponse.json(
        {
          error: "This category contains artworks. Reassign or delete those artworks before removing this category.",
          hasProducts: true,
          productCount,
        },
        { status: 409 }
      );
    }

    await db.collection("categories").deleteOne({ _id: new ObjectId(id) });

    return NextResponse.json({ ok: true });
  } catch (error) {
    const isUnauthorized = error instanceof Error && error.message === "UNAUTHORIZED";
    return NextResponse.json(
      { error: isUnauthorized ? "Unauthorized" : "Could not delete category" },
      { status: isUnauthorized ? 401 : 500 }
    );
  }
}
