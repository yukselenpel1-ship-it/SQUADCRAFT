-- ============================================================================
-- SQUADCRAFT v0.5.5-alpha: FIX MULTIPLAYER PRODUCTION SCHEMA & RLS POLICIES
-- File: supabase/migrations/20260929_fix_multiplayer_production_schema.sql
-- ============================================================================

-- 1. Ensure multiplayer_rooms has all required columns and indices
CREATE TABLE IF NOT EXISTS multiplayer_rooms (
  id TEXT PRIMARY KEY,
  room_code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  host_member_id TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'LOBBY',
  rules JSONB NOT NULL DEFAULT '{}'::jsonb,
  state_version INT NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Add state_version column if it was created before
ALTER TABLE multiplayer_rooms ADD COLUMN IF NOT EXISTS state_version INT NOT NULL DEFAULT 1;

CREATE INDEX IF NOT EXISTS idx_rooms_code ON multiplayer_rooms (room_code);
CREATE INDEX IF NOT EXISTS idx_rooms_status ON multiplayer_rooms (status);

-- 2. Ensure multiplayer_members has all required columns and indices
CREATE TABLE IF NOT EXISTS multiplayer_members (
  id TEXT PRIMARY KEY,
  room_id TEXT NOT NULL REFERENCES multiplayer_rooms(id) ON DELETE CASCADE,
  session_id TEXT NOT NULL,
  username TEXT NOT NULL,
  is_host BOOLEAN NOT NULL DEFAULT FALSE,
  is_spectator BOOLEAN NOT NULL DEFAULT FALSE,
  is_ready BOOLEAN NOT NULL DEFAULT FALSE,
  club_id TEXT,
  is_connected BOOLEAN NOT NULL DEFAULT TRUE,
  last_seen_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_members_room ON multiplayer_members (room_id);
CREATE INDEX IF NOT EXISTS idx_members_session ON multiplayer_members (session_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_members_room_session ON multiplayer_members (room_id, session_id);

-- 3. Ensure draft_clubs has all required columns
CREATE TABLE IF NOT EXISTS draft_clubs (
  id TEXT PRIMARY KEY,
  room_id TEXT NOT NULL REFERENCES multiplayer_rooms(id) ON DELETE CASCADE,
  member_id TEXT NOT NULL REFERENCES multiplayer_members(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  code TEXT NOT NULL,
  manager_name TEXT NOT NULL,
  primary_color TEXT NOT NULL,
  secondary_color TEXT NOT NULL,
  badge JSONB NOT NULL DEFAULT '{}'::jsonb,
  squad_player_ids TEXT[] NOT NULL DEFAULT '{}'
);

CREATE INDEX IF NOT EXISTS idx_clubs_room ON draft_clubs (room_id);

-- 4. Ensure draft_picks has all required columns
CREATE TABLE IF NOT EXISTS draft_picks (
  id TEXT PRIMARY KEY,
  room_id TEXT NOT NULL REFERENCES multiplayer_rooms(id) ON DELETE CASCADE,
  round INT NOT NULL,
  pick_index_in_round INT NOT NULL,
  global_pick_number INT NOT NULL,
  member_id TEXT NOT NULL REFERENCES multiplayer_members(id),
  club_id TEXT NOT NULL REFERENCES draft_clubs(id),
  player_id TEXT NOT NULL,
  selected_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  is_auto_pick BOOLEAN NOT NULL DEFAULT FALSE,
  time_taken_seconds INT NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_picks_room ON draft_picks (room_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_picks_room_player ON draft_picks (room_id, player_id);

-- 5. Ensure draft_fixtures has all required columns
CREATE TABLE IF NOT EXISTS draft_fixtures (
  id TEXT PRIMARY KEY,
  room_id TEXT NOT NULL REFERENCES multiplayer_rooms(id) ON DELETE CASCADE,
  round INT NOT NULL,
  home_club_id TEXT NOT NULL REFERENCES draft_clubs(id),
  away_club_id TEXT NOT NULL REFERENCES draft_clubs(id),
  status TEXT NOT NULL DEFAULT 'AWAITING_TACTICS',
  home_tactics JSONB,
  away_tactics JSONB,
  home_score INT,
  away_score INT,
  match_result JSONB,
  seed TEXT,
  simulated_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_fixtures_room ON draft_fixtures (room_id);

-- 6. Ensure draft_standings has all required columns
CREATE TABLE IF NOT EXISTS draft_standings (
  id BIGSERIAL PRIMARY KEY,
  room_id TEXT NOT NULL REFERENCES multiplayer_rooms(id) ON DELETE CASCADE,
  club_id TEXT NOT NULL REFERENCES draft_clubs(id),
  rank INT NOT NULL,
  played INT NOT NULL DEFAULT 0,
  won INT NOT NULL DEFAULT 0,
  drawn INT NOT NULL DEFAULT 0,
  lost INT NOT NULL DEFAULT 0,
  goals_for INT NOT NULL DEFAULT 0,
  goals_against INT NOT NULL DEFAULT 0,
  goal_difference INT NOT NULL DEFAULT 0,
  points INT NOT NULL DEFAULT 0,
  form TEXT[] NOT NULL DEFAULT '{}'
);

CREATE INDEX IF NOT EXISTS idx_standings_room ON draft_standings (room_id);

-- 7. Ensure multiplayer_feedback has all required columns
CREATE TABLE IF NOT EXISTS multiplayer_feedback (
  id TEXT PRIMARY KEY,
  room_id TEXT,
  session_id TEXT NOT NULL,
  route TEXT NOT NULL,
  category TEXT NOT NULL,
  comment TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 8. Ensure multiplayer_telemetry has all required columns
CREATE TABLE IF NOT EXISTS multiplayer_telemetry (
  id TEXT PRIMARY KEY,
  room_id TEXT,
  event_type TEXT NOT NULL,
  data JSONB NOT NULL DEFAULT '{}'::jsonb,
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES CLEANUP & PROPER FULL ANONYMOUS ACCESS
-- ============================================================================

ALTER TABLE multiplayer_rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE multiplayer_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE draft_clubs ENABLE ROW LEVEL SECURITY;
ALTER TABLE draft_picks ENABLE ROW LEVEL SECURITY;
ALTER TABLE draft_fixtures ENABLE ROW LEVEL SECURITY;
ALTER TABLE draft_standings ENABLE ROW LEVEL SECURITY;
ALTER TABLE multiplayer_feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE multiplayer_telemetry ENABLE ROW LEVEL SECURITY;

-- Drop old policies to avoid conflicts
DO $$
BEGIN
  -- multiplayer_rooms
  DROP POLICY IF EXISTS "Public read rooms" ON multiplayer_rooms;
  DROP POLICY IF EXISTS "Public insert rooms" ON multiplayer_rooms;
  DROP POLICY IF EXISTS "Public update rooms" ON multiplayer_rooms;
  DROP POLICY IF EXISTS "Public delete rooms" ON multiplayer_rooms;
  DROP POLICY IF EXISTS "Allow all on multiplayer_rooms" ON multiplayer_rooms;

  -- multiplayer_members
  DROP POLICY IF EXISTS "Public read members" ON multiplayer_members;
  DROP POLICY IF EXISTS "Public insert members" ON multiplayer_members;
  DROP POLICY IF EXISTS "Public update members" ON multiplayer_members;
  DROP POLICY IF EXISTS "Public delete members" ON multiplayer_members;
  DROP POLICY IF EXISTS "Allow all on multiplayer_members" ON multiplayer_members;

  -- draft_clubs
  DROP POLICY IF EXISTS "Public read clubs" ON draft_clubs;
  DROP POLICY IF EXISTS "Public insert clubs" ON draft_clubs;
  DROP POLICY IF EXISTS "Public update clubs" ON draft_clubs;
  DROP POLICY IF EXISTS "Public delete clubs" ON draft_clubs;
  DROP POLICY IF EXISTS "Allow all on draft_clubs" ON draft_clubs;

  -- draft_picks
  DROP POLICY IF EXISTS "Public read picks" ON draft_picks;
  DROP POLICY IF EXISTS "Public insert picks" ON draft_picks;
  DROP POLICY IF EXISTS "Public update picks" ON draft_picks;
  DROP POLICY IF EXISTS "Public delete picks" ON draft_picks;
  DROP POLICY IF EXISTS "Allow all on draft_picks" ON draft_picks;

  -- draft_fixtures
  DROP POLICY IF EXISTS "Public read fixtures" ON draft_fixtures;
  DROP POLICY IF EXISTS "Public insert fixtures" ON draft_fixtures;
  DROP POLICY IF EXISTS "Public update fixtures" ON draft_fixtures;
  DROP POLICY IF EXISTS "Public delete fixtures" ON draft_fixtures;
  DROP POLICY IF EXISTS "Allow all on draft_fixtures" ON draft_fixtures;

  -- draft_standings
  DROP POLICY IF EXISTS "Public read standings" ON draft_standings;
  DROP POLICY IF EXISTS "Public insert standings" ON draft_standings;
  DROP POLICY IF EXISTS "Public update standings" ON draft_standings;
  DROP POLICY IF EXISTS "Public delete standings" ON draft_standings;
  DROP POLICY IF EXISTS "Allow all on draft_standings" ON draft_standings;

  -- multiplayer_feedback
  DROP POLICY IF EXISTS "Public insert feedback" ON multiplayer_feedback;
  DROP POLICY IF EXISTS "Public read feedback" ON multiplayer_feedback;
  DROP POLICY IF EXISTS "Allow all on multiplayer_feedback" ON multiplayer_feedback;

  -- multiplayer_telemetry
  DROP POLICY IF EXISTS "Public insert telemetry" ON multiplayer_telemetry;
  DROP POLICY IF EXISTS "Public read telemetry" ON multiplayer_telemetry;
  DROP POLICY IF EXISTS "Allow all on multiplayer_telemetry" ON multiplayer_telemetry;
END $$;

-- Create comprehensive all-operations policies for anonymous & authenticated clients
CREATE POLICY "Allow all on multiplayer_rooms" ON multiplayer_rooms FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on multiplayer_members" ON multiplayer_members FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on draft_clubs" ON draft_clubs FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on draft_picks" ON draft_picks FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on draft_fixtures" ON draft_fixtures FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on draft_standings" ON draft_standings FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on multiplayer_feedback" ON multiplayer_feedback FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on multiplayer_telemetry" ON multiplayer_telemetry FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

-- Enable Supabase Realtime Publication for Multiplayer tables
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
    CREATE PUBLICATION supabase_realtime;
  END IF;
  
  ALTER PUBLICATION supabase_realtime ADD TABLE multiplayer_rooms;
  ALTER PUBLICATION supabase_realtime ADD TABLE multiplayer_members;
  ALTER PUBLICATION supabase_realtime ADD TABLE draft_clubs;
  ALTER PUBLICATION supabase_realtime ADD TABLE draft_picks;
  ALTER PUBLICATION supabase_realtime ADD TABLE draft_fixtures;
  ALTER PUBLICATION supabase_realtime ADD TABLE draft_standings;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;
