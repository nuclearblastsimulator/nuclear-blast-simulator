-- Add bot detection field to blocked_requests table

ALTER TABLE blocked_requests ADD COLUMN is_bot_suspected BOOLEAN DEFAULT 0;
ALTER TABLE blocked_requests ADD COLUMN activity_data TEXT;

-- Update the blocked_ips_summary view to include bot stats
DROP VIEW IF EXISTS blocked_ips_summary;
CREATE VIEW blocked_ips_summary AS
SELECT
  ip_address,
  COUNT(*) as total_blocks,
  SUM(CASE WHEN is_bot_suspected = 1 THEN 1 ELSE 0 END) as bot_blocks,
  MIN(timestamp) as first_blocked,
  MAX(timestamp) as last_blocked,
  COUNT(DISTINCT weapon_id) as unique_weapons_used,
  COUNT(DISTINCT city_name) as unique_cities_targeted,
  COUNT(DISTINCT session_id) as unique_sessions,
  GROUP_CONCAT(DISTINCT user_agent) as user_agents
FROM blocked_requests
GROUP BY ip_address
ORDER BY total_blocks DESC;

SELECT 'Bot detection columns added successfully' as status;
