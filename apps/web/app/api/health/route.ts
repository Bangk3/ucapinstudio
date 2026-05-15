import { db } from "@invyte/db";
import { sql } from "drizzle-orm";
import { NextResponse } from "next/server";

async function checkDb(): Promise<"ok" | "error"> {
  try {
    await db.execute(sql`SELECT 1`);
    return "ok";
  } catch {
    return "error";
  }
}

async function checkRedis(): Promise<"ok" | "error" | "unconfigured"> {
  const url = process.env.REDIS_URL;
  if (!url) return "unconfigured";
  try {
    const { getRedis } = await import("@/lib/redis");
    const redis = getRedis();
    await redis.ping();
    return "ok";
  } catch {
    return "error";
  }
}

export async function GET() {
  const [dbStatus, redisStatus] = await Promise.all([checkDb(), checkRedis()]);

  const allOk = dbStatus === "ok" && (redisStatus === "ok" || redisStatus === "unconfigured");

  const body = {
    status: allOk ? "ok" : "degraded",
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version ?? "0.0.0",
    services: {
      app: "ok",
      db: dbStatus,
      redis: redisStatus,
    },
  };

  return NextResponse.json(body, { status: allOk ? 200 : 503 });
}
