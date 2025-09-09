/* eslint-disable prettier/prettier */

import { createClient } from 'redis';

/**
 * Simple token-bucket style limiter.
 * - In-memory for dev (single instance)
 * - Redis for production (distributed)
 *
 * Config: ALLOWED_MESSAGES_PER_MINUTE, REDIS_URL (optional)
 */

type LimiterEntry = { tokens: number; lastRefill: number };

const PER_MINUTE = +(process.env.SOCKET_RATE_PER_MINUTE || '30'); // messages per minute
const INTERVAL_MS = 60_000;

let redisClient: ReturnType<typeof createClient> | null = null;
if (process.env.REDIS_URL) {
  redisClient = createClient({ url: process.env.REDIS_URL });
  redisClient.connect().catch((e) => {
    console.error('Failed to connect redis for limiter', e);
    redisClient = null;
  });
}

// In-memory store (fallback if no redis)
const store = new Map<string, LimiterEntry>();

export async function consumeToken(userId: string): Promise<boolean> {
  if (redisClient) return redisConsume(userId);
  return memConsume(userId);
}

// In-memory implementation
function memConsume(userId: string): boolean {
  const now = Date.now();
  const entry = store.get(userId) ?? { tokens: PER_MINUTE, lastRefill: now };
  // refill
  const elapsed = now - entry.lastRefill;
  if (elapsed > 0) {
    const refill = (PER_MINUTE * elapsed) / INTERVAL_MS;
    entry.tokens = Math.min(PER_MINUTE, entry.tokens + refill);
    entry.lastRefill = now;
  }

  if (entry.tokens >= 1) {
    entry.tokens -= 1;
    store.set(userId, entry);
    return true;
  }
  store.set(userId, entry);
  return false;
}

// Redis-backed implementation (atomic using INCR + EXPIRE per window)
async function redisConsume(userId: string): Promise<boolean> {
  if (!redisClient) return memConsume(userId);
  const key = `limiter:socket:${userId}`;
  // increment count this window
  const count = await redisClient.incr(key);
  if (count === 1) {
    // first message in window -> set TTL
    await redisClient.expire(key, 60);
  }
  return count <= PER_MINUTE;
}
