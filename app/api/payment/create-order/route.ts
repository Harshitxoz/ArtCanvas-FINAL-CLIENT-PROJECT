import { NextResponse } from "next/server";

export async function POST() {
  return NextResponse.json(
    { error: "Endpoint disabled. Orders must be created via /api/orders." },
    { status: 404 }
  );
}

