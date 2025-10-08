-- Fix blocked_requests table - remove UNIQUE constraint that's too strict
-- We want to log every blocked request, even if multiple happen in the same second

BEGIN TRANSACTION;

-- Drop the old table
DROP TABLE IF EXISTS blocked_requests;

-- Recreate without the UNIQUE constraint
CREATE TABLE blocked_requests (
  id INTEGER PRIMARY KEY AUTOINCREMENT,

  -- Request metadata
  timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
  ip_address TEXT NOT NULL,
  user_agent TEXT,
  referer TEXT,

  -- Request details
  request_count INTEGER NOT NULL,  -- How many requests they made before being blocked
  weapon_id TEXT,
  weapon_name TEXT,
  weapon_yield_kt REAL,
  city_name TEXT,
  country TEXT,
  latitude REAL,
  longitude REAL,
  blast_type TEXT,

  -- Session info
  session_id TEXT,

  -- Pattern analysis fields
  block_reason TEXT DEFAULT 'rate_limit',  -- Future: can add other reasons
  requests_in_window INTEGER  -- Total requests in the rate limit window
);

-- Recreate indexes
CREATE INDEX IF NOT EXISTS idx_blocked_ip ON blocked_requests(ip_address);
CREATE INDEX IF NOT EXISTS idx_blocked_timestamp ON blocked_requests(timestamp);
CREATE INDEX IF NOT EXISTS idx_blocked_weapon ON blocked_requests(weapon_name);
CREATE INDEX IF NOT EXISTS idx_blocked_city ON blocked_requests(city_name);
CREATE INDEX IF NOT EXISTS idx_blocked_session ON blocked_requests(session_id);

-- Recreate views
DROP VIEW IF EXISTS blocked_ips_summary;
CREATE VIEW blocked_ips_summary AS
SELECT
  ip_address,
  COUNT(*) as total_blocks,
  MIN(timestamp) as first_blocked,
  MAX(timestamp) as last_blocked,
  COUNT(DISTINCT weapon_id) as unique_weapons_used,
  COUNT(DISTINCT city_name) as unique_cities_targeted,
  COUNT(DISTINCT session_id) as unique_sessions,
  GROUP_CONCAT(DISTINCT user_agent) as user_agents
FROM blocked_requests
GROUP BY ip_address
ORDER BY total_blocks DESC;

DROP VIEW IF EXISTS blocked_weapons_summary;
CREATE VIEW blocked_weapons_summary AS
SELECT
  weapon_name,
  COUNT(*) as times_blocked,
  COUNT(DISTINCT ip_address) as unique_ips,
  COUNT(DISTINCT city_name) as unique_cities
FROM blocked_requests
WHERE weapon_name IS NOT NULL
GROUP BY weapon_name
ORDER BY times_blocked DESC;

DROP VIEW IF EXISTS recent_blocks;
CREATE VIEW recent_blocks AS
SELECT
  timestamp,
  ip_address,
  weapon_name,
  city_name,
  requests_in_window,
  user_agent
FROM blocked_requests
WHERE timestamp >= datetime('now', '-24 hours')
ORDER BY timestamp DESC;

COMMIT;

SELECT 'Table and views recreated successfully' as status;
