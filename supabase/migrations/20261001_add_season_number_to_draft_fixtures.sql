-- Migration: Add season_number to draft_fixtures for explicit database-level season tracking
ALTER TABLE draft_fixtures ADD COLUMN IF NOT EXISTS season_number integer DEFAULT 1;
CREATE INDEX IF NOT EXISTS idx_draft_fixtures_room_season ON draft_fixtures(room_id, season_number);
