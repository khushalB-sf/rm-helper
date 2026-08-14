import { NextRequest, NextResponse } from "next/server";
import {
  getSessionFromToken,
  refreshAccessToken,
  SESSION_COOKIE_NAME,
  REFRESH_COOKIE_NAME,
  ACCESS_TOKEN_COOKIE_OPTIONS,
} from "@/lib/session";

const PUBLIC_ROUTES = ["/", "/login", "/register", "/forgot-password", "/reset-password", "/verify-email"];

export async function proxy(request: NextRequest) {
  const path = request.nextUrl.pathname;
  const isPublicRoute = PUBLIC_ROUTES.includes(path);

  let session = await getSessionFromToken(request.cookies.get(SESSION_COOKIE_NAME)?.value);
  let refreshed: Awaited<ReturnType<typeof refreshAccessToken>> = null;

  // Access token missing/expired: fall back to the longer-lived refresh token (DB lookup).
  if (!session?.userId) {
    refreshed = await refreshAccessToken(request.cookies.get(REFRESH_COOKIE_NAME)?.value);
    if (refreshed) session = { userId: refreshed.userId };
  }

  if (!isPublicRoute && !session?.userId) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  if ((path === "/login" || path === "/register") && session?.userId) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  if (!refreshed) return NextResponse.next();

  // Make the new access token visible both to this request's own rendering and to the browser.
  const requestHeaders = new Headers(request.headers);
  request.cookies.set(SESSION_COOKIE_NAME, refreshed.accessToken);
  const response = NextResponse.next({ request: { headers: requestHeaders } });
  response.cookies.set(SESSION_COOKIE_NAME, refreshed.accessToken, {
    ...ACCESS_TOKEN_COOKIE_OPTIONS,
    expires: refreshed.expiresAt,
  });
  return response;
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|.*\\..*).*)"],
};
