/**
 * Rate limiting implementation for high-traffic endpoints
 * Uses sliding window algorithm with in-memory storage
 */

interface RateLimitConfig {
  windowMs: number; // Time window in milliseconds
  maxRequests: number; // Maximum requests per window
  keyGenerator?: (request: Request) => string; // Function to generate rate limit key
  skipSuccessfulRequests?: boolean; // Don't count successful requests
  message?: string; // Error message for rate limited requests
}

interface RequestRecord {
  timestamp: number;
  count: number;
}

class RateLimiter {
  private store: Map<string, RequestRecord[]> = new Map();
  private cleanupInterval: number | null = null;

  constructor(private config: RateLimitConfig) {
    // Start cleanup interval to remove old records
    this.startCleanup();
  }

  private startCleanup() {
    this.cleanupInterval = setInterval(() => {
      const now = Date.now();
      const cutoff = now - this.config.windowMs;

      // Clean up old records
      for (const [key, records] of this.store.entries()) {
        const filtered = records.filter(r => r.timestamp > cutoff);
        if (filtered.length === 0) {
          this.store.delete(key);
        } else {
          this.store.set(key, filtered);
        }
      }
    }, Math.max(this.config.windowMs / 4, 60000)) as unknown as number; // Cleanup every quarter window or 1 minute
  }

  private getKey(request: Request): string {
    if (this.config.keyGenerator) {
      return this.config.keyGenerator(request);
    }

    // Default: Use IP address
    const ip = request.headers.get("x-forwarded-for")?.split(",")[0].trim() ||
               request.headers.get("x-real-ip") ||
               "unknown";
    return ip;
  }

  async checkLimit(request: Request): Promise<{
    allowed: boolean;
    limit: number;
    remaining: number;
    reset: Date;
    retryAfter?: number;
  }> {
    const key = this.getKey(request);
    const now = Date.now();
    const cutoff = now - this.config.windowMs;

    // Get or create records for this key
    let records = this.store.get(key) || [];

    // Filter out old records
    records = records.filter(r => r.timestamp > cutoff);

    // Count requests in window
    const totalCount = records.reduce((sum, r) => sum + r.count, 0);

    // Calculate when window resets
    const oldestRecord = records[0];
    const resetTime = oldestRecord
      ? new Date(oldestRecord.timestamp + this.config.windowMs)
      : new Date(now + this.config.windowMs);

    if (totalCount >= this.config.maxRequests) {
      // Rate limit exceeded
      const retryAfter = Math.ceil((resetTime.getTime() - now) / 1000);

      return {
        allowed: false,
        limit: this.config.maxRequests,
        remaining: 0,
        reset: resetTime,
        retryAfter,
      };
    }

    // Add new request record
    records.push({ timestamp: now, count: 1 });
    this.store.set(key, records);

    return {
      allowed: true,
      limit: this.config.maxRequests,
      remaining: this.config.maxRequests - totalCount - 1,
      reset: resetTime,
    };
  }

  createResponse(retryAfter: number): Response {
    const message = this.config.message || "Too many requests, please try again later";

    return new Response(
      JSON.stringify({
        error: "Too Many Requests",
        message,
        retryAfter,
      }),
      {
        status: 429,
        headers: {
          "Content-Type": "application/json",
          "Retry-After": retryAfter.toString(),
          "X-RateLimit-Limit": this.config.maxRequests.toString(),
          "X-RateLimit-Remaining": "0",
          "Access-Control-Allow-Origin": "*",
        },
      }
    );
  }

  destroy() {
    if (this.cleanupInterval !== null) {
      clearInterval(this.cleanupInterval);
    }
    this.store.clear();
  }
}

// Pre-configured rate limiters for different scenarios
export const rateLimiters = {
  // Standard rate limit: 60 requests per minute per IP
  standard: new RateLimiter({
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 60,
  }),

  // Strict rate limit: 20 requests per minute per IP
  strict: new RateLimiter({
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 20,
    message: "Rate limit exceeded. Maximum 20 requests per minute.",
  }),

  // Burst protection: 10 requests per second per IP
  burst: new RateLimiter({
    windowMs: 1000, // 1 second
    maxRequests: 10,
    message: "Burst limit exceeded. Maximum 10 requests per second.",
  }),

  // Session-based rate limit: 100 requests per 5 minutes per session
  session: new RateLimiter({
    windowMs: 5 * 60 * 1000, // 5 minutes
    maxRequests: 100,
    keyGenerator: (request: Request) => {
      // Use session ID from cookie or header
      const cookie = request.headers.get("cookie");
      const sessionId = cookie?.match(/session_id=([^;]+)/)?.[1];
      return sessionId || request.headers.get("x-session-id") || "unknown";
    },
    message: "Session rate limit exceeded. Maximum 100 requests per 5 minutes.",
  }),
};

// Middleware function for easy integration
export async function withRateLimit(
  request: Request,
  handler: (request: Request) => Promise<Response>,
  limiter: RateLimiter = rateLimiters.standard
): Promise<Response> {
  const result = await limiter.checkLimit(request);

  if (!result.allowed) {
    return limiter.createResponse(result.retryAfter!);
  }

  // Add rate limit headers to successful response
  const response = await handler(request);

  response.headers.set("X-RateLimit-Limit", result.limit.toString());
  response.headers.set("X-RateLimit-Remaining", result.remaining.toString());
  response.headers.set("X-RateLimit-Reset", result.reset.toISOString());

  return response;
}

// Helper to combine multiple rate limiters
export async function withMultipleRateLimits(
  request: Request,
  handler: (request: Request) => Promise<Response>,
  limiters: RateLimiter[]
): Promise<Response> {
  // Check all rate limiters
  for (const limiter of limiters) {
    const result = await limiter.checkLimit(request);
    if (!result.allowed) {
      return limiter.createResponse(result.retryAfter!);
    }
  }

  // All limits passed, execute handler
  return handler(request);
}