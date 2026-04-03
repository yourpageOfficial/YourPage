import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Routes that require authentication (any role)
const authProtectedPrefixes = [
  "/dashboard",
  "/s/",
  "/library",
  "/wallet",
  "/feed",
  "/notifications",
  "/chat",
  "/profile",
];

// Routes that require admin role
const adminPrefixes = ["/admin"];

// Routes that require creator role
const creatorPrefixes = ["/dashboard"];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const role = request.cookies.get("auth-role")?.value;

  // Check admin routes
  if (adminPrefixes.some((p) => pathname.startsWith(p))) {
    if (role !== "admin") {
      return NextResponse.redirect(new URL("/login", request.url));
    }
    return NextResponse.next();
  }

  // Check creator-only routes
  if (creatorPrefixes.some((p) => pathname.startsWith(p))) {
    if (role !== "creator" && role !== "admin") {
      return NextResponse.redirect(new URL("/login", request.url));
    }
    return NextResponse.next();
  }

  // Check general auth-required routes
  if (authProtectedPrefixes.some((p) => pathname.startsWith(p))) {
    if (!role) {
      return NextResponse.redirect(new URL("/login", request.url));
    }
    return NextResponse.next();
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/admin/:path*",
    "/dashboard/:path*",
    "/s/:path*",
    "/library/:path*",
    "/wallet/:path*",
    "/feed",
    "/notifications",
    "/chat/:path*",
    "/profile",
  ],
};
