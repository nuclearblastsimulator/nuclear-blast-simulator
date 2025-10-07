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
  const startTime = Date.now();
  console.log(`[detonate-optimized] Request received at ${new Date().toISOString()}`);

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
    console.log(`[detonate-optimized] ⚠️ Blocked invalid referer: ${referer}`);
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
    console.log(`[detonate-optimized] Processing detonation: ${data.weaponName} (${data.weaponYieldKt}kt) at ${data.cityName || 'coordinates'}`);

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
    console.log(`[detonate-optimized] Database client initialized`);

    // Generate session ID
    const sessionId = generateSessionId(request);

    // Get time-based info
    const now = new Date();
    const timeInfo = getTimezoneInfo(now);

    // Determine continent from coordinates
    const continent = getContinent(data.latitude, data.longitude);

    // Calculate derived values
    const yieldMT = data.weaponYieldKt / 1000;
    const hiroshimaEquivalent = Math.floor(data.weaponYieldKt / 15);

    // OPTIMIZED: Reduced database operations
    console.log(`[detonate-optimized] Executing batch transaction with 3 operations`);
    const batchStart = Date.now();

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
      // 2. Update running totals (simplified - no expensive subquery)
      {
        sql: `UPDATE running_totals SET
          total_detonations = total_detonations + 1,
          total_yield_mt = total_yield_mt + ?,
          hiroshima_equivalents = hiroshima_equivalents + ?,
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

    console.log(`[detonate-optimized] Batch transaction completed in ${Date.now() - batchStart}ms`);

    // Update popular targets and weapon stats asynchronously
    // These don't need to block the response
    const updatePromises = [
      updatePopularTargets(client, data),
      updateWeaponStats(client, data),
    ];

    // Don't update most popular on every request - use a background job instead
    // This saves 4 expensive subqueries per request

    // Generate impact message
    const message = generateImpactMessage(data);

    // Get updated stats from running_totals (single row lookup)
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

    // Wait for updates to complete (but they're already started in parallel)
    await Promise.all(updatePromises);
    console.log(`[detonate-optimized] Async updates completed`);

    const statsRow = updatedStats.rows[0];
    const totalDetonations = Number(statsRow?.total_detonations || 0);
    const updatedTotalYieldMT = Number(statsRow?.total_yield_mt || 0);
    const hiroshimaEquivalents = Number(statsRow?.hiroshima_equivalents || 0);

    console.log(`[detonate-optimized] ✅ Success - Total detonations: ${totalDetonations}, Response time: ${Date.now() - startTime}ms`);

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
    console.error(`[detonate-optimized] ❌ Error after ${Date.now() - startTime}ms:`, error);

    // Check if it's a database constraint error (duplicate, etc)
    if (error.message?.includes('UNIQUE constraint')) {
      return new Response(
        JSON.stringify({
          error: "Duplicate detonation detected",
          details: "This detonation was already recorded",
        }),
        {
          status: 409,
          headers: {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",
          },
        }
      );
    }

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
  path: "/api/detonate-optimized",
  // SPAM PREVENTION: Netlify built-in rate limiting
  rateLimit: {
    windowLimit: 100,        // Max 100 requests per window
    windowSize: 60,          // 60 second window
    aggregateBy: ["ip"],     // Rate limit by IP address
  },
};