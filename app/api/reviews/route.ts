import { NextResponse } from "next/server";
import { ObjectId, type Db } from "mongodb";
import { z } from "zod";
import { getDb } from "@/lib/db";
import { getSession } from "@/lib/auth";
import productsJson from "@/data/products.json";
import type { Review } from "@/types";

const createReviewSchema = z.object({
  productId: z.string().min(1).max(200),
  rating: z.number().int().min(1, "Rating must be at least 1").max(5, "Rating cannot exceed 5"),
  title: z.string().max(120).optional().default(""),
  body: z.string().min(10, "Review must be at least 10 characters").max(2000),
});

interface ReviewDoc {
  _id?: ObjectId;
  productId: string;
  userId?: string | ObjectId | null;
  customerName: string;
  rating: number;
  title?: string;
  body: string;
  approved: boolean;
  verifiedPurchase?: boolean;
  createdAt?: Date;
}

function extractSlug(productId: string): string {
  return productId.startsWith("slug:") ? productId.slice(5) : productId;
}

function getProductIdCandidates(productId: string): string[] {
  const slug = extractSlug(productId);
  return [productId, slug, `slug:${slug}`];
}

function toPublicReview(doc: ReviewDoc): Review {
  return {
    _id: doc._id ? String(doc._id) : "",
    productId: doc.productId,
    customerName: doc.customerName || "Customer",
    rating: doc.rating,
    title: doc.title ?? "",
    body: doc.body,
    approved: doc.approved !== false,
    verifiedPurchase: doc.verifiedPurchase === true,
    createdAt: doc.createdAt instanceof Date ? doc.createdAt.toISOString() : "",
  };
}

async function hasPurchasedProduct(db: Db, userId: string, productId: string): Promise<boolean> {
  if (!ObjectId.isValid(userId)) return false;
  const order = await db.collection("orders").findOne(
    {
      userId: new ObjectId(userId),
      paymentStatus: "paid",
      "items.productId": { $in: getProductIdCandidates(productId) },
    },
    { projection: { _id: 1 } }
  );
  return Boolean(order);
}

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const productId = url.searchParams.get("productId")?.trim() || null;
    const db = await getDb();

    const query = productId
      ? { approved: true, productId }
      : { approved: true };

    const reviews = await db
      .collection<ReviewDoc>("reviews")
      .find(query)
      .sort({ createdAt: -1 })
      .limit(200)
      .toArray();

    // Check verified purchase flags for pending user reviews
    const pendingVerification = reviews.filter(
      (doc) => typeof doc.verifiedPurchase !== "boolean" && doc.userId
    );
    const verifiedUserIds = new Set<string>();

    if (pendingVerification.length > 0) {
      const uniqueUserIds = [
        ...new Set(pendingVerification.map((doc) => String(doc.userId))),
      ]
        .filter((id) => ObjectId.isValid(id))
        .map((id) => new ObjectId(id));

      if (uniqueUserIds.length > 0) {
        const orderQuery: Record<string, unknown> = {
          userId: { $in: uniqueUserIds },
          paymentStatus: "paid",
        };
        if (productId) {
          orderQuery["items.productId"] = { $in: getProductIdCandidates(productId) };
        }

        const paidOrders = await db
          .collection("orders")
          .find(orderQuery)
          .project({ userId: 1 })
          .toArray();

        for (const order of paidOrders) {
          if (order.userId) {
            verifiedUserIds.add(String(order.userId));
          }
        }
      }
    }

    const publicReviews = reviews.map((doc) => {
      const review = toPublicReview(doc);
      if (typeof doc.verifiedPurchase !== "boolean" && doc.userId) {
        review.verifiedPurchase = verifiedUserIds.has(String(doc.userId));
      }
      return review;
    });

    return NextResponse.json(publicReviews);
  } catch (error) {
    console.error("[REVIEWS_GET_ERROR]", error);
    return NextResponse.json({ error: "Database unavailable" }, { status: 503 });
  }
}

export async function POST(req: Request) {
  try {
    const user = await getSession();
    if (!user) {
      return NextResponse.json(
        { error: "Please sign in to write a review." },
        { status: 401 }
      );
    }

    const body = await req.json();
    const parsed = createReviewSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid review. Rating must be 1-5 and review text between 10 and 2000 characters." },
        { status: 400 }
      );
    }

    const { productId, rating, title, body: reviewText } = parsed.data;
    const db = await getDb();
    const slug = extractSlug(productId);

    // Verify artwork exists in DB or product catalog
    let artworkExists = false;
    if (ObjectId.isValid(productId)) {
      artworkExists = Boolean(
        await db.collection("products").findOne({ _id: new ObjectId(productId) }, { projection: { _id: 1 } })
      );
    }
    if (!artworkExists) {
      artworkExists = Boolean(
        await db.collection("products").findOne({ slug }, { projection: { _id: 1 } })
      );
    }
    if (!artworkExists) {
      artworkExists = productsJson.some((item: { slug: string }) => item.slug === slug);
    }
    if (!artworkExists) {
      return NextResponse.json({ error: "Artwork not found." }, { status: 404 });
    }

    // Check duplicate review by same customer
    const existingReview = await db.collection<ReviewDoc>("reviews").findOne({
      productId,
      userId: user.id,
    });
    if (existingReview) {
      return NextResponse.json(
        { error: "You have already reviewed this artwork." },
        { status: 409 }
      );
    }

    const verifiedPurchase = await hasPurchasedProduct(db, user.id, productId);

    const doc: ReviewDoc = {
      productId,
      userId: user.id,
      customerName: user.name,
      rating,
      title: title ?? "",
      body: reviewText,
      approved: false, // Pending admin moderation
      verifiedPurchase,
      createdAt: new Date(),
    };

    const insertResult = await db.collection<ReviewDoc>("reviews").insertOne(doc);

    return NextResponse.json(
      {
        ok: true,
        id: String(insertResult.insertedId),
        message: "Thank you! Your review was submitted and is pending moderation.",
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("[REVIEW_SUBMISSION_ERROR]", error);
    return NextResponse.json({ error: "Could not submit review." }, { status: 500 });
  }
}
