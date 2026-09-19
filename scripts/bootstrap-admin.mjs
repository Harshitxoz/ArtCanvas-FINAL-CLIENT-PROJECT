#!/usr/bin/env node
import { MongoClient } from "mongodb";
import bcrypt from "bcryptjs";
import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";

// Load .env.local if present and not already loaded by environment
function loadEnv() {
  const envPath = resolve(process.cwd(), ".env.local");
  if (existsSync(envPath)) {
    const lines = readFileSync(envPath, "utf-8").split("\n");
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const idx = trimmed.indexOf("=");
      if (idx > 0) {
        const key = trimmed.slice(0, idx).trim();
        const value = trimmed.slice(idx + 1).trim().replace(/^['"]|['"]$/g, "");
        if (!process.env[key]) {
          process.env[key] = value;
        }
      }
    }
  }
}

loadEnv();

const uri = process.env.MONGODB_URI;
if (!uri) {
  console.error("❌ ERROR: MONGODB_URI is not set in environment or .env.local");
  process.exit(1);
}

const dbName = process.env.MONGODB_DB || "artcanvas";
const adminEmail = (process.env.ADMIN_EMAIL || "admin@example.com").toLowerCase().trim();
const adminPassword = process.env.ADMIN_PASSWORD || "ChangeMe123!";
const adminName = process.env.ADMIN_NAME || "Store Admin";

console.log("--------------------------------------------------");
console.log("ArtCanvas Admin Account Bootstrap");
console.log("--------------------------------------------------");
console.log(`Database: ${dbName}`);
console.log(`Admin Email: ${adminEmail}`);

async function run() {
  const client = new MongoClient(uri);
  try {
    await client.connect();
    const db = client.db(dbName);
    const users = db.collection("users");

    console.log("Generating secure password hash (cost factor 12)...");
    const passwordHash = await bcrypt.hash(adminPassword, 12);
    const now = new Date();

    const result = await users.updateOne(
      { email: adminEmail },
      {
        $set: {
          name: adminName,
          email: adminEmail,
          passwordHash,
          role: "admin",
          updatedAt: now
        },
        $setOnInsert: {
          createdAt: now
        }
      },
      { upsert: true }
    );

    console.log("✅ Admin user successfully bootstrapped!");
    console.log(`Matched: ${result.matchedCount}, Upserted: ${result.upsertedCount}`);
    console.log("");
    console.log("Credentials:");
    console.log(`Email:    ${adminEmail}`);
    console.log(`Password: ${adminPassword}`);
    console.log("--------------------------------------------------");
    console.log("👉 You can now log in at /login and access /admin");
  } catch (error) {
    console.error("❌ Failed to bootstrap admin:", error instanceof Error ? error.message : error);
    process.exit(1);
  } finally {
    await client.close();
  }
}

run();
