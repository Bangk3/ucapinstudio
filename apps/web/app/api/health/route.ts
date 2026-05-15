import { NextResponse } from "next/server";

export async function GET() {
  const checks = {
    status: "ok",
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version ?? "0.0.0",
    services: {
      // TODO M1: add DB, Redis, storage checks
      app: "ok",
    },
  };

  return NextResponse.json(checks, { status: 200 });
}
