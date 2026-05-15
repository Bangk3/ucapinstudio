import Redis from "ioredis";

let _redis: Redis | null = null;

export function getRedis(): Redis {
  if (_redis) return _redis;

  const url = process.env.REDIS_URL;
  if (!url) {
    throw new Error("REDIS_URL environment variable is required");
  }

  _redis = new Redis(url, {
    maxRetriesPerRequest: 3,
    enableReadyCheck: false,
    lazyConnect: true,
  });

  _redis.on("error", (err) => {
    // Log but don't crash — rate limiting degrades gracefully
    console.error("[Redis] connection error:", err.message);
  });

  return _redis;
}
