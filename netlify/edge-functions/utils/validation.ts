/**
 * Request validation utilities for spam prevention
 * Validates coordinates, weapon IDs, and yields against known data
 */

// Weapon data - loaded from data.json
// This will be populated at runtime
let WEAPONS_MAP: Map<string, { yield: number; name: string }> | null = null;

async function loadWeaponsData() {
  if (WEAPONS_MAP !== null) return WEAPONS_MAP;

  try {
    const dataPath = new URL("../../../public/assets/data.json", import.meta.url);
    const response = await fetch(dataPath);
    const weaponsData: any = await response.json();

    WEAPONS_MAP = new Map(
      weaponsData.weapons.map((w: any) => [w.id, { yield: w.yield, name: w.name }])
    );

    return WEAPONS_MAP;
  } catch (error) {
    console.error("[validation] Failed to load weapons data:", error);
    WEAPONS_MAP = new Map(); // Empty map to prevent repeated failures
    return WEAPONS_MAP;
  }
}

/**
 * Validate coordinates are within valid Earth bounds
 */
export function validateCoordinates(latitude?: number, longitude?: number): { valid: boolean; error?: string } {
  if (latitude === undefined || longitude === undefined) {
    return { valid: true }; // Optional fields, allow null/undefined
  }

  if (typeof latitude !== 'number' || typeof longitude !== 'number') {
    return { valid: false, error: "Coordinates must be numbers" };
  }

  if (latitude < -90 || latitude > 90) {
    return { valid: false, error: `Invalid latitude: ${latitude}. Must be between -90 and 90` };
  }

  if (longitude < -180 || longitude > 180) {
    return { valid: false, error: `Invalid longitude: ${longitude}. Must be between -180 and 180` };
  }

  // Check for NaN
  if (isNaN(latitude) || isNaN(longitude)) {
    return { valid: false, error: "Coordinates cannot be NaN" };
  }

  return { valid: true };
}

/**
 * Validate weapon ID exists in weapons database
 */
export async function validateWeaponId(weaponId: string): Promise<{ valid: boolean; error?: string }> {
  if (!weaponId || typeof weaponId !== 'string') {
    return { valid: false, error: "Weapon ID is required and must be a string" };
  }

  const weaponsMap = await loadWeaponsData();

  if (!weaponsMap.has(weaponId)) {
    return { valid: false, error: `Invalid weapon ID: ${weaponId}. Weapon does not exist` };
  }

  return { valid: true };
}

/**
 * Validate weapon yield matches known value (±10% tolerance)
 */
export async function validateWeaponYield(
  weaponId: string,
  providedYieldKt: number
): Promise<{ valid: boolean; error?: string }> {
  const weaponsMap = await loadWeaponsData();
  const weapon = weaponsMap.get(weaponId);

  if (!weapon) {
    return { valid: false, error: `Unknown weapon ID: ${weaponId}` };
  }

  if (typeof providedYieldKt !== 'number' || isNaN(providedYieldKt)) {
    return { valid: false, error: "Yield must be a valid number" };
  }

  if (providedYieldKt <= 0) {
    return { valid: false, error: "Yield must be greater than 0" };
  }

  const expectedYield = weapon.yield;
  const tolerance = expectedYield * 0.1; // 10% tolerance
  const minYield = expectedYield - tolerance;
  const maxYield = expectedYield + tolerance;

  if (providedYieldKt < minYield || providedYieldKt > maxYield) {
    return {
      valid: false,
      error: `Invalid yield for ${weapon.name}. Expected ${expectedYield} kt (±10%), got ${providedYieldKt} kt`
    };
  }

  return { valid: true };
}

/**
 * Comprehensive validation for detonation request
 */
export async function validateDetonationRequest(data: {
  weaponId?: string;
  weaponYieldKt?: number;
  latitude?: number;
  longitude?: number;
}): Promise<{ valid: boolean; errors: string[] }> {
  const errors: string[] = [];

  // Validate weapon ID
  if (data.weaponId) {
    const weaponResult = await validateWeaponId(data.weaponId);
    if (!weaponResult.valid && weaponResult.error) {
      errors.push(weaponResult.error);
    }
  }

  // Validate coordinates
  const coordResult = validateCoordinates(data.latitude, data.longitude);
  if (!coordResult.valid && coordResult.error) {
    errors.push(coordResult.error);
  }

  // Validate yield (only if weapon ID is valid)
  if (data.weaponId && data.weaponYieldKt !== undefined) {
    const yieldResult = await validateWeaponYield(data.weaponId, data.weaponYieldKt);
    if (!yieldResult.valid && yieldResult.error) {
      errors.push(yieldResult.error);
    }
  }

  return {
    valid: errors.length === 0,
    errors
  };
}
