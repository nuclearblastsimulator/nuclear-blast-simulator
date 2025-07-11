import { 
  getTursoClient, 
  generateSessionId, 
  getTimezoneInfo, 
  getContinent,
  generateImpactMessage,
  getTotalDetonations,
  updateDailyStats,
  updatePopularTargets,
  updateWeaponStats,
  type DetonationData 
} from "./utils/turso.ts";

export default async (request: Request) => {
  // Handle CORS preflight
  if (request.method === "OPTIONS") {
    return new Response(null, {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
      },
    });
  }

  // Only accept POST requests
  if (request.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
    });
  }

  try {
    // Parse request body
    const data: DetonationData = await request.json();

    // Validate required fields
    if (!data.weaponId || !data.weaponName || !data.weaponYieldKt) {
      return new Response(
        JSON.stringify({ error: "Missing required weapon data" }),
        {
          status: 400,
          headers: {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",
          },
        }
      );
    }

    // Get database client
    const client = getTursoClient();

    // Generate session ID
    const sessionId = generateSessionId(request);

    // Get time-based info
    const now = new Date();
    const timeInfo = getTimezoneInfo(now);

    // Determine continent from coordinates
    const continent = getContinent(data.latitude, data.longitude);

    // Insert detonation record
    await client.execute({
      sql: `INSERT INTO detonations (
        weapon_id, weapon_name, weapon_yield_kt,
        city_id, city_name, country,
        latitude, longitude, blast_type,
        session_id, continent, time_zone,
        day_of_week, hour_of_day
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      args: [
        data.weaponId,
        data.weaponName,
        data.weaponYieldKt,
        data.cityId || null,
        data.cityName || null,
        data.country || null,
        data.latitude || null,
        data.longitude || null,
        data.blastType,
        sessionId,
        continent,
        timeInfo.timeZone,
        timeInfo.dayOfWeek,
        timeInfo.hourOfDay,
      ],
    });

    // Update aggregated statistics
    await Promise.all([
      updateDailyStats(client, data),
      updatePopularTargets(client, data),
      updateWeaponStats(client, data),
    ]);

    // Get updated total count
    const totalDetonations = await getTotalDetonations(client);

    // Generate impact message
    const message = generateImpactMessage(data);

    // Get updated stats for response
    const updatedStats = await client.execute(`
      SELECT 
        COUNT(*) as total,
        COUNT(DISTINCT session_id) as unique_sessions,
        COALESCE(SUM(weapon_yield_kt) / 1000, 0) as total_yield_mt
      FROM detonations
    `);
    
    const updatedMostTargeted = await client.execute(`
      SELECT city_name, detonation_count
      FROM popular_targets
      ORDER BY detonation_count DESC
      LIMIT 1
    `);
    
    const statsRow = updatedStats.rows[0];
    const updatedTotalYieldMT = Number(statsRow?.total_yield_mt || 0);
    const hiroshimaEquivalents = Math.floor((updatedTotalYieldMT * 1000) / 15);
    
    // Return success response with updated stats
    return new Response(
      JSON.stringify({
        success: true,
        totalDetonations,
        message,
        totalYieldMT: Math.round(updatedTotalYieldMT * 100) / 100,
        hiroshimaEquivalents,
        mostTargetedCity: updatedMostTargeted.rows[0] || null,
      }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
          "Cache-Control": "no-cache",
        },
      }
    );
  } catch (error) {
    console.error("Error recording detonation:", error);
    
    return new Response(
      JSON.stringify({
        error: "Failed to record detonation",
        details: error.message,
      }),
      {
        status: 500,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
      }
    );
  }
};

export const config = {
  path: "/api/detonate",
};