import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { SettingsDocument, defaults, getSettings } from "@/lib/settings";

export async function GET() {
  try {
    return NextResponse.json(await getSettings());
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
