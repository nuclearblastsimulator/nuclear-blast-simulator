import { createClient } from "https://esm.sh/@libsql/client@0.3.5/web";

export interface DetonationData {
  weaponId: string;
  weaponName: string;
  weaponYieldKt: number;
  cityId?: string;
  cityName?: string;
  country?: string;
  latitude?: number;
  longitude?: number;
  blastType: 'air' | 'surface';
}

export interface DetonationStats {
  totalDetonations: number;
  uniqueSessions: number;
  totalYieldMT: number;
}

export function getTursoClient() {
  const url = Deno.env.get("TURSO_URL");
  const authToken = Deno.env.get("TURSO_AUTH_TOKEN");

  if (!url || !authToken) {
    throw new Error("Missing Turso configuration");
  }

  return createClient({
    url,
    authToken,
  });
}

export function generateSessionId(request: Request): string {
  // Privacy-conscious session ID generation
  // Uses a combination of timestamp and random value, no PII
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 15);
  return `${timestamp}-${random}`;
}

export function getTimezoneInfo(date: Date) {
  return {
    dayOfWeek: date.getUTCDay(),
    hourOfDay: date.getUTCHours(),
    timeZone: "UTC", // Store all times in UTC
  };
}

export function getContinent(latitude?: number, longitude?: number): string | null {
  if (!latitude || !longitude) return null;

  // Simplified continent detection based on coordinates
  if (latitude > 35 && latitude < 71 && longitude > -10 && longitude < 60) {
    return "Europe";
  } else if (latitude > 15 && latitude < 55 && longitude > 60 && longitude < 150) {
    return "Asia";
  } else if (latitude > -35 && latitude < 40 && longitude > -20 && longitude < 55) {
    return "Africa";
  } else if (latitude > 10 && latitude < 85 && longitude > -170 && longitude < -50) {
    return "North America";
  } else if (latitude > -60 && latitude < 15 && longitude > -110 && longitude < -35) {
    return "South America";
  } else if (latitude > -50 && latitude < -10 && longitude > 110 && longitude < 180) {
    return "Oceania";
  }
  
  return "Unknown";
}

export function generateImpactMessage(data: DetonationData): string {
  const messages = [
    `${data.weaponName} detonated${data.cityName ? ` over ${data.cityName}` : ''}`,
    `${data.weaponYieldKt.toLocaleString()} kilotons of destruction simulated`,
    `Virtual blast radius calculated${data.cityName ? ` for ${data.cityName}` : ''}`,
    `Educational simulation complete: ${data.weaponName}`,
  ];
  
  return messages[Math.floor(Math.random() * messages.length)];
}

export async function getTotalDetonations(client: any): Promise<number> {
  const result = await client.execute("SELECT COUNT(*) as count FROM detonations");
  return result.rows[0]?.count || 0;
}

export async function updateDailyStats(client: any, data: DetonationData) {
  const today = new Date().toISOString().split('T')[0];
  
  // Update or insert daily stats
  await client.execute({
    sql: `
      INSERT INTO daily_stats (date, total_detonations, total_yield_mt)
      VALUES (?, 1, ?)
      ON CONFLICT(date) DO UPDATE SET
        total_detonations = total_detonations + 1,
        total_yield_mt = total_yield_mt + ?,
        updated_at = CURRENT_TIMESTAMP
    `,
    args: [today, data.weaponYieldKt / 1000, data.weaponYieldKt / 1000],
  });
}

export async function updatePopularTargets(client: any, data: DetonationData) {
  if (!data.cityName) return;
  
  await client.execute({
    sql: `
      INSERT INTO popular_targets (city_name, country, detonation_count, total_yield_mt, last_targeted)
      VALUES (?, ?, 1, ?, CURRENT_TIMESTAMP)
      ON CONFLICT(city_name) DO UPDATE SET
        detonation_count = detonation_count + 1,
        total_yield_mt = total_yield_mt + ?,
        last_targeted = CURRENT_TIMESTAMP
    `,
    args: [data.cityName, data.country || 'Unknown', data.weaponYieldKt / 1000, data.weaponYieldKt / 1000],
  });
}

export async function updateWeaponStats(client: any, data: DetonationData) {
  await client.execute({
    sql: `
      INSERT INTO weapon_stats (weapon_id, weapon_name, usage_count, avg_yield_kt, last_used)
      VALUES (?, ?, 1, ?, CURRENT_TIMESTAMP)
      ON CONFLICT(weapon_id) DO UPDATE SET
        usage_count = usage_count + 1,
        avg_yield_kt = ((avg_yield_kt * usage_count) + ?) / (usage_count + 1),
        last_used = CURRENT_TIMESTAMP
    `,
    args: [data.weaponId, data.weaponName, data.weaponYieldKt, data.weaponYieldKt],
  });
}