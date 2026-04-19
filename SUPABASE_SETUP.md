## Run this in Supabase SQL Editor

```sql
CREATE TABLE collab_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  from_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  to_listing_id UUID NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
  to_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  from_user_email TEXT,
  message TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected')),
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_collab_requests_to_user ON collab_requests(to_user_id);
CREATE INDEX idx_collab_requests_to_listing ON collab_requests(to_listing_id);
CREATE INDEX idx_collab_requests_created_at ON collab_requests(created_at DESC);

ALTER TABLE collab_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view requests sent to them" ON collab_requests
  FOR SELECT USING (auth.uid() = to_user_id OR auth.uid() = from_user_id);

CREATE POLICY "Authenticated users can send requests" ON collab_requests
  FOR INSERT WITH CHECK (auth.uid() = from_user_id);

CREATE POLICY "Listing owners can update request status" ON collab_requests
  FOR UPDATE USING (auth.uid() = to_user_id);
```

## If the table already exists, just add the new column

```sql
ALTER TABLE collab_requests ADD COLUMN IF NOT EXISTS from_user_email TEXT;
```

## Chat tables (new)

```sql
CREATE TABLE chat_rooms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  is_group BOOLEAN DEFAULT false,
  name TEXT,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE chat_room_members (
  room_id UUID NOT NULL REFERENCES chat_rooms(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_read_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  PRIMARY KEY (room_id, user_id)
);

CREATE TABLE chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id UUID NOT NULL REFERENCES chat_rooms(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_chat_messages_room ON chat_messages(room_id, created_at DESC);
CREATE INDEX idx_chat_room_members_user ON chat_room_members(user_id);

ALTER TABLE chat_rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_room_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can view their rooms" ON chat_rooms
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM chat_room_members WHERE room_id = chat_rooms.id AND user_id = auth.uid())
  );

CREATE POLICY "Members can view room members" ON chat_room_members
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM chat_room_members m2 WHERE m2.room_id = chat_room_members.room_id AND m2.user_id = auth.uid())
  );

CREATE POLICY "Members can update their own membership" ON chat_room_members
  FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Members can read messages" ON chat_messages
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM chat_room_members WHERE room_id = chat_messages.room_id AND user_id = auth.uid())
  );

CREATE POLICY "Members can send messages" ON chat_messages
  FOR INSERT WITH CHECK (
    sender_id = auth.uid() AND
    EXISTS (SELECT 1 FROM chat_room_members WHERE room_id = chat_messages.room_id AND user_id = auth.uid())
  );

-- RPC to create DM rooms atomically (bypasses RLS for member inserts)
CREATE OR REPLACE FUNCTION create_dm_room(
  other_user_id UUID,
  initial_message TEXT DEFAULT NULL,
  initial_sender_id UUID DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  existing_room_id UUID;
  new_room_id UUID;
  msg_sender UUID;
BEGIN
  SELECT crm1.room_id INTO existing_room_id
  FROM chat_room_members crm1
  JOIN chat_room_members crm2 ON crm1.room_id = crm2.room_id
  JOIN chat_rooms cr ON cr.id = crm1.room_id
  WHERE crm1.user_id = auth.uid()
    AND crm2.user_id = other_user_id
    AND cr.is_group = false
  LIMIT 1;

  IF existing_room_id IS NOT NULL THEN
    RETURN existing_room_id;
  END IF;

  INSERT INTO chat_rooms (is_group, created_by) VALUES (false, auth.uid()) RETURNING id INTO new_room_id;
  INSERT INTO chat_room_members (room_id, user_id) VALUES (new_room_id, auth.uid());
  INSERT INTO chat_room_members (room_id, user_id) VALUES (new_room_id, other_user_id);

  IF initial_message IS NOT NULL AND initial_message != '' THEN
    msg_sender := COALESCE(initial_sender_id, auth.uid());
    INSERT INTO chat_messages (room_id, sender_id, content)
    VALUES (new_room_id, msg_sender, initial_message);
  END IF;

  RETURN new_room_id;
END;
$$;

-- Also enable realtime for chat_messages in Supabase Dashboard:
-- Database → Replication → add chat_messages to supabase_realtime publication
```

## Reviews table (new)

```sql
CREATE TABLE reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reviewer_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  reviewed_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  rating INT NOT NULL CHECK (rating BETWEEN 1 AND 5),
  message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE (reviewer_user_id, reviewed_user_id)
);

CREATE INDEX idx_reviews_reviewed_user ON reviews(reviewed_user_id);

ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;

-- Anyone logged in can read reviews
CREATE POLICY "Anyone can read reviews" ON reviews
  FOR SELECT USING (true);

-- Only the reviewer can insert their own review
CREATE POLICY "Authenticated users can submit reviews" ON reviews
  FOR INSERT WITH CHECK (auth.uid() = reviewer_user_id);

-- Reviewer can update their own review
CREATE POLICY "Reviewer can update their review" ON reviews
  FOR UPDATE USING (auth.uid() = reviewer_user_id);
```
