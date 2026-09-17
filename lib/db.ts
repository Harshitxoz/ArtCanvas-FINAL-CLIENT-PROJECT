import { MongoClient, ServerApiVersion, Db } from "mongodb";

const uri = process.env.MONGODB_URI;
if (!uri) {
  // Do not throw at import time so the UI can still render with JSON fallback.
  console.warn("MONGODB_URI is not configured. Database-backed features will be unavailable.");
}

declare global {
  // eslint-disable-next-line no-var
  var __artcanvasMongoClient: MongoClient | undefined;
}

const client = global.__artcanvasMongoClient ?? (uri ? new MongoClient(uri, {
  serverApi: { version: ServerApiVersion.v1, strict: true, deprecationErrors: true }
}) : undefined);

if (process.env.NODE_ENV !== "production" && client) {
  global.__artcanvasMongoClient = client;
}

export async function getDb(): Promise<Db> {
  if (!client) throw new Error("MongoDB is not configured.");
  await client.connect();
  return client.db(process.env.MONGODB_DB || "artcanvas");
}
