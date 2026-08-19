interface RateLimitEntry {
  timestamps: number[];
}

const store = new Map<string, RateLimitEntry>();

// Auto-cleanup old entries every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of store.entries()) {
    // Remove entries where all timestamps are older than 1 hour
    const validTimestamps = entry.timestamps.filter((t) => now - t < 3600000);
    if (validTimestamps.length === 0) {
      store.delete(key);
    } else {
      entry.timestamps = validTimestamps;
    }
  }
}, 5 * 60 * 1000);

export function checkRateLimit(
  key: string,
  maxRequests: number,
  windowMs: number
): { allowed: boolean; remaining: number; resetAt: number } {
  const now = Date.now();
  const entry = store.get(key) || { timestamps: [] };

  // Filter to only timestamps within the window
  entry.timestamps = entry.timestamps.filter((t) => now - t < windowMs);

  if (entry.timestamps.length >= maxRequests) {
    const oldestInWindow = entry.timestamps[0];
    const resetAt = oldestInWindow + windowMs;
    return {
      allowed: false,
      remaining: 0,
      resetAt,
    };
  }

  entry.timestamps.push(now);
  store.set(key, entry);

  return {
    allowed: true,
    remaining: maxRequests - entry.timestamps.length,
    resetAt: now + windowMs,
  };
}
