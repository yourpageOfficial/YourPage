import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const authProtectedPrefixes = ["/dashboard", "/s/", "/library", "/wallet", "/feed", "/notifications", "/chat", "/profile"];
const adminPrefixes = ["/admin"];
const creatorPrefixes = ["/dashboard"];

function getRole(request: NextRequest): string | null {
  const raw = request.cookies.get("auth-role")?.value;
  if (!raw) return null;
  // BE sets signed cookie as "role.hmac_signature"
  const dot = raw.indexOf(".");
  if (dot !== -1) return raw.substring(0, dot); // signed format
  // Fallback: accept unsigned cookie (backward compat during migration)
  // Real auth is enforced by BE via HttpOnly access_token cookie
  if (["admin", "creator", "supporter"].includes(raw)) return raw;
  return null;
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const role = getRole(request);

  if (adminPrefixes.some((p) => pathname.startsWith(p))) {
    if (role !== "admin") return NextResponse.redirect(new URL("/login", request.url));
    return NextResponse.next();
  }

  if (creatorPrefixes.some((p) => pathname.startsWith(p))) {
    if (role !== "creator" && role !== "admin") return NextResponse.redirect(new URL("/login", request.url));
    return NextResponse.next();
  }

  if (authProtectedPrefixes.some((p) => pathname.startsWith(p))) {
    if (!role) return NextResponse.redirect(new URL("/login", request.url));
    return NextResponse.next();
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/dashboard/:path*", "/s/:path*", "/library/:path*", "/wallet/:path*", "/feed", "/notifications", "/chat/:path*", "/profile"],
};
