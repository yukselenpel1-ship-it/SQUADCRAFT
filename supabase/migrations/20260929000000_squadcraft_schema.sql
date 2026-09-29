-- ============================================================================
-- SQUADCRAFT — DATABASE SCHEMA DEFINITION (PostgreSQL / Supabase)
-- Fictional Football Universe Management Architecture
-- ============================================================================

-- Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. USERS
CREATE TABLE IF NOT EXISTS public.users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email TEXT UNIQUE NOT NULL,
    username TEXT UNIQUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. MANAGERS
CREATE TABLE IF NOT EXISTS public.managers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    nationality TEXT NOT NULL DEFAULT 'Alveria',
    birth_date DATE NOT NULL,
    reputation INTEGER DEFAULT 50 CHECK (reputation BETWEEN 1 AND 100),
    preferred_formation TEXT DEFAULT '4-2-3-1',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. COMPETITIONS
CREATE TABLE IF NOT EXISTS public.competitions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    short_name TEXT NOT NULL,
    code VARCHAR(10) NOT NULL,
    country TEXT NOT NULL,
    tier INTEGER NOT NULL DEFAULT 1,
    type TEXT NOT NULL DEFAULT 'LEAGUE', -- 'LEAGUE' or 'CUP'
    reputation INTEGER DEFAULT 75 CHECK (reputation BETWEEN 1 AND 100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. CLUBS
CREATE TABLE IF NOT EXISTS public.clubs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    short_name TEXT NOT NULL,
    code VARCHAR(5) NOT NULL UNIQUE,
    city TEXT NOT NULL,
    stadium_name TEXT NOT NULL,
    stadium_capacity INTEGER NOT NULL DEFAULT 25000,
    reputation INTEGER NOT NULL DEFAULT 70 CHECK (reputation BETWEEN 1 AND 100),
    balance NUMERIC(15, 2) NOT NULL DEFAULT 25000000.00,
    transfer_budget NUMERIC(15, 2) NOT NULL DEFAULT 10000000.00,
    wage_budget NUMERIC(15, 2) NOT NULL DEFAULT 350000.00,
    primary_color VARCHAR(10) NOT NULL DEFAULT '#00F5A0',
    secondary_color VARCHAR(10) NOT NULL DEFAULT '#0F172A',
    manager_id UUID REFERENCES public.managers(id) ON DELETE SET NULL,
    competition_id UUID REFERENCES public.competitions(id) ON DELETE SET NULL,
    founded_year INTEGER DEFAULT 1928,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 5. PLAYERS
CREATE TABLE IF NOT EXISTS public.players (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    club_id UUID REFERENCES public.clubs(id) ON DELETE CASCADE,
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    nationality TEXT NOT NULL DEFAULT 'Alveria',
    age INTEGER NOT NULL CHECK (age BETWEEN 15 AND 45),
    birth_date DATE NOT NULL,
    position VARCHAR(5) NOT NULL,
    secondary_positions TEXT[] DEFAULT '{}',
    preferred_foot VARCHAR(10) NOT NULL DEFAULT 'Sağ',
    height INTEGER NOT NULL DEFAULT 182,
    weight INTEGER NOT NULL DEFAULT 76,
    
    -- Attributes (1-100)
    pace INTEGER NOT NULL DEFAULT 50 CHECK (pace BETWEEN 1 AND 100),
    acceleration INTEGER NOT NULL DEFAULT 50 CHECK (acceleration BETWEEN 1 AND 100),
    finishing INTEGER NOT NULL DEFAULT 50 CHECK (finishing BETWEEN 1 AND 100),
    long_shots INTEGER NOT NULL DEFAULT 50 CHECK (long_shots BETWEEN 1 AND 100),
    passing INTEGER NOT NULL DEFAULT 50 CHECK (passing BETWEEN 1 AND 100),
    vision INTEGER NOT NULL DEFAULT 50 CHECK (vision BETWEEN 1 AND 100),
    crossing INTEGER NOT NULL DEFAULT 50 CHECK (crossing BETWEEN 1 AND 100),
    dribbling INTEGER NOT NULL DEFAULT 50 CHECK (dribbling BETWEEN 1 AND 100),
    technique INTEGER NOT NULL DEFAULT 50 CHECK (technique BETWEEN 1 AND 100),
    tackling INTEGER NOT NULL DEFAULT 50 CHECK (tackling BETWEEN 1 AND 100),
    marking INTEGER NOT NULL DEFAULT 50 CHECK (marking BETWEEN 1 AND 100),
    positioning INTEGER NOT NULL DEFAULT 50 CHECK (positioning BETWEEN 1 AND 100),
    heading INTEGER NOT NULL DEFAULT 50 CHECK (heading BETWEEN 1 AND 100),
    strength INTEGER NOT NULL DEFAULT 50 CHECK (strength BETWEEN 1 AND 100),
    stamina INTEGER NOT NULL DEFAULT 50 CHECK (stamina BETWEEN 1 AND 100),
    aggression INTEGER NOT NULL DEFAULT 50 CHECK (aggression BETWEEN 1 AND 100),
    composure INTEGER NOT NULL DEFAULT 50 CHECK (composure BETWEEN 1 AND 100),
    decisions INTEGER NOT NULL DEFAULT 50 CHECK (decisions BETWEEN 1 AND 100),
    teamwork INTEGER NOT NULL DEFAULT 50 CHECK (teamwork BETWEEN 1 AND 100),
    leadership INTEGER NOT NULL DEFAULT 50 CHECK (leadership BETWEEN 1 AND 100),
    
    -- Goalkeeping (1-100)
    handling INTEGER NOT NULL DEFAULT 10 CHECK (handling BETWEEN 1 AND 100),
    reflexes INTEGER NOT NULL DEFAULT 10 CHECK (reflexes BETWEEN 1 AND 100),
    positioning_gk INTEGER NOT NULL DEFAULT 10 CHECK (positioning_gk BETWEEN 1 AND 100),
    kicking INTEGER NOT NULL DEFAULT 10 CHECK (kicking BETWEEN 1 AND 100),
    
    -- Status & Career
    overall INTEGER NOT NULL DEFAULT 65 CHECK (overall BETWEEN 1 AND 100),
    potential INTEGER NOT NULL DEFAULT 75 CHECK (potential BETWEEN 1 AND 100),
    morale INTEGER NOT NULL DEFAULT 80 CHECK (morale BETWEEN 1 AND 100),
    fitness INTEGER NOT NULL DEFAULT 100 CHECK (fitness BETWEEN 1 AND 100),
    form NUMERIC(3, 1) NOT NULL DEFAULT 7.0,
    market_value NUMERIC(15, 2) NOT NULL DEFAULT 1000000.00,
    wage NUMERIC(15, 2) NOT NULL DEFAULT 10000.00,
    contract_start DATE NOT NULL,
    contract_end DATE NOT NULL,
    is_injured BOOLEAN DEFAULT FALSE,
    is_suspended BOOLEAN DEFAULT FALSE,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 6. SEASONS
CREATE TABLE IF NOT EXISTS public.seasons (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    competition_id UUID REFERENCES public.competitions(id) ON DELETE CASCADE,
    year VARCHAR(10) NOT NULL,
    current_round INTEGER DEFAULT 1,
    total_rounds INTEGER DEFAULT 18,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 7. FIXTURES
CREATE TABLE IF NOT EXISTS public.fixtures (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    season_id UUID REFERENCES public.seasons(id) ON DELETE CASCADE,
    competition_id UUID REFERENCES public.competitions(id) ON DELETE CASCADE,
    round INTEGER NOT NULL,
    match_date DATE NOT NULL,
    match_time TIME NOT NULL DEFAULT '19:00:00',
    home_club_id UUID REFERENCES public.clubs(id) ON DELETE CASCADE,
    away_club_id UUID REFERENCES public.clubs(id) ON DELETE CASCADE,
    home_score INTEGER,
    away_score INTEGER,
    status VARCHAR(20) DEFAULT 'SCHEDULED', -- 'SCHEDULED', 'LIVE', 'FINISHED', 'POSTPONED'
    match_events JSONB DEFAULT '[]'::jsonb,
    match_stats JSONB DEFAULT '{}'::jsonb,
    referee TEXT,
    stadium TEXT,
    attendance INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 8. STANDINGS
CREATE TABLE IF NOT EXISTS public.standings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    season_id UUID REFERENCES public.seasons(id) ON DELETE CASCADE,
    club_id UUID REFERENCES public.clubs(id) ON DELETE CASCADE,
    rank INTEGER NOT NULL DEFAULT 1,
    played INTEGER NOT NULL DEFAULT 0,
    won INTEGER NOT NULL DEFAULT 0,
    drawn INTEGER NOT NULL DEFAULT 0,
    lost INTEGER NOT NULL DEFAULT 0,
    goals_for INTEGER NOT NULL DEFAULT 0,
    goals_against INTEGER NOT NULL DEFAULT 0,
    goal_difference INTEGER NOT NULL DEFAULT 0,
    points INTEGER NOT NULL DEFAULT 0,
    form TEXT[] DEFAULT '{}',
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE (season_id, club_id)
);

-- 9. CONTRACTS
CREATE TABLE IF NOT EXISTS public.contracts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    player_id UUID REFERENCES public.players(id) ON DELETE CASCADE,
    club_id UUID REFERENCES public.clubs(id) ON DELETE CASCADE,
    weekly_wage NUMERIC(12, 2) NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    release_clause NUMERIC(15, 2),
    status VARCHAR(20) DEFAULT 'ACTIVE',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 10. TRANSFERS
CREATE TABLE IF NOT EXISTS public.transfers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    player_id UUID REFERENCES public.players(id) ON DELETE CASCADE,
    from_club_id UUID REFERENCES public.clubs(id) ON DELETE SET NULL,
    to_club_id UUID REFERENCES public.clubs(id) ON DELETE SET NULL,
    fee NUMERIC(15, 2) NOT NULL,
    status VARCHAR(20) DEFAULT 'COMPLETED', -- 'PENDING', 'ACCEPTED', 'REJECTED', 'COMPLETED'
    transfer_date DATE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 11. TACTICS
CREATE TABLE IF NOT EXISTS public.tactics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    club_id UUID REFERENCES public.clubs(id) ON DELETE CASCADE,
    formation VARCHAR(20) NOT NULL DEFAULT '4-2-3-1',
    mentality VARCHAR(20) NOT NULL DEFAULT 'Dengeli',
    tempo VARCHAR(20) NOT NULL DEFAULT 'Standart',
    pressing VARCHAR(20) NOT NULL DEFAULT 'Orta',
    passing_style VARCHAR(20) NOT NULL DEFAULT 'Kısa',
    defensive_line VARCHAR(20) NOT NULL DEFAULT 'Standart',
    width VARCHAR(20) NOT NULL DEFAULT 'Dengeli',
    lineup_json JSONB NOT NULL DEFAULT '[]'::jsonb,
    substitutes_json JSONB NOT NULL DEFAULT '[]'::jsonb,
    instructions_json JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 12. INJURIES
CREATE TABLE IF NOT EXISTS public.injuries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    player_id UUID REFERENCES public.players(id) ON DELETE CASCADE,
    club_id UUID REFERENCES public.clubs(id) ON DELETE CASCADE,
    injury_name TEXT NOT NULL,
    severity VARCHAR(20) NOT NULL DEFAULT 'Orta',
    recovery_days INTEGER NOT NULL DEFAULT 14,
    start_date DATE NOT NULL,
    is_recovered BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 13. SUSPENSIONS
CREATE TABLE IF NOT EXISTS public.suspensions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    player_id UUID REFERENCES public.players(id) ON DELETE CASCADE,
    club_id UUID REFERENCES public.clubs(id) ON DELETE CASCADE,
    competition_id UUID REFERENCES public.competitions(id) ON DELETE CASCADE,
    reason TEXT NOT NULL,
    matches_remaining INTEGER NOT NULL DEFAULT 1,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 14. MESSAGES (Inbox)
CREATE TABLE IF NOT EXISTS public.messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    club_id UUID REFERENCES public.clubs(id) ON DELETE CASCADE,
    sender_name TEXT NOT NULL,
    sender_role TEXT NOT NULL,
    subject TEXT NOT NULL,
    body TEXT NOT NULL,
    category VARCHAR(20) NOT NULL DEFAULT 'BOARD',
    priority VARCHAR(10) NOT NULL DEFAULT 'NORMAL',
    is_read BOOLEAN NOT NULL DEFAULT FALSE,
    action_type VARCHAR(30),
    action_payload JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Indexes for optimal lookup performance
CREATE INDEX IF NOT EXISTS idx_players_club_id ON public.players(club_id);
CREATE INDEX IF NOT EXISTS idx_players_position ON public.players(position);
CREATE INDEX IF NOT EXISTS idx_fixtures_season_round ON public.fixtures(season_id, round);
CREATE INDEX IF NOT EXISTS idx_fixtures_clubs ON public.fixtures(home_club_id, away_club_id);
CREATE INDEX IF NOT EXISTS idx_standings_season ON public.standings(season_id, rank);
CREATE INDEX IF NOT EXISTS idx_messages_club_read ON public.messages(club_id, is_read);
