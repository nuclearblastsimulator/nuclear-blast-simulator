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
import { validateDetonationRequest } from "./utils/validation.ts";

// Manual rate limiting since Netlify Edge Functions don't support built-in rate limiting
const requestTracker = new Map<string, { count: number; windowStart: number }>();

function trackAndEnforceRateLimit(ip: string, limit = 100, windowSize = 60): { count: number; allowed: boolean; resetIn: number } {
  const now = Date.now();
  const windowMs = windowSize * 1000;

  const tracker = requestTracker.get(ip);

  // Clean up old window
  if (!tracker || now - tracker.windowStart > windowMs) {
    requestTracker.set(ip, { count: 1, windowStart: now });
    return { count: 1, allowed: true, resetIn: windowSize };
  }

  // Calculate time until reset
  const resetIn = Math.ceil((tracker.windowStart + windowMs - now) / 1000);

  // Check if over limit
  if (tracker.count >= limit) {
    return { count: tracker.count, allowed: false, resetIn };
  }

  // Increment count in current window
  tracker.count++;
  requestTracker.set(ip, tracker);

  return { count: tracker.count, allowed: true, resetIn };
}

export default async (request: Request) => {
  const startTime = Date.now();
  const clientIP = request.headers.get('x-forwarded-for') ||
                   request.headers.get('x-real-ip') ||
                   'unknown';

  // Two-tier rate limiting:
  // 1. Burst protection: 5 requests per 3 seconds (blocks rapid-fire automation)
  // 2. Sustained rate: 50 requests per 60 seconds (allows legitimate experimentation)
  const BURST_LIMIT = 5;
  const BURST_WINDOW = 3;
  const RATE_LIMIT = 50;
  const RATE_WINDOW = 60;

  const burstLimit = trackAndEnforceRateLimit(clientIP, BURST_LIMIT, BURST_WINDOW);
  const rateLimit = trackAndEnforceRateLimit(clientIP, RATE_LIMIT, RATE_WINDOW);

  console.log(`[detonate-optimized] 📥 Request received at ${new Date().toISOString()}`);
  console.log(`[detonate-optimized] IP: ${clientIP}, Method: ${request.method}, URL: ${request.url}`);
  console.log(`[detonate-optimized] 📊 Burst: ${burstLimit.count}/${BURST_LIMIT} in ${BURST_WINDOW}s | Rate: ${rateLimit.count}/${RATE_LIMIT} in ${RATE_WINDOW}s`);
  console.log(`[detonate-optimized] User-Agent: ${request.headers.get('user-agent')}`);
  console.log(`[detonate-optimized] Referer: ${request.headers.get('referer') || 'none'}`);

  // STEALTH MODE: If rate limited, return fake success but don't record to database
  // This prevents spammers from knowing they're blocked
  const isRateLimited = !burstLimit.allowed || !rateLimit.allowed;
  const blockReason = !burstLimit.allowed ? 'burst_limit' : 'rate_limit';

  // Handle CORS preflight
  if (request.method === "OPTIONS") {
    console.log(`[detonate-optimized] OPTIONS request (preflight)`);
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
    'localhost:3000',
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
    console.log(`[detonate-optimized] Payload:`, JSON.stringify({
      weaponId: data.weaponId,
      weaponName: data.weaponName,
      weaponYieldKt: data.weaponYieldKt,
      cityName: data.cityName,
      country: data.country,
      latitude: data.latitude,
      longitude: data.longitude,
      blastType: data.blastType
    }));

    // STEALTH MODE: If rate limited, log to blocked_requests table and return fake success
    if (isRateLimited) {
      const limitType = blockReason === 'burst_limit'
        ? `Burst limit (${burstLimit.count}/${BURST_LIMIT} in ${BURST_WINDOW}s)`
        : `Rate limit (${rateLimit.count}/${RATE_LIMIT} in ${RATE_WINDOW}s)`;

      console.log(`[detonate-optimized] 🚫 BLOCKED (stealth): ${limitType} - returning fake success`);
      console.log(`[detonate-optimized] 🚫 Blocked payload:`, JSON.stringify(data));

      // Log blocked request to database for spam analysis
      try {
        const client = getTursoClient();
        const sessionId = generateSessionId(request);
        const userAgent = request.headers.get('user-agent') || 'unknown';
        const referer = request.headers.get('referer') || '';

        await client.execute({
          sql: `INSERT INTO blocked_requests (
            ip_address, user_agent, referer,
            request_count, weapon_id, weapon_name, weapon_yield_kt,
            city_name, country, latitude, longitude, blast_type,
            session_id, block_reason, requests_in_window
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          args: [
            clientIP,
            userAgent,
            referer,
            blockReason === 'burst_limit' ? burstLimit.count : rateLimit.count,
            data.weaponId || null,
            data.weaponName || null,
            data.weaponYieldKt || null,
            data.cityName || null,
            data.country || null,
            data.latitude || null,
            data.longitude || null,
            data.blastType || null,
            sessionId,
            blockReason,
            blockReason === 'burst_limit' ? burstLimit.count : rateLimit.count,
          ],
        });

        console.log(`[detonate-optimized] 📝 Blocked request logged to database (${blockReason})`);
      } catch (dbError) {
        console.error(`[detonate-optimized] ⚠️ Failed to log blocked request:`, dbError);
        // Continue anyway - don't let logging failure break the response
      }

      // Return fake success with plausible but fake stats
      return new Response(
        JSON.stringify({
          success: true,
          totalDetonations: Math.floor(Math.random() * 1000) + 50000,
          message: "Detonation recorded successfully",
          totalYieldMT: Math.floor(Math.random() * 10000) + 1000,
          hiroshimaEquivalents: Math.floor(Math.random() * 100000) + 10000,
          mostTargetedCity: null,
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
    }

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

    // SPAM PREVENTION: Validate request data
    const validation = await validateDetonationRequest({
      weaponId: data.weaponId,
      weaponYieldKt: data.weaponYieldKt,
      latitude: data.latitude,
      longitude: data.longitude,
    });

    if (!validation.valid) {
      console.log(`[detonate-optimized] ⚠️ Invalid request:`, validation.errors);
      return new Response(
        JSON.stringify({
          error: "Invalid request data",
          details: validation.errors
        }),
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
    console.log(`[detonate-optimized] 📤 Sending response to ${clientIP}`);

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
          // Removed rate limit headers to stay stealthy
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
  // NOTE: Netlify's built-in rate limiting doesn't work for Edge Functions
  // We implement two-tier stealth rate limiting:
  // - Burst: 5 requests per 3 seconds (blocks rapid-fire automation)
  // - Sustained: 50 requests per 60 seconds (allows legitimate experimentation)
  // Blocked requests receive fake success responses and are logged to blocked_requests table
};