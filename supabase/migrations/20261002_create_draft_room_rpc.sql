-- Migration: Atomic Draft Room Creation RPC
-- Executes room, host member, and host club inserts in a single PostgreSQL transaction.

CREATE OR REPLACE FUNCTION create_draft_room(
  p_room_id text,
  p_room_code text,
  p_name text,
  p_host_member_id text,
  p_rules jsonb,
  p_session_id text,
  p_username text,
  p_club_id text,
  p_club_name text,
  p_club_code text,
  p_primary_color text,
  p_secondary_color text,
  p_badge jsonb
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_result jsonb;
BEGIN
  -- 1. Insert room
  INSERT INTO multiplayer_rooms (
    id,
    room_code,
    name,
    host_member_id,
    status,
    rules,
    created_at,
    updated_at
  ) VALUES (
    p_room_id,
    p_room_code,
    p_name,
    p_host_member_id,
    'LOBBY',
    p_rules,
    now(),
    now()
  );

  -- 2. Insert host member
  INSERT INTO multiplayer_members (
    id,
    room_id,
    session_id,
    username,
    is_host,
    is_spectator,
    is_ready,
    club_id,
    is_connected,
    last_seen_at,
    joined_at
  ) VALUES (
    p_host_member_id,
    p_room_id,
    p_session_id,
    p_username,
    true,
    false,
    true,
    p_club_id,
    true,
    now(),
    now()
  );

  -- 3. Insert host club
  INSERT INTO draft_clubs (
    id,
    room_id,
    member_id,
    name,
    code,
    manager_name,
    primary_color,
    secondary_color,
    badge,
    squad_player_ids
  ) VALUES (
    p_club_id,
    p_room_id,
    p_host_member_id,
    p_club_name,
    p_club_code,
    p_username,
    p_primary_color,
    p_secondary_color,
    p_badge,
    '[]'::jsonb
  );

  v_result := jsonb_build_object(
    'success', true,
    'roomId', p_room_id,
    'roomCode', p_room_code
  );

  RETURN v_result;
EXCEPTION
  WHEN OTHERS THEN
    RAISE;
END;
$$;
