-- Round 2 Spam Cleanup: Remove weapon spam (>10 detonations per minute)
-- This targets spam that was spread across multiple cities but used the same weapon rapidly

BEGIN TRANSACTION;

-- Show counts before deletion
SELECT '=== BEFORE DELETION ===' as status;
SELECT COUNT(*) as total_detonations FROM detonations;

-- Delete all detonations where the same weapon had >10 detonations in the same minute
SELECT '--- Deleting weapon spam (>10 per minute) ---' as status;

DELETE FROM detonations
WHERE id IN (
  SELECT d.id
  FROM detonations d
  INNER JOIN (
    SELECT
      weapon_name,
      strftime('%Y-%m-%d %H:%M', timestamp) as minute
    FROM detonations
    GROUP BY weapon_name, minute
    HAVING COUNT(*) > 10
  ) spam
  ON d.weapon_name = spam.weapon_name
    AND strftime('%Y-%m-%d %H:%M', d.timestamp) = spam.minute
);

SELECT 'Deleted weapon spam:' as status, changes() as rows_deleted;

-- Show counts after deletion
SELECT '=== AFTER DELETION ===' as status;
SELECT COUNT(*) as total_detonations FROM detonations;

COMMIT;
