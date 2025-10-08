# Permanent Block Strategy

## Problem
We're logging blocked requests to catch spammers, but checking the database on every request would:
- Add latency (extra DB query per request)
- Increase database row reads (costs money on Turso)
- Slow down legitimate users

## Recommended Solution: In-Memory Blocklist with Periodic Refresh

### Strategy Overview
1. **Don't check DB on every request** - too slow and expensive
2. **Use in-memory blocklist** - instant lookup, no DB query needed
3. **Periodically refresh blocklist** from database (every 5-10 minutes)
4. **Only block egregious repeat offenders** - not first-time rate limit violations

### Implementation Plan

#### Phase 1: Define "Permanent Block" Criteria
Only permanently block IPs that show clear spam patterns:
- **50+ blocked requests** in 24 hours (sustained spam campaign)
- **20+ burst limit violations** (automated bot behavior)
- **Blocked across 3+ different days** (persistent spammer)

These thresholds ensure we only block obvious spammers, not legitimate users who hit rate limits accidentally.

#### Phase 2: In-Memory Blocklist
```typescript
// Global blocklist (refreshed every 5 minutes)
let permanentBlocklist = new Set<string>();
let blocklistLastRefreshed = 0;
const BLOCKLIST_REFRESH_INTERVAL = 5 * 60 * 1000; // 5 minutes

async function refreshBlocklist() {
  const now = Date.now();
  if (now - blocklistLastRefreshed < BLOCKLIST_REFRESH_INTERVAL) {
    return; // Still fresh
  }

  try {
    const client = getTursoClient();

    // Query for IPs that meet permanent block criteria
    const result = await client.execute(`
      SELECT DISTINCT ip_address
      FROM blocked_requests
      WHERE timestamp >= datetime('now', '-7 days')
      GROUP BY ip_address
      HAVING
        COUNT(*) >= 50  -- 50+ blocks in 7 days
        OR SUM(CASE WHEN block_reason = 'burst_limit' THEN 1 ELSE 0 END) >= 20  -- 20+ burst violations
        OR COUNT(DISTINCT DATE(timestamp)) >= 3  -- Active on 3+ different days
    `);

    permanentBlocklist = new Set(result.rows.map(row => row.ip_address as string));
    blocklistLastRefreshed = now;

    console.log(`[blocklist] Refreshed: ${permanentBlocklist.size} IPs permanently blocked`);
  } catch (error) {
    console.error('[blocklist] Failed to refresh:', error);
    // Don't clear existing blocklist on error
  }
}
```

#### Phase 3: Fast Lookup (No DB Query)
```typescript
// At start of request handler, after getting clientIP:

// Refresh blocklist if needed (async, doesn't block first request)
if (Date.now() - blocklistLastRefreshed >= BLOCKLIST_REFRESH_INTERVAL) {
  refreshBlocklist(); // Fire and forget
}

// Instant in-memory check
if (permanentBlocklist.has(clientIP)) {
  console.log(`[detonate-optimized] 🚫 PERMANENTLY BLOCKED IP: ${clientIP}`);

  // Return fake success immediately (no logging, no DB writes)
  return new Response(
    JSON.stringify({
      success: true,
      totalDetonations: Math.floor(Math.random() * 1000) + 50000,
      message: "Detonation recorded successfully",
      // ... fake stats
    }),
    { status: 200, headers: { "Content-Type": "application/json", ... } }
  );
}

// Continue with normal rate limiting...
```

### Performance Impact
- **DB queries**: 0 per request (only every 5 minutes)
- **Memory usage**: ~1KB for 1000 blocked IPs (negligible)
- **Latency**: <1ms (Set.has() is O(1))
- **Cost**: Single query every 5 minutes instead of 100+ per minute

### Alternative: Don't Implement Yet
**Recommendation: Wait and see if you actually need this.**

Reasons to wait:
1. Current rate limiting already blocks active spam
2. Spammers can easily change IPs (VPNs, proxies)
3. Risk of false positives (shared IPs, dynamic IPs)
4. Database is small enough that rate limiting is sufficient

**When to implement:**
- You see the same IPs in blocked_requests repeatedly over days
- Spammers are rotating through the rate limit (waiting 60s, then spamming again)
- You want to reduce database writes from repeat offenders

## Recommended Approach
**For now: Just monitor the blocked_requests table**

Run this query weekly to see if permanent blocking is needed:
```sql
-- Check if we have persistent spammers
SELECT
  ip_address,
  COUNT(*) as total_blocks,
  COUNT(DISTINCT DATE(timestamp)) as days_active,
  MIN(timestamp) as first_seen,
  MAX(timestamp) as last_seen
FROM blocked_requests
GROUP BY ip_address
HAVING days_active >= 3 OR total_blocks >= 50
ORDER BY total_blocks DESC;
```

If you see many IPs with `days_active >= 3` or `total_blocks >= 50`, then implement the permanent blocklist.

## Summary
**Don't implement yet.** The current two-tier rate limiting is sufficient. Monitor the `blocked_requests` table for a few weeks first. If you see persistent repeat offenders, then add the in-memory blocklist using the strategy above.

The stealth rate limiting already prevents spam from being recorded, which is the main goal. Permanent blocking is only needed if spammers are *cycling* through the rate limit repeatedly.
