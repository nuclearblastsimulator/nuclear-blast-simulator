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

    // OPTIMIZED: Single row lookup instead of 4 full table scans
    // Before: 4 queries scanning entire detonations table
    // After: 1 query reading a single pre-aggregated row
    const stats = await client.execute(`
      SELECT
        total_detonations,
        unique_sessions,
        total_yield_mt,
        most_targeted_city,
        most_targeted_count,
        most_used_weapon,
        most_used_count,
        last_hour_count,
        hiroshima_equivalents,
        last_updated
      FROM running_totals
      WHERE id = 1
    `);

    const row = stats.rows[0];

    // If running_totals doesn't exist yet, fall back to old method temporarily
    if (!row) {
      // Fallback to original queries (this should only happen once)
      const fallbackStats = await client.execute(`
        SELECT
          COUNT(*) as total_detonations,
          COUNT(DISTINCT session_id) as unique_sessions,
          COALESCE(SUM(weapon_yield_kt) / 1000, 0) as total_yield_mt
        FROM detonations
      `);

      const fallbackRow = fallbackStats.rows[0];
      const totalYieldMT = Number(fallbackRow?.total_yield_mt || 0);

      return new Response(
        JSON.stringify({
          totalDetonations: Number(fallbackRow?.total_detonations || 0),
          uniqueSessions: Number(fallbackRow?.unique_sessions || 0),
          totalYieldMT: Math.round(totalYieldMT * 100) / 100,
          recentActivity: 0,
          hiroshimaEquivalents: Math.floor((totalYieldMT * 1000) / 15),
          mostTargetedCity: null,
          mostUsedWeapon: null,
          lastUpdated: new Date().toISOString(),
        }),
        {
          status: 200,
          headers,
        }
      );
    }

    // Extract optimized data
    const totalDetonations = Number(row.total_detonations || 0);
    const uniqueSessions = Number(row.unique_sessions || 0);
    const totalYieldMT = Number(row.total_yield_mt || 0);
    const recentCount = Number(row.last_hour_count || 0);
    const hiroshimaEquivalents = Number(row.hiroshima_equivalents || 0);

    // Prepare response with optimized data
    const response = {
      totalDetonations,
      uniqueSessions,
      totalYieldMT: Math.round(totalYieldMT * 100) / 100,
      recentActivity: recentCount,
      hiroshimaEquivalents,
      mostTargetedCity: row.most_targeted_city
        ? {
            city_name: row.most_targeted_city,
            detonation_count: row.most_targeted_count,
          }
        : null,
      mostUsedWeapon: row.most_used_weapon
        ? {
            weapon_name: row.most_used_weapon,
            usage_count: row.most_used_count,
          }
        : null,
      lastUpdated: row.last_updated || new Date().toISOString(),
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