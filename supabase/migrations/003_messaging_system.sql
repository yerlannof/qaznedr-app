-- Messaging System Tables
-- Enable real-time for messaging

-- Conversations table
CREATE TABLE IF NOT EXISTS conversations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  type VARCHAR(20) NOT NULL DEFAULT 'direct', -- direct, group, support
  title VARCHAR(255),
  description TEXT,
  avatar_url TEXT,
  last_message_at TIMESTAMPTZ,
  last_message_text TEXT,
  last_message_sender_id UUID REFERENCES auth.users(id),
  deposit_id UUID REFERENCES kazakhstan_deposits(id) ON DELETE CASCADE, -- For deposit-related conversations
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE, -- For company-related conversations
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  metadata JSONB DEFAULT '{}'::jsonb
);

-- Conversation participants
CREATE TABLE IF NOT EXISTS conversation_participants (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  role VARCHAR(20) DEFAULT 'member', -- admin, moderator, member
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  last_read_at TIMESTAMPTZ,
  unread_count INTEGER DEFAULT 0,
  is_muted BOOLEAN DEFAULT FALSE,
  is_pinned BOOLEAN DEFAULT FALSE,
  notification_enabled BOOLEAN DEFAULT TRUE,
  UNIQUE(conversation_id, user_id)
);

-- Messages table
CREATE TABLE IF NOT EXISTS messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE,
  sender_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  reply_to_id UUID REFERENCES messages(id) ON DELETE SET NULL,
  content TEXT NOT NULL,
  type VARCHAR(20) DEFAULT 'text', -- text, image, file, system, offer
  attachments JSONB DEFAULT '[]'::jsonb,
  metadata JSONB DEFAULT '{}'::jsonb,
  is_edited BOOLEAN DEFAULT FALSE,
  edited_at TIMESTAMPTZ,
  is_deleted BOOLEAN DEFAULT FALSE,
  deleted_at TIMESTAMPTZ,
  reactions JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Message read receipts
CREATE TABLE IF NOT EXISTS message_read_receipts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  message_id UUID REFERENCES messages(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  read_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(message_id, user_id)
);

-- Notification preferences
CREATE TABLE IF NOT EXISTS notification_preferences (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  email_enabled BOOLEAN DEFAULT TRUE,
  push_enabled BOOLEAN DEFAULT TRUE,
  sms_enabled BOOLEAN DEFAULT FALSE,
  message_notifications BOOLEAN DEFAULT TRUE,
  bid_notifications BOOLEAN DEFAULT TRUE,
  listing_notifications BOOLEAN DEFAULT TRUE,
  newsletter_enabled BOOLEAN DEFAULT TRUE,
  quiet_hours_start TIME,
  quiet_hours_end TIME,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- User presence tracking
CREATE TABLE IF NOT EXISTS user_presence (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  status VARCHAR(20) DEFAULT 'offline', -- online, away, busy, offline
  last_seen_at TIMESTAMPTZ DEFAULT NOW(),
  is_typing_in UUID REFERENCES conversations(id) ON DELETE SET NULL,
  typing_started_at TIMESTAMPTZ,
  device_info JSONB DEFAULT '{}'::jsonb
);

-- Indexes for performance
CREATE INDEX idx_conversations_deposit_id ON conversations(deposit_id) WHERE deposit_id IS NOT NULL;
CREATE INDEX idx_conversations_company_id ON conversations(company_id) WHERE company_id IS NOT NULL;
CREATE INDEX idx_conversations_last_message_at ON conversations(last_message_at DESC);
CREATE INDEX idx_conversation_participants_user_id ON conversation_participants(user_id);
CREATE INDEX idx_conversation_participants_conversation_id ON conversation_participants(conversation_id);
CREATE INDEX idx_messages_conversation_id ON messages(conversation_id);
CREATE INDEX idx_messages_sender_id ON messages(sender_id);
CREATE INDEX idx_messages_created_at ON messages(created_at DESC);
CREATE INDEX idx_message_read_receipts_message_id ON message_read_receipts(message_id);
CREATE INDEX idx_message_read_receipts_user_id ON message_read_receipts(user_id);
CREATE INDEX idx_user_presence_user_id ON user_presence(user_id);
CREATE INDEX idx_user_presence_status ON user_presence(status);

-- Enable real-time
ALTER PUBLICATION supabase_realtime ADD TABLE conversations;
ALTER PUBLICATION supabase_realtime ADD TABLE messages;
ALTER PUBLICATION supabase_realtime ADD TABLE user_presence;

-- Triggers for updating timestamps
CREATE OR REPLACE FUNCTION update_conversation_last_message()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE conversations
  SET 
    last_message_at = NEW.created_at,
    last_message_text = NEW.content,
    last_message_sender_id = NEW.sender_id,
    updated_at = NOW()
  WHERE id = NEW.conversation_id;
  
  -- Update unread count for all participants except sender
  UPDATE conversation_participants
  SET unread_count = unread_count + 1
  WHERE conversation_id = NEW.conversation_id
    AND user_id != NEW.sender_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_conversation_last_message
AFTER INSERT ON messages
FOR EACH ROW
EXECUTE FUNCTION update_conversation_last_message();

-- Function to mark messages as read
CREATE OR REPLACE FUNCTION mark_messages_as_read(
  p_conversation_id UUID,
  p_user_id UUID
)
RETURNS VOID AS $$
BEGIN
  -- Insert read receipts for unread messages
  INSERT INTO message_read_receipts (message_id, user_id)
  SELECT m.id, p_user_id
  FROM messages m
  WHERE m.conversation_id = p_conversation_id
    AND m.sender_id != p_user_id
    AND NOT EXISTS (
      SELECT 1 FROM message_read_receipts r
      WHERE r.message_id = m.id AND r.user_id = p_user_id
    );
  
  -- Reset unread count
  UPDATE conversation_participants
  SET 
    unread_count = 0,
    last_read_at = NOW()
  WHERE conversation_id = p_conversation_id
    AND user_id = p_user_id;
END;
$$ LANGUAGE plpgsql;

-- Function to create a direct conversation
CREATE OR REPLACE FUNCTION create_direct_conversation(
  p_user1_id UUID,
  p_user2_id UUID,
  p_deposit_id UUID DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  v_conversation_id UUID;
BEGIN
  -- Check if direct conversation already exists
  SELECT c.id INTO v_conversation_id
  FROM conversations c
  JOIN conversation_participants cp1 ON c.id = cp1.conversation_id AND cp1.user_id = p_user1_id
  JOIN conversation_participants cp2 ON c.id = cp2.conversation_id AND cp2.user_id = p_user2_id
  WHERE c.type = 'direct'
  LIMIT 1;
  
  IF v_conversation_id IS NULL THEN
    -- Create new conversation
    INSERT INTO conversations (type, deposit_id, created_by)
    VALUES ('direct', p_deposit_id, p_user1_id)
    RETURNING id INTO v_conversation_id;
    
    -- Add participants
    INSERT INTO conversation_participants (conversation_id, user_id)
    VALUES 
      (v_conversation_id, p_user1_id),
      (v_conversation_id, p_user2_id);
  END IF;
  
  RETURN v_conversation_id;
END;
$$ LANGUAGE plpgsql;

-- RLS Policies
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversation_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE message_read_receipts ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_presence ENABLE ROW LEVEL SECURITY;

-- Conversations: Users can see conversations they're part of
CREATE POLICY "Users can view their conversations" ON conversations
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM conversation_participants
      WHERE conversation_id = conversations.id
        AND user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create conversations" ON conversations
  FOR INSERT WITH CHECK (created_by = auth.uid());

CREATE POLICY "Conversation admins can update" ON conversations
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM conversation_participants
      WHERE conversation_id = conversations.id
        AND user_id = auth.uid()
        AND role = 'admin'
    )
  );

-- Participants: Users can see participants of their conversations
CREATE POLICY "Users can view participants" ON conversation_participants
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM conversation_participants cp
      WHERE cp.conversation_id = conversation_participants.conversation_id
        AND cp.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update their participation" ON conversation_participants
  FOR UPDATE USING (user_id = auth.uid());

-- Messages: Users can see messages in their conversations
CREATE POLICY "Users can view messages" ON messages
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM conversation_participants
      WHERE conversation_id = messages.conversation_id
        AND user_id = auth.uid()
    )
  );

CREATE POLICY "Users can send messages" ON messages
  FOR INSERT WITH CHECK (
    sender_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM conversation_participants
      WHERE conversation_id = messages.conversation_id
        AND user_id = auth.uid()
    )
  );

CREATE POLICY "Users can edit their messages" ON messages
  FOR UPDATE USING (sender_id = auth.uid());

-- Read receipts
CREATE POLICY "Users can view read receipts" ON message_read_receipts
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM messages m
      JOIN conversation_participants cp ON m.conversation_id = cp.conversation_id
      WHERE m.id = message_read_receipts.message_id
        AND cp.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can mark messages as read" ON message_read_receipts
  FOR INSERT WITH CHECK (user_id = auth.uid());

-- Notification preferences
CREATE POLICY "Users can view their preferences" ON notification_preferences
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can update their preferences" ON notification_preferences
  FOR ALL USING (user_id = auth.uid());

-- User presence
CREATE POLICY "Anyone can view presence" ON user_presence
  FOR SELECT USING (true);

CREATE POLICY "Users can update their presence" ON user_presence
  FOR ALL USING (user_id = auth.uid());

-- Grant permissions
GRANT ALL ON conversations TO authenticated;
GRANT ALL ON conversation_participants TO authenticated;
GRANT ALL ON messages TO authenticated;
GRANT ALL ON message_read_receipts TO authenticated;
GRANT ALL ON notification_preferences TO authenticated;
GRANT ALL ON user_presence TO authenticated;