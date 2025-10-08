-- Rebuild all stats tables after spam cleanup
-- This ensures all aggregated data reflects the cleaned database

BEGIN TRANSACTION;

-- 2. Rebuild popular_targets
DELETE FROM popular_targets;

INSERT INTO popular_targets (city_name, country, detonation_count, last_targeted, total_yield_mt)
SELECT
  city_name,
  MAX(country) as country,
  COUNT(*) as detonation_count,
  MAX(timestamp) as last_targeted,
  ROUND(SUM(weapon_yield_kt) / 1000.0, 2) as total_yield_mt
FROM detonations
WHERE city_name IS NOT NULL
GROUP BY city_name;

-- 3. Rebuild weapon_stats
DELETE FROM weapon_stats;

INSERT INTO weapon_stats (weapon_id, weapon_name, usage_count, last_used, avg_yield_kt)
SELECT
  weapon_id,
  MAX(weapon_name) as weapon_name,
  COUNT(*) as usage_count,
  MAX(timestamp) as last_used,
  ROUND(AVG(weapon_yield_kt), 2) as avg_yield_kt
FROM detonations
GROUP BY weapon_id;

-- 4. Rebuild daily_stats
DELETE FROM daily_stats;

INSERT INTO daily_stats (date, total_detonations, total_yield_mt, updated_at)
SELECT
  DATE(timestamp) as date,
  COUNT(*) as total_detonations,
  ROUND(SUM(weapon_yield_kt) / 1000.0, 2) as total_yield_mt,
  CURRENT_TIMESTAMP as updated_at
FROM detonations
GROUP BY DATE(timestamp);

-- 1. Rebuild running_totals (must be last so it can reference other tables)
INSERT OR REPLACE INTO running_totals (
  id,
  total_detonations,
  total_yield_mt,
  hiroshima_equivalents,
  most_targeted_city,
  most_targeted_count,
  most_used_weapon,
  most_used_count,
  last_updated
)
SELECT
  1 as id,
  COUNT(*) as total_detonations,
  ROUND(SUM(weapon_yield_kt) / 1000.0, 2) as total_yield_mt,
  SUM(CAST(weapon_yield_kt / 15 AS INTEGER)) as hiroshima_equivalents,
  (SELECT city_name FROM popular_targets ORDER BY detonation_count DESC LIMIT 1) as most_targeted_city,
  (SELECT detonation_count FROM popular_targets ORDER BY detonation_count DESC LIMIT 1) as most_targeted_count,
  (SELECT weapon_name FROM weapon_stats ORDER BY usage_count DESC LIMIT 1) as most_used_weapon,
  (SELECT usage_count FROM weapon_stats ORDER BY usage_count DESC LIMIT 1) as most_used_count,
  CURRENT_TIMESTAMP as last_updated
FROM detonations;

-- Show final stats
SELECT '=== FINAL STATISTICS ===' as status;
SELECT * FROM running_totals WHERE id = 1;

SELECT '--- Top 10 Weapons ---' as status;
SELECT weapon_name, usage_count, avg_yield_kt
FROM weapon_stats
ORDER BY usage_count DESC
LIMIT 10;

SELECT '--- Top 10 Cities ---' as status;
SELECT city_name, country, detonation_count
FROM popular_targets
ORDER BY detonation_count DESC
LIMIT 10;

COMMIT;
