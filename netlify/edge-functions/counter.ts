import { getTursoClient } from "./utils/turso.ts";

export default async (request: Request) => {
  // Handle CORS
  const headers = {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, OPTIONS",
    "Cache-Control": "public, max-age=1800", // Cache for 30 minutes
  };

  // Handle preflight
  if (request.method === "OPTIONS") {
    return new Response(null, { headers });
  }

  try {
    const client = getTursoClient();

    // Execute all queries in parallel for better performance
    const [stats, recentActivity, mostPopularTarget, mostUsedWeapon] = await Promise.all([
      // Get basic statistics
      client.execute(`
        SELECT 
          COUNT(*) as total,
          COUNT(DISTINCT session_id) as unique_sessions,
          COALESCE(SUM(weapon_yield_kt) / 1000, 0) as total_yield_mt
        FROM detonations
      `),
      
      // Get recent activity
      client.execute(`
        SELECT COUNT(*) as recent_count
        FROM detonations
        WHERE timestamp > datetime('now', '-1 hour')
      `),
      
      // Get most popular target
      client.execute(`
        SELECT city_name, detonation_count
        FROM popular_targets
        ORDER BY detonation_count DESC
        LIMIT 1
      `),
      
      // Get most used weapon
      client.execute(`
        SELECT weapon_name, usage_count
        FROM weapon_stats
        ORDER BY usage_count DESC
        LIMIT 1
      `)
    ]);

    const row = stats.rows[0];

    // Calculate some interesting derived stats
    const totalDetonations = Number(row?.total || 0);
    const uniqueSessions = Number(row?.unique_sessions || 0);
    const totalYieldMT = Number(row?.total_yield_mt || 0);
    const recentCount = Number(recentActivity.rows[0]?.recent_count || 0);

    // Calculate Hiroshima equivalents (15 KT)
    const hiroshimaEquivalents = Math.floor((totalYieldMT * 1000) / 15);

    // Prepare response
    const response = {
      totalDetonations,
      uniqueSessions,
      totalYieldMT: Math.round(totalYieldMT * 100) / 100,
      recentActivity: recentCount,
      hiroshimaEquivalents,
      mostTargetedCity: mostPopularTarget.rows[0] || null,
      mostUsedWeapon: mostUsedWeapon.rows[0] || null,
      lastUpdated: new Date().toISOString(),
    };

    return new Response(JSON.stringify(response), {
      status: 200,
      headers,
    });
  } catch (error) {
    console.error("Error fetching counter:", error);

    return new Response(
      JSON.stringify({
        error: "Failed to fetch counter data",
        details: error.message,
      }),
      {
        status: 500,
        headers,
      }
    );
  }
};

export const config = {
  path: "/api/counter",
};