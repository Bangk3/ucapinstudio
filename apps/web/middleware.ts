import { getSessionCookie } from "better-auth/cookies";
import { type NextRequest, NextResponse } from "next/server";

const RESERVED_SLUGS = new Set([
  "system",
  "admin",
  "api",
  "auth",
  "health",
  "static",
  "assets",
  "media",
  "www",
  "mail",
  "blog",
  "docs",
  "help",
  "support",
]);

const PUBLIC_PATHS = ["/", "/auth", "/api/auth", "/_next", "/favicon.ico", "/robots.txt"];

function isPublicPath(pathname: string) {
  // Strict prefix match: must be exact OR followed by "/" — prevents
  // path-confusion bypass (e.g. "/authfoo" would otherwise match "/auth")
  return PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(`${p}/`));
}

function isTenantPath(pathname: string) {
  const slug = pathname.split("/")[1];
  return slug && !RESERVED_SLUGS.has(slug) && !slug.startsWith("_");
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Public paths — no auth check
  if (isPublicPath(pathname)) {
    return NextResponse.next();
  }

  // Tenant-scoped paths — check session for dashboard routes
  if (isTenantPath(pathname)) {
    const tenantSlug = pathname.split("/")[1] as string;
    const isDashboard = pathname.includes("/dashboard");

    if (isDashboard) {
      const sessionCookie = getSessionCookie(req);
      if (!sessionCookie) {
        const loginUrl = new URL("/auth/login", req.url);
        loginUrl.searchParams.set("callbackUrl", pathname);
        return NextResponse.redirect(loginUrl);
      }
    }

    const headers = new Headers(req.headers);
    headers.set("x-tenant-slug", tenantSlug);
    headers.set("x-pathname", pathname);

    return NextResponse.next({ request: { headers } });
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
};
