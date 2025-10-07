import {
  getTursoClient,
  generateSessionId,
  getTimezoneInfo,
  getContinent,
  generateImpactMessage,
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

  // SPAM PREVENTION: Validate referer header
  const referer = request.headers.get('referer') || '';
  const validReferers = [
    'nuclearblastsimulator.com',
    'localhost:4321',
    'localhost:8888', // Netlify dev
  ];

  const isValidReferer = validReferers.some(valid => referer.includes(valid));

  if (!isValidReferer && referer !== '') {
    console.log(`[detonate] ⚠️ Blocked invalid referer: ${referer}`);
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
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

    // OPTIMIZED: Use batch transaction for atomic updates
    // This ensures all operations succeed or fail together
    // and reduces the number of round trips to the database
    const yieldMT = data.weaponYieldKt / 1000;
    const hiroshimaEquivalent = Math.floor(data.weaponYieldKt / 15);

    await client.batch([
      // 1. Insert detonation record
      {
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
      },
      // 2. Update running totals atomically
      {
        sql: `UPDATE running_totals SET
          total_detonations = total_detonations + 1,
          total_yield_mt = total_yield_mt + ?,
          hiroshima_equivalents = hiroshima_equivalents + ?,
          last_hour_count = (
            SELECT COUNT(*)
            FROM detonations
            WHERE timestamp > datetime('now', '-1 hour')
          ) + 1,
          last_updated = CURRENT_TIMESTAMP
        WHERE id = 1`,
        args: [yieldMT, hiroshimaEquivalent],
      },
      // 3. Update daily stats
      {
        sql: `INSERT INTO daily_stats (date, total_detonations, total_yield_mt)
          VALUES (date('now'), 1, ?)
          ON CONFLICT(date) DO UPDATE SET
            total_detonations = total_detonations + 1,
            total_yield_mt = total_yield_mt + ?,
            updated_at = CURRENT_TIMESTAMP`,
        args: [yieldMT, yieldMT],
      },
    ]);

    // Update popular targets and weapon stats (can be done asynchronously)
    await Promise.all([
      updatePopularTargets(client, data),
      updateWeaponStats(client, data),
      // Update most popular city/weapon in running totals if needed
      client.execute(`
        UPDATE running_totals SET
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
        WHERE id = 1
      `),
    ]);

    // Generate impact message
    const message = generateImpactMessage(data);

    // OPTIMIZED: Get updated stats from running_totals (single row lookup)
    const updatedStats = await client.execute(`
      SELECT
        total_detonations,
        total_yield_mt,
        hiroshima_equivalents,
        most_targeted_city,
        most_targeted_count
      FROM running_totals
      WHERE id = 1
    `);

    const statsRow = updatedStats.rows[0];
    const totalDetonations = Number(statsRow?.total_detonations || 0);
    const updatedTotalYieldMT = Number(statsRow?.total_yield_mt || 0);
    const hiroshimaEquivalents = Number(statsRow?.hiroshima_equivalents || 0);
    
    // Return success response with updated stats
    return new Response(
      JSON.stringify({
        success: true,
        totalDetonations,
        message,
        totalYieldMT: Math.round(updatedTotalYieldMT * 100) / 100,
        hiroshimaEquivalents,
        mostTargetedCity: statsRow?.most_targeted_city
          ? {
              city_name: statsRow.most_targeted_city,
              detonation_count: statsRow.most_targeted_count,
            }
          : null,
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
  // SPAM PREVENTION: Netlify built-in rate limiting
  rateLimit: {
    windowLimit: 100,        // Max 100 requests per window
    windowSize: 60,          // 60 second window
    aggregateBy: ["ip"],     // Rate limit by IP address
  },
};