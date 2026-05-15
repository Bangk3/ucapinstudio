import { createHash } from "node:crypto";
import { auth } from "@/lib/auth";
import { rateLimitIp } from "@/lib/rate-limit";
import { toNextJsHandler } from "better-auth/next-js";
import { type NextRequest, NextResponse } from "next/server";

const baseHandler = toNextJsHandler(auth.handler);

/** Rate-limit sign-in endpoints: 10 attempts / 15 min per IP */
async function checkLoginRateLimit(req: NextRequest): Promise<NextResponse | null> {
  const { pathname } = req.nextUrl;
  // Only apply to credential + social sign-in
  if (
    !pathname.endsWith("/sign-in/email") &&
    !pathname.endsWith("/sign-in/social") &&
    !pathname.endsWith("/forget-password")
  ) {
    return null;
  }

  const forwarded = req.headers.get("x-forwarded-for");
  const ip = forwarded?.split(",")[0]?.trim() ?? req.headers.get("x-real-ip") ?? "unknown";
  const ipHash = createHash("sha256").update(ip).digest("hex").slice(0, 16);

  const result = await rateLimitIp("login", ipHash, 10, 15 * 60 * 1000);

  if (result && !result.success) {
    const retryAfter = Math.ceil((result.resetAt - Date.now()) / 1000);
    return NextResponse.json(
      { message: "Terlalu banyak percobaan login. Coba lagi dalam 15 menit." },
      {
        status: 429,
        headers: { "Retry-After": String(retryAfter), "X-RateLimit-Limit": "10" },
      },
    );
  }

  return null;
}

export async function GET(req: NextRequest) {
  return baseHandler.GET(req);
}

export async function POST(req: NextRequest) {
  const limited = await checkLoginRateLimit(req);
  if (limited) return limited;
  return baseHandler.POST(req);
}
