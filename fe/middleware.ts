import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const authProtectedPrefixes = ["/dashboard", "/s/", "/library", "/wallet", "/feed", "/notifications", "/chat", "/profile"];
const adminPrefixes = ["/admin"];
const creatorPrefixes = ["/dashboard"];

function getRole(request: NextRequest): string | null {
  const raw = request.cookies.get("auth-role")?.value;
  if (!raw) return null;
  const dot = raw.indexOf(".");
  if (dot !== -1) return raw.substring(0, dot);
  if (["admin", "creator", "supporter"].includes(raw)) return raw;
  return null;
}

function getLocale(request: NextRequest): string {
  const cookie = request.cookies.get("locale")?.value;
  if (cookie === "en") return "en";
  return "id";
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const role = getRole(request);
  const locale = getLocale(request);

  if (adminPrefixes.some((p) => pathname.startsWith(p))) {
    if (role !== "admin") return NextResponse.redirect(new URL("/login", request.url));
    const res = NextResponse.next();
    res.headers.set("x-locale", locale);
    return res;
  }

  if (creatorPrefixes.some((p) => pathname.startsWith(p))) {
    if (role !== "creator" && role !== "admin") return NextResponse.redirect(new URL("/login", request.url));
    const res = NextResponse.next();
    res.headers.set("x-locale", locale);
    return res;
  }

  if (authProtectedPrefixes.some((p) => pathname.startsWith(p))) {
    if (!role) return NextResponse.redirect(new URL("/login", request.url));
    const res = NextResponse.next();
    res.headers.set("x-locale", locale);
    return res;
  }

  const res = NextResponse.next();
  res.headers.set("x-locale", locale);
  return res;
}

export const config = {
  matcher: ["/admin/:path*", "/dashboard/:path*", "/s/:path*", "/library/:path*", "/wallet/:path*", "/feed", "/notifications", "/chat/:path*", "/profile", "/((?!api|_next/static|_next/image|favicon.ico).*)"],
};