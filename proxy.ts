import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";

const secret = new TextEncoder().encode(process.env.AUTH_SECRET || "development-only-secret-change-me");

export async function proxy(request: NextRequest) {
  if (!request.nextUrl.pathname.startsWith("/admin")) return NextResponse.next();
  const token = request.cookies.get("artcanvas_session")?.value;
  if (!token) return NextResponse.redirect(new URL("/login", request.url));
  try {
    const { payload } = await jwtVerify(token, secret);
    if (payload.role !== "admin") return NextResponse.redirect(new URL("/account", request.url));
    return NextResponse.next();
  } catch {
    return NextResponse.redirect(new URL("/login", request.url));
  }
}

export const config = { matcher: ["/admin/:path*"] };
