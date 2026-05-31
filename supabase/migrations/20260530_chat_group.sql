-- ─── Add listing_id to existing chat_rooms table ─────────────────────────────
ALTER TABLE chat_rooms
  ADD COLUMN IF NOT EXISTS listing_id uuid REFERENCES listings(id) ON DELETE SET NULL;

-- ─── Indexes ──────────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS chat_messages_room_created ON chat_messages(room_id, created_at);
CREATE INDEX IF NOT EXISTS chat_room_members_user ON chat_room_members(user_id);

-- ─── RLS ──────────────────────────────────────────────────────────────────────
ALTER TABLE chat_rooms        ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_room_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages     ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "member can view room"      ON chat_rooms;
DROP POLICY IF EXISTS "member can view members"   ON chat_room_members;
DROP POLICY IF EXISTS "member can update own read" ON chat_room_members;
DROP POLICY IF EXISTS "member can read messages"  ON chat_messages;
DROP POLICY IF EXISTS "member can send messages"  ON chat_messages;

CREATE POLICY "member can view room" ON chat_rooms
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM chat_room_members
      WHERE room_id = chat_rooms.id AND user_id = auth.uid()
    )
  );

CREATE POLICY "member can view members" ON chat_room_members
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM chat_room_members m2
      WHERE m2.room_id = chat_room_members.room_id AND m2.user_id = auth.uid()
    )
  );

CREATE POLICY "member can update own read" ON chat_room_members
  FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "member can read messages" ON chat_messages
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM chat_room_members
      WHERE room_id = chat_messages.room_id AND user_id = auth.uid()
    )
  );

CREATE POLICY "member can send messages" ON chat_messages
  FOR INSERT WITH CHECK (
    sender_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM chat_room_members
      WHERE room_id = chat_messages.room_id AND user_id = auth.uid()
    )
  );

-- ─── DM room function ─────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION create_dm_room(
  other_user_id     uuid,
  initial_message   text DEFAULT NULL,
  initial_sender_id uuid DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql SECURITY DEFINER
AS $$
DECLARE
  v_room_id uuid;
BEGIN
  SELECT crm1.room_id INTO v_room_id
  FROM chat_room_members crm1
  JOIN chat_room_members crm2 ON crm1.room_id = crm2.room_id
  JOIN chat_rooms cr ON cr.id = crm1.room_id
  WHERE crm1.user_id = auth.uid()
    AND crm2.user_id = other_user_id
    AND cr.listing_id IS NULL
    AND cr.is_group = false
  LIMIT 1;

  IF v_room_id IS NULL THEN
    INSERT INTO chat_rooms (is_group, listing_id, created_by)
    VALUES (false, NULL, auth.uid())
    RETURNING id INTO v_room_id;

    INSERT INTO chat_room_members (room_id, user_id) VALUES
      (v_room_id, auth.uid()),
      (v_room_id, other_user_id)
    ON CONFLICT DO NOTHING;
  END IF;

  IF initial_message IS NOT NULL AND initial_sender_id IS NOT NULL THEN
    INSERT INTO chat_messages (room_id, sender_id, content)
    VALUES (v_room_id, initial_sender_id, initial_message);
  END IF;

  RETURN v_room_id;
END;
$$;

-- ─── Listing group room function ──────────────────────────────────────────────
CREATE OR REPLACE FUNCTION get_or_create_listing_room(
  p_listing_id    uuid,
  p_listing_title text,
  p_new_member_id uuid
)
RETURNS uuid
LANGUAGE plpgsql SECURITY DEFINER
AS $$
DECLARE
  v_room_id  uuid;
  v_host_id  uuid;
BEGIN
  SELECT user_id INTO v_host_id FROM listings WHERE id = p_listing_id;

  SELECT id INTO v_room_id FROM chat_rooms WHERE listing_id = p_listing_id LIMIT 1;

  IF v_room_id IS NULL THEN
    INSERT INTO chat_rooms (is_group, name, listing_id, created_by)
    VALUES (true, p_listing_title, p_listing_id, v_host_id)
    RETURNING id INTO v_room_id;

    INSERT INTO chat_room_members (room_id, user_id)
    VALUES (v_room_id, v_host_id)
    ON CONFLICT DO NOTHING;
  END IF;

  -- Add the applicant/invitee
  INSERT INTO chat_room_members (room_id, user_id)
  VALUES (v_room_id, p_new_member_id)
  ON CONFLICT DO NOTHING;

  -- Add whoever is calling (handles both host and invitee sides)
  INSERT INTO chat_room_members (room_id, user_id)
  VALUES (v_room_id, auth.uid())
  ON CONFLICT DO NOTHING;

  RETURN v_room_id;
END;
$$;
