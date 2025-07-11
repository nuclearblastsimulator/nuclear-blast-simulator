-- Turso Database Schema for Nuclear Blast Simulator
-- This schema tracks detonation events while respecting user privacy

-- Main detonations table
CREATE TABLE IF NOT EXISTS detonations (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
  weapon_id TEXT NOT NULL,
  weapon_name TEXT NOT NULL,
  weapon_yield_kt REAL NOT NULL,
  city_id TEXT,
  city_name TEXT,
  country TEXT,
  latitude REAL,
  longitude REAL,
  blast_type TEXT CHECK(blast_type IN ('air', 'surface')),
  session_id TEXT NOT NULL,
  -- Aggregated data (no PII)
  continent TEXT,
  time_zone TEXT,
  day_of_week INTEGER,
  hour_of_day INTEGER
);

-- Aggregated stats table (for fast queries)
CREATE TABLE IF NOT EXISTS daily_stats (
  date DATE PRIMARY KEY,
  total_detonations INTEGER DEFAULT 0,
  unique_sessions INTEGER DEFAULT 0,
  total_yield_mt REAL DEFAULT 0,
  most_used_weapon TEXT,
  most_targeted_city TEXT,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Popular targets tracking
CREATE TABLE IF NOT EXISTS popular_targets (
  city_name TEXT PRIMARY KEY,
  country TEXT,
  detonation_count INTEGER DEFAULT 0,
  last_targeted DATETIME,
  total_yield_mt REAL DEFAULT 0
);

-- Weapon usage stats
CREATE TABLE IF NOT EXISTS weapon_stats (
  weapon_id TEXT PRIMARY KEY,
  weapon_name TEXT,
  usage_count INTEGER DEFAULT 0,
  last_used DATETIME,
  avg_yield_kt REAL
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_detonations_timestamp ON detonations(timestamp);
CREATE INDEX IF NOT EXISTS idx_detonations_weapon ON detonations(weapon_id);
CREATE INDEX IF NOT EXISTS idx_detonations_city ON detonations(city_id);
CREATE INDEX IF NOT EXISTS idx_detonations_session ON detonations(session_id);