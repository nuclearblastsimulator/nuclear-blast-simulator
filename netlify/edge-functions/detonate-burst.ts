import {
  getTursoClient,
  generateSessionId,
  getTimezoneInfo,
  getContinent,
  generateImpactMessage,
  type DetonationData
} from "./utils/turso.ts";

// Request coalescing for burst traffic
interface PendingRequest {
  data: DetonationData;
  sessionId: string;
  timeInfo: ReturnType<typeof getTimezoneInfo>;
  continent: string;
  resolve: (value: any) => void;
  reject: (error: any) => void;
}

let pendingRequests: PendingRequest[] = [];
let flushTimer: number | null = null;
const COALESCE_WINDOW_MS = 10; // Batch requests within 10ms window
const MAX_BATCH_SIZE = 50; // Maximum batch size to prevent timeouts

/**
 * Optimized detonation endpoint with request coalescing for burst traffic
 * Batches multiple concurrent requests into single database transactions
 */
async function processBatch() {
  const batch = pendingRequests.splice(0, MAX_BATCH_SIZE);
  if (batch.length === 0) return;

  const client = getTursoClient();

  try {
    // Prepare batch operations
    const batchOps = [];
    let totalYieldMT = 0;
    let totalHiroshimaEquiv = 0;
    const updateTargets = new Map<string, number>();
    const updateWeapons = new Map<string, { count: number; yield: number }>();

    // Prepare all detonation inserts
    for (const req of batch) {
      const yieldMT = req.data.weaponYieldKt / 1000;
      const hiroshimaEquiv = Math.floor(req.data.weaponYieldKt / 15);

      totalYieldMT += yieldMT;
      totalHiroshimaEquiv += hiroshimaEquiv;

      // Track targets
      if (req.data.cityName) {
        const key = `${req.data.cityName}|${req.data.country || ''}`;
        updateTargets.set(key, (updateTargets.get(key) || 0) + 1);
      }

      // Track weapons
      const weaponKey = req.data.weaponName;
      const current = updateWeapons.get(weaponKey) || { count: 0, yield: 0 };
      updateWeapons.set(weaponKey, {
        count: current.count + 1,
        yield: current.yield + req.data.weaponYieldKt
      });

      // Add detonation insert
      batchOps.push({
        sql: `INSERT INTO detonations (
          weapon_id, weapon_name, weapon_yield_kt,
          city_id, city_name, country,
          latitude, longitude, blast_type,
          session_id, continent, time_zone,
          day_of_week, hour_of_day
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        args: [
          req.data.weaponId,
          req.data.weaponName,
          req.data.weaponYieldKt,
          req.data.cityId || null,
          req.data.cityName || null,
          req.data.country || null,
          req.data.latitude || null,
          req.data.longitude || null,
          req.data.blastType,
          req.sessionId,
          req.continent,
          req.timeInfo.timeZone,
          req.timeInfo.dayOfWeek,
          req.timeInfo.hourOfDay,
        ],
      });
    }

    // Add single update for running totals
    batchOps.push({
      sql: `UPDATE running_totals SET
        total_detonations = total_detonations + ?,
        total_yield_mt = total_yield_mt + ?,
        hiroshima_equivalents = hiroshima_equivalents + ?,
        last_updated = CURRENT_TIMESTAMP
      WHERE id = 1`,
      args: [batch.length, totalYieldMT, totalHiroshimaEquiv],
    });

    // Add single update for daily stats
    batchOps.push({
      sql: `INSERT INTO daily_stats (date, total_detonations, total_yield_mt)
        VALUES (date('now'), ?, ?)
        ON CONFLICT(date) DO UPDATE SET
          total_detonations = total_detonations + ?,
          total_yield_mt = total_yield_mt + ?,
          updated_at = CURRENT_TIMESTAMP`,
      args: [batch.length, totalYieldMT, batch.length, totalYieldMT],
    });

    // Add popular targets updates
    for (const [key, count] of updateTargets) {
      const [cityName, country] = key.split('|');
      batchOps.push({
        sql: `INSERT INTO popular_targets (city_name, country, detonation_count)
          VALUES (?, ?, ?)
          ON CONFLICT(city_name, country) DO UPDATE SET
            detonation_count = detonation_count + ?,
            last_updated = CURRENT_TIMESTAMP`,
        args: [cityName, country, count, count],
      });
    }

    // Add weapon stats updates
    for (const [weaponName, stats] of updateWeapons) {
      batchOps.push({
        sql: `INSERT INTO weapon_stats (weapon_name, usage_count, total_yield_kt)
          VALUES (?, ?, ?)
          ON CONFLICT(weapon_name) DO UPDATE SET
            usage_count = usage_count + ?,
            total_yield_kt = total_yield_kt + ?,
            last_updated = CURRENT_TIMESTAMP`,
        args: [weaponName, stats.count, stats.yield, stats.count, stats.yield],
      });
    }

    // Execute all operations in a single transaction
    await client.batch(batchOps);

    // Get updated stats once for all requests
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

    // Resolve all requests with their individual responses
    for (const req of batch) {
      const message = generateImpactMessage(req.data);
      req.resolve({
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
      });
    }
  } catch (error) {
    // Reject all requests in the batch
    for (const req of batch) {
      req.reject(error);
    }
  }
}

function scheduleFlush() {
  if (flushTimer !== null) return;

  flushTimer = setTimeout(() => {
    flushTimer = null;
    processBatch();

    // Continue processing if more requests are pending
    if (pendingRequests.length > 0) {
      scheduleFlush();
    }
  }, COALESCE_WINDOW_MS) as unknown as number;
}

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

    // Generate session ID and metadata
    const sessionId = generateSessionId(request);
    const now = new Date();
    const timeInfo = getTimezoneInfo(now);
    const continent = getContinent(data.latitude, data.longitude);

    // Create promise for this request
    const responsePromise = new Promise((resolve, reject) => {
      pendingRequests.push({
        data,
        sessionId,
        timeInfo,
        continent,
        resolve,
        reject,
      });
    });

    // Schedule batch processing
    scheduleFlush();

    // If batch is full, process immediately
    if (pendingRequests.length >= MAX_BATCH_SIZE) {
      if (flushTimer !== null) {
        clearTimeout(flushTimer);
        flushTimer = null;
      }
      processBatch();
    }

    // Wait for batch processing
    const result = await responsePromise;

    return new Response(
      JSON.stringify(result),
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
  path: "/api/detonate-burst",
};