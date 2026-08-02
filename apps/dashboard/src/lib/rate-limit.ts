import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

const redis = process.env.UPSTASH_REDIS_REST_URL
  ? new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL,
      token: process.env.UPSTASH_REDIS_REST_TOKEN!,
    })
  : null;

if (!redis) {
  console.warn("[SECURITY] Upstash Redis not configured — rate limiting is DISABLED. All requests will be denied.");
}

const readLimiter = redis
  ? new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(100, "1 m"),
      analytics: true,
    })
  : null;

const mutationLimiter = redis
  ? new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(30, "1 m"),
      analytics: true,
    })
  : null;

const strictLimiter = redis
  ? new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(5, "1 m"),
      analytics: true,
    })
  : null;

export async function checkReadRateLimit(identifier: string): Promise<{ allowed: boolean; remaining: number }> {
  if (!readLimiter) return { allowed: false, remaining: 0 };
  const { success, remaining } = await readLimiter.limit(identifier);
  return { allowed: success, remaining };
}

export async function checkMutationRateLimit(identifier: string): Promise<{ allowed: boolean; remaining: number }> {
  if (!mutationLimiter) return { allowed: false, remaining: 0 };
  const { success, remaining } = await mutationLimiter.limit(identifier);
  return { allowed: success, remaining };
}

export async function checkStrictRateLimit(identifier: string): Promise<{ allowed: boolean; remaining: number }> {
  if (!strictLimiter) return { allowed: false, remaining: 0 };
  const { success, remaining } = await strictLimiter.limit(identifier);
  return { allowed: success, remaining };
}
