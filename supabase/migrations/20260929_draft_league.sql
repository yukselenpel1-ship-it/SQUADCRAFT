-- ============================================================================
-- SQUADCRAFT v0.5.5-alpha: MULTIPLAYER DRAFT LEAGUE SCHEMA & RLS
-- ============================================================================

-- 1. Multiplayer Rooms
CREATE TABLE IF NOT EXISTS multiplayer_rooms (
  id TEXT PRIMARY KEY,
  room_code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  host_member_id TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'LOBBY', -- 'LOBBY', 'DRAFTING', 'LEAGUE_ACTIVE', 'LEAGUE_COMPLETED', 'ARCHIVED'
  rules JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_rooms_code ON multiplayer_rooms (room_code);
CREATE INDEX IF NOT EXISTS idx_rooms_status ON multiplayer_rooms (status);

-- 2. Room Members
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

-- 3. Draft Clubs
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

-- 4. Draft Picks
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

-- 5. Draft Fixtures
CREATE TABLE IF NOT EXISTS draft_fixtures (
  id TEXT PRIMARY KEY,
  room_id TEXT NOT NULL REFERENCES multiplayer_rooms(id) ON DELETE CASCADE,
  round INT NOT NULL,
  home_club_id TEXT NOT NULL REFERENCES draft_clubs(id),
  away_club_id TEXT NOT NULL REFERENCES draft_clubs(id),
  status TEXT NOT NULL DEFAULT 'AWAITING_TACTICS', -- 'AWAITING_TACTICS', 'READY', 'SIMULATING', 'COMPLETED'
  home_tactics JSONB,
  away_tactics JSONB,
  home_score INT,
  away_score INT,
  match_result JSONB,
  seed TEXT,
  simulated_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_fixtures_room ON draft_fixtures (room_id);

-- 6. Draft Standings
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

-- 7. Multiplayer Feedback
CREATE TABLE IF NOT EXISTS multiplayer_feedback (
  id TEXT PRIMARY KEY,
  room_id TEXT,
  session_id TEXT NOT NULL,
  route TEXT NOT NULL,
  category TEXT NOT NULL,
  comment TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 8. Multiplayer Telemetry
CREATE TABLE IF NOT EXISTS multiplayer_telemetry (
  id TEXT PRIMARY KEY,
  room_id TEXT,
  event_type TEXT NOT NULL,
  data JSONB NOT NULL DEFAULT '{}'::jsonb,
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================

ALTER TABLE multiplayer_rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE multiplayer_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE draft_clubs ENABLE ROW LEVEL SECURITY;
ALTER TABLE draft_picks ENABLE ROW LEVEL SECURITY;
ALTER TABLE draft_fixtures ENABLE ROW LEVEL SECURITY;
ALTER TABLE draft_standings ENABLE ROW LEVEL SECURITY;
ALTER TABLE multiplayer_feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE multiplayer_telemetry ENABLE ROW LEVEL SECURITY;

-- Public read access for room participants & spectators
CREATE POLICY "Public read rooms" ON multiplayer_rooms FOR SELECT USING (true);
CREATE POLICY "Public read members" ON multiplayer_members FOR SELECT USING (true);
CREATE POLICY "Public read clubs" ON draft_clubs FOR SELECT USING (true);
CREATE POLICY "Public read picks" ON draft_picks FOR SELECT USING (true);
CREATE POLICY "Public read fixtures" ON draft_fixtures FOR SELECT USING (true);
CREATE POLICY "Public read standings" ON draft_standings FOR SELECT USING (true);

-- Insert & Update policies
CREATE POLICY "Public insert rooms" ON multiplayer_rooms FOR INSERT WITH CHECK (true);
CREATE POLICY "Public update rooms" ON multiplayer_rooms FOR UPDATE USING (true);

CREATE POLICY "Public insert members" ON multiplayer_members FOR INSERT WITH CHECK (true);
CREATE POLICY "Public update members" ON multiplayer_members FOR UPDATE USING (true);

CREATE POLICY "Public insert clubs" ON draft_clubs FOR INSERT WITH CHECK (true);
CREATE POLICY "Public update clubs" ON draft_clubs FOR UPDATE USING (true);

CREATE POLICY "Public insert picks" ON draft_picks FOR INSERT WITH CHECK (true);
CREATE POLICY "Public update fixtures" ON draft_fixtures FOR UPDATE USING (true);
CREATE POLICY "Public insert standings" ON draft_standings FOR ALL USING (true);

CREATE POLICY "Public insert feedback" ON multiplayer_feedback FOR INSERT WITH CHECK (true);
CREATE POLICY "Public insert telemetry" ON multiplayer_telemetry FOR INSERT WITH CHECK (true);

-- Enable Supabase Realtime Publication for Multiplayer tables
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'multiplayer_rooms'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE multiplayer_rooms;
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'multiplayer_members'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE multiplayer_members;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'draft_clubs'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE draft_clubs;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'draft_picks'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE draft_picks;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'draft_fixtures'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE draft_fixtures;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'draft_standings'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE draft_standings;
  END IF;
END $$;

