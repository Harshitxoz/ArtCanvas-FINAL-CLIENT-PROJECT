import { SignJWT, jwtVerify } from "jose";
import bcrypt from "bcryptjs";
import { cookies } from "next/headers";
import type { User, UserRole } from "@/types";

const rawSecret = process.env.AUTH_SECRET;
if (process.env.NODE_ENV === "production" && (!rawSecret || rawSecret.length < 32)) {
  throw new Error("AUTH_SECRET must be set to a strong value (32+ characters) in production.");
}
const secret = new TextEncoder().encode(rawSecret || "local-development-secret-change-me-please");
const COOKIE_NAME = "artcanvas_session";

export async function hashPassword(password: string) {
  return bcrypt.hash(password, 12);
}

export async function verifyPassword(password: string, hash: string) {
  return bcrypt.compare(password, hash);
}

export async function createSession(user: User) {
  const token = await new SignJWT({ sub: user.id, email: user.email, name: user.name, role: user.role })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(secret);

  const store = await cookies();
  store.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7
  });
}

export async function clearSession() {
  const store = await cookies();
  store.set(COOKIE_NAME, "", { httpOnly: true, expires: new Date(0), path: "/" });
}

export async function getSession(): Promise<User | null> {
  try {
    const store = await cookies();
    const token = store.get(COOKIE_NAME)?.value;
    if (!token) return null;
    const { payload } = await jwtVerify(token, secret);
    return {
      id: String(payload.sub),
      email: String(payload.email),
      name: String(payload.name),
      role: payload.role as UserRole
    };
  } catch {
    return null;
  }
}

export async function requireAdmin() {
  const user = await getSession();
  if (!user || user.role !== "admin") {
    throw new Error("UNAUTHORIZED");
  }
  return user;
}
