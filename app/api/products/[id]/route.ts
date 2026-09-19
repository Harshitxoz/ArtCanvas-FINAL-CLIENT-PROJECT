import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { getDb } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { productSchema } from "@/lib/validations";
import type { ImageAsset } from "@/types";
import { deleteResource } from "@/lib/cloudinary";

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!ObjectId.isValid(id)) return NextResponse.json({ error: "Invalid id" }, { status: 400 });
  try {
    const db = await getDb();
    const d = await db.collection("products").findOne({ _id: new ObjectId(id) });
    return d ? NextResponse.json({ ...d, _id: String(d._id) }) : NextResponse.json({ error: "Not found" }, { status: 404 });
  } catch {
    return NextResponse.json({ error: "Database unavailable" }, { status: 503 });
  }
}
export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAdmin();
    const { id } = await params;
    if (!ObjectId.isValid(id)) return NextResponse.json({ error: "Invalid id" }, { status: 400 });

    const db = await getDb();
    const _id = new ObjectId(id);

    // Handle image-specific operations
    // NOTE: read the request body ONCE — req.json() can only be consumed a single time.
    const body = await req.json();
    if (body.imageAction) {
      return handleImageAction(db, _id, body);
    }

    // Standard product update
    const parsed = productSchema.partial().safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: "Invalid product data", details: parsed.error.flatten() }, { status: 400 });

    const existing = await db.collection("products").findOne({ _id });
    if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

    if (parsed.data.slug && parsed.data.slug !== existing.slug) {
      const clash = await db.collection("products").findOne({ slug: parsed.data.slug });
      if (clash) return NextResponse.json({ error: "An artwork with this slug already exists." }, { status: 409 });
    }

    const patch = { ...parsed.data } as Record<string, unknown>;
    if (Array.isArray(parsed.data.images)) {
      patch.images = parsed.data.images.map(img => img.url);
      patch.imageAssets = parsed.data.images;
    }
    if (typeof patch.status === "string") {
      if (patch.status === "published") {
        if (patch.active === undefined) patch.active = existing.active ?? true;
      } else {
        patch.active = false;
      }
    }

    await db.collection("products").updateOne({ _id }, { $set: { ...patch, updatedAt: new Date() } });
    return NextResponse.json({ ok: true });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error("[PATCH /api/products/:id] FAILED:", msg, e instanceof Error ? e.stack : undefined);
    if (e instanceof Error && e.message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    // TEMPORARY detailed error for production diagnosis (admin-only route).
    return NextResponse.json({ error: "Could not update product", detail: msg }, { status: 500 });
  }
}

async function handleImageAction(db: Awaited<ReturnType<typeof getDb>>, _id: ObjectId, body: Record<string, unknown>): Promise<NextResponse> {
 try {
  const imageAction = typeof body.imageAction === "string" ? body.imageAction : undefined;
  console.log("[IMAGE_ACTION] productId:", String(_id), "action:", imageAction, "raw imageIndex:", JSON.stringify(body.imageIndex), "(type:", typeof body.imageIndex + ")");

  // Normalize imageIndex: accept number or numeric string (JSON may deliver "0").
  // Number("") is 0, so guard against empty/whitespace strings explicitly.
  let imageIndex: number | undefined;
  const rawIndex = body.imageIndex;
  if (typeof rawIndex === "number") {
    imageIndex = rawIndex;
  } else if (typeof rawIndex === "string" && rawIndex.trim() !== "") {
    const n = Number(rawIndex);
    imageIndex = Number.isNaN(n) ? undefined : n;
  }

  const newOrder = body.newOrder as string[] | undefined;

  const existing = await db.collection("products").findOne({ _id });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // Convert existing images to a workable format
  const currentImages: ImageAsset[] = (existing.images || []).map((url: string) => ({ url }));
  if (Array.isArray(existing.imageAssets) && existing.imageAssets.length > 0) {
    // Merge: use imageAssets if available, fall back to images
    for (let i = 0; i < existing.imageAssets.length; i++) {
      const asset = existing.imageAssets[i];
      if (typeof asset === "object" && asset !== null && "url" in asset) {
        currentImages[i] = { url: (asset as ImageAsset).url, publicId: (asset as ImageAsset).publicId };
      }
    }
  }

  // Temporary server-side logging for the image-removal diagnosis.
  console.log("[REMOVE_IMAGE] received imageIndex:", rawIndex, "(type:", typeof rawIndex + ")");
  console.log("[REMOVE_IMAGE] current images.length:", currentImages.length);
  console.log("[REMOVE_IMAGE] current images:", JSON.stringify(currentImages.map(img => ({ url: img.url, publicId: img.publicId }))));
  console.log("[REMOVE_IMAGE] normalized imageIndex:", imageIndex);

  // Shared validation for actions that require an index.
  const hasValidIndex =
    typeof imageIndex === "number" &&
    Number.isInteger(imageIndex) &&
    imageIndex >= 0 &&
    imageIndex < currentImages.length;

  console.log("[IMAGE_ACTION] normalized imageIndex:", imageIndex, "images.length:", currentImages.length, "hasValidIndex:", hasValidIndex);
  if ((imageAction === "remove" || imageAction === "setPrimary") && !hasValidIndex) {
    return NextResponse.json({ error: "Invalid image index." }, { status: 400 });
  }

  if (imageAction === "remove") {
    if (currentImages.length <= 1) {
      return NextResponse.json({ error: "Cannot remove the only artwork image. Add another image first." }, { status: 400 });
    }
    // hasValidIndex already guarantees a normalized zero-based integer index.
    // Removing index 0 shifts images[1] to images[0], so it automatically becomes Primary.
    const removed = currentImages.splice(imageIndex as number, 1);
    console.log("[REMOVE_IMAGE] removed:", JSON.stringify(removed[0]), "remaining:", currentImages.length, "new primary:", JSON.stringify(currentImages[0]));
    if (removed[0]?.publicId) {
      try {
        await deleteResource(removed[0].publicId);
        console.log("[IMAGE_ACTION] Cloudinary deleted:", removed[0].publicId);
      } catch (e) {
        console.warn("[IMAGE_ACTION] Cloudinary delete skipped/failed:", e instanceof Error ? e.message : String(e));
      }
    } else {
      console.log("[IMAGE_ACTION] No publicId; skipping Cloudinary delete.");
    }
  } else if (imageAction === "setPrimary") {
    if (imageIndex === 0) {
      return NextResponse.json({ ok: true, message: "Image is already primary." });
    }
    // Move selected image to front
    const [primary] = currentImages.splice(imageIndex as number, 1);
    currentImages.unshift(primary);
  } else if (imageAction === "reorder" && Array.isArray(newOrder)) {
    // Validate new order contains all current URLs
    const currentUrls = currentImages.map(img => img.url);
    const newUrls = newOrder.map((url: string | { url?: string }) => typeof url === "string" ? url : (url as { url?: string }).url).filter((u: string | undefined): u is string => Boolean(u));
    if (newUrls.length !== currentUrls.length || !newUrls.every(url => currentUrls.includes(url))) {
      return NextResponse.json({ error: "Invalid reorder data." }, { status: 400 });
    }
    // Reorder images
    const reordered: ImageAsset[] = [];
    for (const url of newUrls) {
      const found = currentImages.find(img => img.url === url);
      if (found) reordered.push(found);
    }
    currentImages.length = 0;
    currentImages.push(...reordered);
  } else {
    return NextResponse.json({ error: "Invalid image action." }, { status: 400 });
  }

  // Save updated images - store both legacy format and structured format
  const urls = currentImages.map(img => img.url);
  const imageAssets: ImageAsset[] = currentImages.map(img => ({
    url: img.url,
    publicId: img.publicId
  }));

  console.log("[IMAGE_ACTION] images after:", JSON.stringify(urls), "count:", urls.length);
  const updateResult = await db.collection("products").updateOne(
    { _id },
    {
      $set: {
        images: urls,
        imageAssets: imageAssets,
        updatedAt: new Date()
      }
    }
  );
  console.log("[IMAGE_ACTION] MongoDB update result:", JSON.stringify({ matchedCount: updateResult.matchedCount, modifiedCount: updateResult.modifiedCount, acknowledged: updateResult.acknowledged }));
  if (updateResult.matchedCount === 0) {
    return NextResponse.json({ error: "Product not found during update." }, { status: 404 });
  }

  return NextResponse.json({ ok: true, message: "Image updated successfully." });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error("[IMAGE_ACTION] FAILED productId:", String(_id), "action:", String(body.imageAction), "rawIndex:", JSON.stringify(body.imageIndex), "error:", msg, e instanceof Error ? e.stack : "");
    // TEMPORARY detailed error for production diagnosis (admin-only route).
    return NextResponse.json({ error: "Could not update product", detail: msg }, { status: 500 });
  }
}

export async function DELETE(_: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAdmin();
    const { id } = await params;
    if (!ObjectId.isValid(id)) return NextResponse.json({ error: "Invalid id" }, { status: 400 });

    const db = await getDb();

    // Check if product has any orders
    const orderCount = await db.collection("orders").countDocuments({ "items.productId": id });

    if (orderCount > 0) {
      // Cannot permanently delete - has orders
      return NextResponse.json(
        {
          error: "has_orders",
          message: `This artwork is referenced by ${orderCount} order(s). Archive it instead to preserve order history.`,
          orderCount
        },
        { status: 409 }
      );
    }

    // Get product to check for Cloudinary images with publicId
    const product = await db.collection("products").findOne({ _id: new ObjectId(id) });
    if (!product) return NextResponse.json({ error: "Not found" }, { status: 404 });

    // Collect publicIds for safe Cloudinary deletion
    const publicIdsToDelete: string[] = [];

    // Check imageAssets for publicIds
    if (Array.isArray(product.imageAssets)) {
      for (const asset of product.imageAssets) {
        if (typeof asset === "object" && asset !== null && "publicId" in asset && asset.publicId) {
          publicIdsToDelete.push(asset.publicId as string);
        }
      }
    }

    // Delete from MongoDB
    await db.collection("products").deleteOne({ _id: new ObjectId(id) });

    // Safely delete Cloudinary resources with publicId
    let cloudinaryDeleteError: string | null = null;
    for (const publicId of publicIdsToDelete) {
      try {
        await deleteResource(publicId);
      } catch (e) {
        console.error(`[CLOUDINARY_DELETE_ERROR] Failed to delete ${publicId}:`, e);
        cloudinaryDeleteError = cloudinaryDeleteError
          ? `${cloudinaryDeleteError}; ${publicId}`
          : publicId;
      }
    }

    return NextResponse.json({
      ok: true,
      deleted: true,
      message: cloudinaryDeleteError
        ? `Artwork permanently deleted. Note: ${cloudinaryDeleteError} could not be deleted from Cloudinary.`
        : "Artwork permanently deleted.",
      deletedImages: publicIdsToDelete.length,
      failedImageDeletions: cloudinaryDeleteError ? publicIdsToDelete.filter(id => cloudinaryDeleteError!.includes(id)) : []
    });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error && e.message === "UNAUTHORIZED" ? "Unauthorized" : "Could not delete product" },
      { status: e instanceof Error && e.message === "UNAUTHORIZED" ? 401 : 500 }
    );
  }
}
