import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { uploadBuffer, type UploadResult } from "@/lib/cloudinary";
import { MAX_UPLOAD_MB } from "@/lib/constants";

export async function POST(req: Request) {
  try {
    await requireAdmin();
    const form = await req.formData();
    const file = form.get("file");
    if (!(file instanceof File)) return NextResponse.json({ error: "No file provided." }, { status: 400 });
    if (!file.type.startsWith("image/")) return NextResponse.json({ error: "Only image files are allowed." }, { status: 400 });
    if (file.size > MAX_UPLOAD_MB * 1024 * 1024) return NextResponse.json({ error: `Maximum file size is ${MAX_UPLOAD_MB}MB.` }, { status: 413 });
    const result: UploadResult = await uploadBuffer(Buffer.from(await file.arrayBuffer()));
    return NextResponse.json(result);
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error && e.message === "UNAUTHORIZED" ? "Unauthorized" : e instanceof Error ? e.message : "Upload failed." },
      { status: e instanceof Error && e.message === "UNAUTHORIZED" ? 401 : 500 }
    );
  }
}
