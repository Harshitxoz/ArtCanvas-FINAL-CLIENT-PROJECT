import { MongoClient } from "mongodb";
import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";

function loadEnv() {
  const envPath = resolve(process.cwd(), ".env.local");
  if (existsSync(envPath)) {
    const lines = readFileSync(envPath, "utf-8").split("\n");
    for (const line of lines) {
      const idx = line.indexOf("=");
      if (idx > 0) {
        const k = line.slice(0, idx).trim();
        const v = line.slice(idx + 1).trim().replace(/^['"]|['"]$/g, "");
        if (!process.env[k]) process.env[k] = v;
      }
    }
  }
}

loadEnv();

async function run() {
  const uri = process.env.MONGODB_URI;
  const dbName = process.env.MONGODB_DB || "artcanvas";
  const client = new MongoClient(uri);
  await client.connect();
  const db = client.db(dbName);

  const prods = await db.collection("products").find({}).toArray();
  let cleaned = 0;

  for (const p of prods) {
    let needsUpdate = false;
    const newImages = (p.images || []).map((img) => {
      if (typeof img === "object" && img !== null) {
        needsUpdate = true;
        let u = img.url;
        while (u && typeof u === "object") u = u.url;
        return typeof u === "string" ? u : "";
      }
      return typeof img === "string" ? img : "";
    }).filter(Boolean);

    const newAssets = (p.imageAssets || []).map((a) => {
      if (!a) return null;
      if (typeof a.url === "object" && a.url !== null) {
        needsUpdate = true;
        let u = a.url;
        while (u && typeof u === "object") u = u.url;
        return { url: typeof u === "string" ? u : "", publicId: a.publicId || undefined };
      }
      if (typeof a === "string") {
        needsUpdate = true;
        return { url: a };
      }
      return a;
    }).filter((a) => Boolean(a?.url));

    if (needsUpdate) {
      await db.collection("products").updateOne(
        { _id: p._id },
        { $set: { images: newImages, imageAssets: newAssets } }
      );
      cleaned++;
      console.log("Cleaned image data for artwork:", p.title, p._id);
    }
  }

  console.log("Sanitization complete. Total artworks cleaned:", cleaned);
  await client.close();
}

run().catch(console.error);
