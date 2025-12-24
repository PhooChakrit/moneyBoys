import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import createIntlMiddleware from "next-intl/middleware";
import { routing } from "./i18n/routing";

const intlMiddleware = createIntlMiddleware(routing);

// Routes that don't require authentication
const publicRoutes = ["/login", "/register"];

// Routes that handle their own auth (can be accessed but will redirect if needed)
const semiPublicRoutes = ["/groups/join"];

// Routes that should skip middleware entirely
const apiAuthRoutes = ["/api/auth"];

export default function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Skip auth check for API auth routes
  if (apiAuthRoutes.some((route) => pathname.startsWith(route))) {
    return NextResponse.next();
  }

  // Skip auth check for API routes in general
  if (pathname.startsWith("/api/")) {
    return NextResponse.next();
  }

  // Get session token from cookie
  const sessionToken = request.cookies.get("session_token")?.value;

  // Check if current path is a public route (accounting for locale prefix)
  const isPublicRoute = publicRoutes.some((route) => {
    // Match /en/login, /th/login, etc.
    const localePattern = new RegExp(`^/(en|th)${route}$`);
    return localePattern.test(pathname) || pathname === route;
  });

  // Check if current path is a semi-public route (handles its own auth)
  const isSemiPublicRoute = semiPublicRoutes.some((route) => {
    const localePattern = new RegExp(`^/(en|th)${route}`);
    return localePattern.test(pathname);
  });

  // If not authenticated and trying to access protected route (skip semi-public routes)
  if (!sessionToken && !isPublicRoute && !isSemiPublicRoute && pathname !== "/") {
    // Get the locale from the path or default to 'en'
    const locale = pathname.split("/")[1] || "en";
    const validLocale = ["en", "th"].includes(locale) ? locale : "en";

    return NextResponse.redirect(new URL(`/${validLocale}/login`, request.url));
  }

  // If authenticated and trying to access login/register, redirect to home
  if (sessionToken && isPublicRoute) {
    const locale = pathname.split("/")[1] || "en";
    const validLocale = ["en", "th"].includes(locale) ? locale : "en";

    return NextResponse.redirect(new URL(`/${validLocale}`, request.url));
  }

  // Handle internationalization
  return intlMiddleware(request);
}

export const config = {
  matcher: ["/", "/(en|th)/:path*", "/api/:path*"],
};
