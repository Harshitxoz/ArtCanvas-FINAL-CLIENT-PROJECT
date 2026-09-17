import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";

type SettingsDocument = {
  _id: string;
  storeName: string;
  tagline: string;
  email: string;
  phone: string;
  whatsapp: string;
  currency: string;
  freeShippingThreshold: number;
  shippingFee: number;
  instagram: string;
  address: string;
  announcement: string;
  headline: string;
  subheadline: string;
  heroImageUrl: string;
  updatedAt?: Date;
};

const defaults: Omit<SettingsDocument, "_id"> = {
  storeName: "ArtCanvas",
  tagline: "Original art, made to be remembered",
  email: "",
  phone: "",
  whatsapp: "",
  currency: "INR",
  freeShippingThreshold: 999,
  shippingFee: 99,
  instagram: "",
  address: "",
  announcement: "",
  headline: "Bring Art Into Your Life",
  subheadline:
    "Discover original hand-painted canvases and premium prints that make your space feel like yours.",
  heroImageUrl: "",
};

export async function GET() {
  try {
    const db = await getDb();
    const d = await db
      .collection<SettingsDocument>("settings")
      .findOne({ _id: "store" });
    return NextResponse.json({ ...defaults, ...(d || {}) });
  } catch {
    return NextResponse.json(defaults);
  }
}

export async function PATCH(req: Request) {
  try {
    await requireAdmin();
    const body: Partial<SettingsDocument> = await req.json();
    const safe: Partial<SettingsDocument> = { ...defaults, ...body };
    delete safe._id;
    safe.updatedAt = new Date();
    await (
      await getDb()
    )
      .collection<SettingsDocument>("settings")
      .updateOne({ _id: "store" }, { $set: safe }, { upsert: true });
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json(
      {
        error:
          e instanceof Error && e.message === "UNAUTHORIZED"
            ? "Unauthorized"
            : "Could not save settings",
      },
      { status: 500 }
    );
  }
}
