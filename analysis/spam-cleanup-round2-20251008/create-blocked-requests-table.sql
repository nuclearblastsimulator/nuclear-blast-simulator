-- Create table to track blocked requests for spam analysis
-- This helps identify patterns and persistent spammers

CREATE TABLE IF NOT EXISTS blocked_requests (
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
  requests_in_window INTEGER,  -- Total requests in the rate limit window

  -- Indexes for analysis
  UNIQUE(timestamp, ip_address, weapon_id, city_name)  -- Prevent duplicate logs for same blocked request
);

-- Indexes for fast queries
CREATE INDEX IF NOT EXISTS idx_blocked_ip ON blocked_requests(ip_address);
CREATE INDEX IF NOT EXISTS idx_blocked_timestamp ON blocked_requests(timestamp);
CREATE INDEX IF NOT EXISTS idx_blocked_weapon ON blocked_requests(weapon_name);
CREATE INDEX IF NOT EXISTS idx_blocked_city ON blocked_requests(city_name);
CREATE INDEX IF NOT EXISTS idx_blocked_session ON blocked_requests(session_id);

-- Analysis view: Top blocked IPs
CREATE VIEW IF NOT EXISTS blocked_ips_summary AS
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

-- Analysis view: Block patterns by weapon
CREATE VIEW IF NOT EXISTS blocked_weapons_summary AS
SELECT
  weapon_name,
  COUNT(*) as times_blocked,
  COUNT(DISTINCT ip_address) as unique_ips,
  COUNT(DISTINCT city_name) as unique_cities
FROM blocked_requests
WHERE weapon_name IS NOT NULL
GROUP BY weapon_name
ORDER BY times_blocked DESC;

-- Analysis view: Recent blocks (last 24 hours)
CREATE VIEW IF NOT EXISTS recent_blocks AS
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
