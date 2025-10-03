import { getTursoClient } from "./utils/turso.ts";

/**
 * Background job to update aggregated statistics
 * Run this every 5 minutes via cron or scheduled function
 */
export default async (request: Request) => {
  const startTime = Date.now();
  console.log(`[update-stats] Stats update job started at ${new Date().toISOString()}`);
  // Optional: Validate API key for security
  const apiKey = request.headers.get("X-API-Key");
  const expectedKey = Deno.env.get("STATS_API_KEY");
  const source = request.headers.get("X-Source") || "unknown";

  console.log(`[update-stats] Request source: ${source}`);

  if (expectedKey && apiKey !== expectedKey) {
    console.warn(`[update-stats] ⚠️ Invalid API key attempt from ${source}`);
    return new Response(
      JSON.stringify({
        error: "Unauthorized",
        message: "Invalid API key",
      }),
      {
        status: 401,
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
  }

  try {
    const client = getTursoClient();
    console.log(`[update-stats] Database client initialized`);

    // Update all aggregated stats in a single transaction
    console.log(`[update-stats] Starting batch update with 4 operations`);
    const batchStart = Date.now();

    await client.batch([
      // Update last hour count
      {
        sql: `UPDATE running_totals SET
          last_hour_count = (
            SELECT COUNT(*)
            FROM detonations
            WHERE timestamp > datetime('now', '-1 hour')
          )
        WHERE id = 1`,
        args: [],
      },
      // Update most popular city and weapon
      {
        sql: `UPDATE running_totals SET
          most_targeted_city = (
            SELECT city_name FROM popular_targets
            ORDER BY detonation_count DESC LIMIT 1
          ),
          most_targeted_count = (
            SELECT detonation_count FROM popular_targets
            ORDER BY detonation_count DESC LIMIT 1
          ),
          most_used_weapon = (
            SELECT weapon_name FROM weapon_stats
            ORDER BY usage_count DESC LIMIT 1
          ),
          most_used_count = (
            SELECT usage_count FROM weapon_stats
            ORDER BY usage_count DESC LIMIT 1
          )
        WHERE id = 1`,
        args: [],
      },
      // Update unique sessions count (last 7 days)
      {
        sql: `UPDATE running_totals SET
          unique_sessions = (
            SELECT COUNT(DISTINCT session_id)
            FROM detonations
            WHERE timestamp > datetime('now', '-7 days')
          )
        WHERE id = 1`,
        args: [],
      },
      // Update recent activity cache
      {
        sql: `UPDATE recent_activity_cache SET
          last_hour_count = (
            SELECT COUNT(*) FROM detonations
            WHERE timestamp > datetime('now', '-1 hour')
          ),
          last_hour_yield_mt = (
            SELECT COALESCE(SUM(weapon_yield_kt) / 1000, 0)
            FROM detonations
            WHERE timestamp > datetime('now', '-1 hour')
          ),
          last_24h_count = (
            SELECT COUNT(*) FROM detonations
            WHERE timestamp > datetime('now', '-24 hours')
          ),
          last_24h_yield_mt = (
            SELECT COALESCE(SUM(weapon_yield_kt) / 1000, 0)
            FROM detonations
            WHERE timestamp > datetime('now', '-24 hours')
          ),
          cache_updated = CURRENT_TIMESTAMP
        WHERE id = 1`,
        args: [],
      },
    ]);

    console.log(`[update-stats] Batch update completed in ${Date.now() - batchStart}ms`);

    // Clean up old detonations (optional - keep last 90 days)
    // Uncomment if you want to archive old data
    /*
    await client.execute(`
      DELETE FROM detonations
      WHERE timestamp < datetime('now', '-90 days')
    `);
    */

    console.log(`[update-stats] ✅ Success - Total execution time: ${Date.now() - startTime}ms`);

    return new Response(
      JSON.stringify({
        success: true,
        message: "Stats updated successfully",
        timestamp: new Date().toISOString(),
        executionTime: `${Date.now() - startTime}ms`,
      }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
  } catch (error) {
    console.error(`[update-stats] ❌ Error after ${Date.now() - startTime}ms:`, error);

    return new Response(
      JSON.stringify({
        error: "Failed to update stats",
        details: error.message,
      }),
      {
        status: 500,
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
  }
};

export const config = {
  path: "/api/update-stats",
};