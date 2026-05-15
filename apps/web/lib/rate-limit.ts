/**
 * Redis sliding-window rate limiter for public API endpoints.
 *
 * Uses a sorted set keyed by `rl:<key>` where members are request timestamps.
 * Scores = Unix ms timestamp → easy range trimming for the window.
 */
import { getRedis } from "./redis";

export interface RateLimitResult {
  success: boolean;
  /** Remaining requests allowed in this window */
  remaining: number;
  /** When the window resets (Unix ms) */
  resetAt: number;
}

/**
 * Check and increment rate limit for a given key.
 *
 * @param key        Unique key, e.g. `rsvp:<invitationId>:<ipHash>`
 * @param limit      Max requests allowed in the window
 * @param windowMs   Window duration in milliseconds
 */
export async function rateLimit(
  key: string,
  limit: number,
  windowMs: number,
): Promise<RateLimitResult> {
  const redis = getRedis();
  const redisKey = `rl:${key}`;
  const now = Date.now();
  const windowStart = now - windowMs;
  const resetAt = now + windowMs;

  // Lua script: atomic sliding-window check + increment
  const script = `
    local key = KEYS[1]
    local now = tonumber(ARGV[1])
    local windowStart = tonumber(ARGV[2])
    local limit = tonumber(ARGV[3])
    local expireMs = tonumber(ARGV[4])

    -- Remove entries outside the window
    redis.call('ZREMRANGEBYSCORE', key, '-inf', windowStart)

    -- Count current entries
    local count = redis.call('ZCARD', key)

    if count >= limit then
      return {0, 0}
    end

    -- Add current request
    redis.call('ZADD', key, now, now)
    redis.call('PEXPIRE', key, expireMs)

    return {1, limit - count - 1}
  `;

  const [allowed, remaining] = (await redis.eval(
    script,
    1,
    redisKey,
    String(now),
    String(windowStart),
    String(limit),
    String(windowMs),
  )) as [number, number];

  return {
    success: allowed === 1,
    remaining: remaining ?? 0,
    resetAt,
  };
}

/**
 * Convenience: rate limit by IP hash.
 * Returns null when Redis is unavailable (fail-open, degrade gracefully).
 */
export async function rateLimitIp(
  prefix: string,
  ipHash: string,
  limit: number,
  windowMs: number,
): Promise<RateLimitResult | null> {
  try {
    return await rateLimit(`${prefix}:${ipHash}`, limit, windowMs);
  } catch {
    // Redis down → fail open (log and allow)
    console.error("[rate-limit] Redis unavailable, skipping rate limit for", prefix);
    return null;
  }
}
