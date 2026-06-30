import type { NextApiRequest } from "next";

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const buckets = new Map<string, RateLimitEntry>();

const CLEANUP_INTERVAL_MS = 60_000;
let lastCleanup = Date.now();

function cleanup(now: number) {
  if (now - lastCleanup < CLEANUP_INTERVAL_MS) return;
  lastCleanup = now;
  for (const [key, entry] of buckets) {
    if (entry.resetAt <= now) buckets.delete(key);
  }
}

function getClientKey(req: NextApiRequest, userId?: string): string {
  if (userId) return `user:${userId}`;
  const forwarded = req.headers["x-forwarded-for"];
  const ip =
    (typeof forwarded === "string" ? forwarded.split(",")[0] : forwarded?.[0]) ||
    req.socket.remoteAddress ||
    "unknown";
  return `ip:${ip}`;
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  retryAfterSec: number;
}

/**
 * Простой in-memory rate limiter для API routes.
 * На serverless каждый инстанс имеет свой счётчик — достаточно как базовая защита.
 */
export function checkRateLimit(
  req: NextApiRequest,
  options: {
    userId?: string;
    limit?: number;
    windowMs?: number;
  } = {}
): RateLimitResult {
  const limit = options.limit ?? 20;
  const windowMs = options.windowMs ?? 60_000;
  const now = Date.now();
  cleanup(now);

  const key = getClientKey(req, options.userId);
  const entry = buckets.get(key);

  if (!entry || entry.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true, remaining: limit - 1, retryAfterSec: 0 };
  }

  if (entry.count >= limit) {
    return {
      allowed: false,
      remaining: 0,
      retryAfterSec: Math.ceil((entry.resetAt - now) / 1000),
    };
  }

  entry.count += 1;
  return { allowed: true, remaining: limit - entry.count, retryAfterSec: 0 };
}
