import { getTursoClient } from "./utils/turso.ts";

interface AnalyticsResponse {
  type: string;
  data: any;
  lastUpdated: string;
}

async function getLiveStats(client: any): Promise<AnalyticsResponse> {
  // OPTIMIZED: Use indexed timestamp column for recent activity
  const recentDetonations = await client.execute(`
    SELECT
      weapon_name,
      city_name,
      country,
      weapon_yield_kt,
      blast_type,
      timestamp,
      CAST((julianday('now') - julianday(timestamp)) * 24 * 60 AS INTEGER) as minutes_ago
    FROM detonations
    WHERE timestamp > datetime('now', '-30 minutes')
    ORDER BY timestamp DESC
    LIMIT 10
  `);

  // Format the data
  const liveData = recentDetonations.rows.map((row: any) => ({
    weapon: row.weapon_name,
    city: row.city_name || "Unknown location",
    country: row.country || "Unknown",
    yieldMT: row.weapon_yield_kt / 1000,
    blastType: row.blast_type,
    timeAgo: row.minutes_ago === 0 ? "Just now" : `${row.minutes_ago} minute${row.minutes_ago > 1 ? 's' : ''} ago`,
  }));

  return {
    type: "live",
    data: { recentDetonations: liveData },
    lastUpdated: new Date().toISOString(),
  };
}

async function getMostTargetedCities(client: any): Promise<AnalyticsResponse> {
  // OPTIMIZED: Use indexed popular_targets table
  const cities = await client.execute(`
    SELECT
      city_name,
      country,
      detonation_count,
      total_yield_mt,
      last_targeted
    FROM popular_targets
    ORDER BY detonation_count DESC
    LIMIT 20
  `);

  return {
    type: "cities",
    data: { 
      cities: cities.rows,
      totalCitiesTargeted: cities.rows.length,
    },
    lastUpdated: new Date().toISOString(),
  };
}

async function getWeaponStats(client: any): Promise<AnalyticsResponse> {
  // OPTIMIZED: Use indexed weapon_stats table
  const weapons = await client.execute(`
    SELECT
      weapon_name,
      usage_count,
      avg_yield_kt,
      last_used
    FROM weapon_stats
    ORDER BY usage_count DESC
    LIMIT 20
  `);

  return {
    type: "weapons",
    data: { 
      weapons: weapons.rows,
      totalWeaponsUsed: weapons.rows.length,
    },
    lastUpdated: new Date().toISOString(),
  };
}

async function getTimelineData(client: any): Promise<AnalyticsResponse> {
  // OPTIMIZED: Use indexed queries with limited scope
  const [hourlyData, dailyData] = await Promise.all([
    // Use indexed timestamp for hourly data
    client.execute(`
      SELECT
        strftime('%Y-%m-%d %H:00', timestamp) as hour,
        COUNT(*) as detonations,
        SUM(weapon_yield_kt) / 1000 as total_yield_mt
      FROM detonations
      WHERE timestamp > datetime('now', '-24 hours')
      GROUP BY hour
      ORDER BY hour DESC
    `),
    // Daily stats are already pre-aggregated
    client.execute(`
      SELECT
        date,
        total_detonations,
        total_yield_mt
      FROM daily_stats
      ORDER BY date DESC
      LIMIT 30
    `)
  ]);

  return {
    type: "timeline",
    data: {
      hourly: hourlyData.rows,
      daily: dailyData.rows,
    },
    lastUpdated: new Date().toISOString(),
  };
}

async function getGlobalHeatmap(client: any): Promise<AnalyticsResponse> {
  // OPTIMIZED: Use popular_targets for pre-aggregated city data
  const heatmapData = await client.execute(`
    SELECT
      d.latitude,
      d.longitude,
      pt.city_name,
      pt.country,
      pt.detonation_count,
      pt.total_yield_mt
    FROM popular_targets pt
    INNER JOIN (
      SELECT DISTINCT city_name, latitude, longitude
      FROM detonations
      WHERE latitude IS NOT NULL AND longitude IS NOT NULL
    ) d ON pt.city_name = d.city_name
    ORDER BY pt.detonation_count DESC
    LIMIT 100
  `);

  return {
    type: "heatmap",
    data: {
      locations: heatmapData.rows,
      totalLocations: heatmapData.rows.length,
    },
    lastUpdated: new Date().toISOString(),
  };
}

async function getAllStats(client: any): Promise<AnalyticsResponse> {
  // OPTIMIZED: Use running_totals and pre-aggregated tables
  const [generalStats, uniqueCounts, patterns, hourlyPatterns] = await Promise.all([
    // Get basic stats from running_totals (single row lookup)
    client.execute(`
      SELECT
        total_detonations,
        unique_sessions,
        total_yield_mt,
        hiroshima_equivalents
      FROM running_totals
      WHERE id = 1
    `),
    // Get unique counts from pre-aggregated tables
    client.execute(`
      SELECT
        (SELECT COUNT(*) FROM popular_targets) as unique_cities,
        (SELECT COUNT(*) FROM weapon_stats) as unique_weapons,
        (SELECT AVG(avg_yield_kt) FROM weapon_stats) as avg_yield_kt,
        (SELECT MAX(avg_yield_kt) FROM weapon_stats) as max_yield_kt
    `),
    // Get time-based patterns (limited to recent data for performance)
    client.execute(`
      SELECT
        day_of_week,
        COUNT(*) as count
      FROM detonations
      WHERE timestamp > datetime('now', '-30 days')
      GROUP BY day_of_week
      ORDER BY count DESC
    `),
    // Get hourly patterns (limited to recent data)
    client.execute(`
      SELECT
        hour_of_day,
        COUNT(*) as count
      FROM detonations
      WHERE timestamp > datetime('now', '-30 days')
      GROUP BY hour_of_day
      ORDER BY hour_of_day
    `)
  ]);

  // Combine the optimized results
  const combinedStats = {
    ...generalStats.rows[0],
    ...uniqueCounts.rows[0],
  };

  return {
    type: "all",
    data: {
      general: combinedStats,
      dayOfWeekPatterns: patterns.rows,
      hourlyPatterns: hourlyPatterns.rows,
    },
    lastUpdated: new Date().toISOString(),
  };
}

export default async (request: Request) => {
  // Handle CORS
  const headers = {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, OPTIONS",
    "Cache-Control": "no-cache, no-store, must-revalidate", // Disable caching during development
    "Pragma": "no-cache",
    "Expires": "0",
  };

  if (request.method === "OPTIONS") {
    return new Response(null, { headers });
  }

  try {
    const url = new URL(request.url);
    const type = url.searchParams.get("type");
    const client = getTursoClient();

    let response: AnalyticsResponse;

    switch (type) {
      case "live":
        response = await getLiveStats(client);
        break;
      case "cities":
        response = await getMostTargetedCities(client);
        break;
      case "weapons":
        response = await getWeaponStats(client);
        break;
      case "timeline":
        response = await getTimelineData(client);
        break;
      case "heatmap":
        response = await getGlobalHeatmap(client);
        break;
      default:
        response = await getAllStats(client);
    }

    return new Response(JSON.stringify(response), {
      status: 200,
      headers,
    });
  } catch (error) {
    console.error("Error fetching analytics:", error);

    return new Response(
      JSON.stringify({
        error: "Failed to fetch analytics",
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
  path: "/api/analytics",
};