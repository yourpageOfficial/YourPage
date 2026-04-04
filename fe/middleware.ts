import createMiddleware from "next-intl/middleware";
import { NextRequest, NextResponse } from "next/server";
import { routing } from "./routing";

const intlMiddleware = createMiddleware(routing);

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const publicPaths = ["/", "/login", "/register", "/welcome", "/terms", "/privacy", "/pricing", "/explore", "/c"];
  const isPublicPath = publicPaths.some((path) => pathname.startsWith(path));

  if (pathname.includes("/api/") || pathname.includes("/storage/")) {
    return NextResponse.next();
  }

  if (!pathname.startsWith("/en") && !pathname.startsWith("/id") && pathname !== "/en" && pathname !== "/id") {
    const acceptLanguage = request.headers.get("accept-language") || "";
    const browserLang = acceptLanguage.split(",")[0]?.split("-")[0]?.toLowerCase() || "id";
    const supportedLocales = routing.locales;
    const detectedLocale = supportedLocales.includes(browserLang as "en" | "id") ? browserLang : routing.defaultLocale;
    
    const url = request.nextUrl.clone();
    url.pathname = `/${detectedLocale}${pathname === "/" ? "" : pathname}`;
    
    const response = NextResponse.redirect(url);
    response.cookies.set("NEXT_LOCALE", detectedLocale, { path: "/", maxAge: 60 * 60 * 24 * 365 });
    return response;
  }

  return intlMiddleware(request);
}

export const config = {
  matcher: ["/((?!api|_next|_vercel|.*\\..*).*)"],
};
