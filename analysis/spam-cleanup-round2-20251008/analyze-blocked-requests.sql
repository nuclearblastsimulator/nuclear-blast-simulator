-- Queries to analyze blocked requests and identify spam patterns

-- 1. Top blocked IPs (most aggressive spammers)
SELECT * FROM blocked_ips_summary LIMIT 20;

-- 2. Recent blocks in last 24 hours
SELECT * FROM recent_blocks LIMIT 50;

-- 3. Most blocked weapons (what spammers are using)
SELECT * FROM blocked_weapons_summary LIMIT 20;

-- 4. Blocked requests by hour (when are spammers most active?)
SELECT
  strftime('%Y-%m-%d %H:00', timestamp) as hour,
  COUNT(*) as blocks,
  COUNT(DISTINCT ip_address) as unique_ips
FROM blocked_requests
WHERE timestamp >= datetime('now', '-7 days')
GROUP BY hour
ORDER BY hour DESC;

-- 5. IPs with both allowed and blocked requests (potential legitimate users hitting limits)
SELECT
  br.ip_address,
  COUNT(br.id) as blocked_count,
  COUNT(DISTINCT d.id) as successful_detonations,
  MAX(br.timestamp) as last_blocked,
  MAX(d.timestamp) as last_successful
FROM blocked_requests br
LEFT JOIN detonations d ON d.session_id LIKE '%' || br.ip_address || '%'
GROUP BY br.ip_address
HAVING successful_detonations > 0
ORDER BY blocked_count DESC;

-- 6. Persistent spammers (blocked multiple times over multiple days)
SELECT
  ip_address,
  COUNT(*) as total_blocks,
  COUNT(DISTINCT DATE(timestamp)) as days_active,
  MIN(timestamp) as first_seen,
  MAX(timestamp) as last_seen,
  CAST(julianday(MAX(timestamp)) - julianday(MIN(timestamp)) AS INTEGER) as span_days
FROM blocked_requests
GROUP BY ip_address
HAVING days_active > 1
ORDER BY total_blocks DESC;

-- 7. Coordinated attacks (same weapon + city from different IPs in short time)
SELECT
  weapon_name,
  city_name,
  COUNT(DISTINCT ip_address) as unique_ips,
  COUNT(*) as total_blocks,
  MIN(timestamp) as first_block,
  MAX(timestamp) as last_block
FROM blocked_requests
WHERE timestamp >= datetime('now', '-24 hours')
  AND weapon_name IS NOT NULL
  AND city_name IS NOT NULL
GROUP BY weapon_name, city_name
HAVING unique_ips > 2
ORDER BY total_blocks DESC;

-- 8. Suspicious user agents (common bot patterns)
SELECT
  user_agent,
  COUNT(*) as blocks,
  COUNT(DISTINCT ip_address) as unique_ips
FROM blocked_requests
WHERE user_agent IS NOT NULL
  AND (
    user_agent LIKE '%bot%'
    OR user_agent LIKE '%crawler%'
    OR user_agent LIKE '%spider%'
    OR user_agent LIKE '%curl%'
    OR user_agent LIKE '%python%'
    OR user_agent LIKE '%requests%'
  )
GROUP BY user_agent
ORDER BY blocks DESC;

-- 9. Empty/missing referer (likely automated)
SELECT
  COUNT(*) as blocks_no_referer,
  COUNT(DISTINCT ip_address) as unique_ips,
  COUNT(DISTINCT weapon_id) as unique_weapons
FROM blocked_requests
WHERE referer IS NULL OR referer = '';

-- 10. Block rate over time (trend analysis)
SELECT
  DATE(timestamp) as date,
  COUNT(*) as total_blocks,
  COUNT(DISTINCT ip_address) as unique_ips_blocked,
  ROUND(AVG(requests_in_window), 2) as avg_requests_before_block
FROM blocked_requests
GROUP BY DATE(timestamp)
ORDER BY date DESC
LIMIT 30;

-- 11. Burst vs Sustained rate limit blocks
SELECT
  block_reason,
  COUNT(*) as total_blocks,
  COUNT(DISTINCT ip_address) as unique_ips,
  COUNT(DISTINCT weapon_id) as unique_weapons,
  MIN(timestamp) as first_block,
  MAX(timestamp) as last_block
FROM blocked_requests
GROUP BY block_reason
ORDER BY total_blocks DESC;

-- 12. Rapid-fire spammers (high burst limit violations)
SELECT
  ip_address,
  COUNT(*) as burst_blocks,
  COUNT(DISTINCT weapon_id) as unique_weapons,
  COUNT(DISTINCT city_name) as unique_cities,
  MIN(timestamp) as first_burst,
  MAX(timestamp) as last_burst,
  user_agent
FROM blocked_requests
WHERE block_reason = 'burst_limit'
GROUP BY ip_address
ORDER BY burst_blocks DESC
LIMIT 20;
