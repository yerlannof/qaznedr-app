-- Migration: Add Row Level Security (RLS) policies
-- Date: 2024-01-01
-- Description: Implement security policies for data access control

-- Enable RLS on all tables
ALTER TABLE kazakhstan_deposits ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE favorites ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Policies for kazakhstan_deposits table
-- Public can view active listings
CREATE POLICY "Public can view active listings" ON kazakhstan_deposits
FOR SELECT USING (
  status = 'ACTIVE' OR 
  user_id = auth.uid()
);

-- Users can insert their own listings
CREATE POLICY "Users can insert own listings" ON kazakhstan_deposits
FOR INSERT WITH CHECK (
  auth.uid() = user_id
);

-- Users can update their own listings
CREATE POLICY "Users can update own listings" ON kazakhstan_deposits
FOR UPDATE USING (
  auth.uid() = user_id
);

-- Users can delete their own listings
CREATE POLICY "Users can delete own listings" ON kazakhstan_deposits
FOR DELETE USING (
  auth.uid() = user_id
);

-- Policies for profiles table
-- Public can view profiles
CREATE POLICY "Public profiles are viewable by everyone" ON profiles
FOR SELECT USING (true);

-- Users can update own profile
CREATE POLICY "Users can update own profile" ON profiles
FOR UPDATE USING (
  auth.uid() = id
);

-- Users can insert own profile
CREATE POLICY "Users can insert own profile" ON profiles
FOR INSERT WITH CHECK (
  auth.uid() = id
);

-- Policies for favorites table
-- Users can view their own favorites
CREATE POLICY "Users can view own favorites" ON favorites
FOR SELECT USING (
  auth.uid() = user_id
);

-- Users can manage their own favorites
CREATE POLICY "Users can insert own favorites" ON favorites
FOR INSERT WITH CHECK (
  auth.uid() = user_id
);

CREATE POLICY "Users can delete own favorites" ON favorites
FOR DELETE USING (
  auth.uid() = user_id
);

-- Policies for messages table
-- Users can view messages they sent or received
CREATE POLICY "Users can view own messages" ON messages
FOR SELECT USING (
  auth.uid() = sender_id OR 
  auth.uid() = receiver_id
);

-- Users can send messages
CREATE POLICY "Users can send messages" ON messages
FOR INSERT WITH CHECK (
  auth.uid() = sender_id
);

-- Users can update their own messages
CREATE POLICY "Users can update own messages" ON messages
FOR UPDATE USING (
  auth.uid() = sender_id AND 
  created_at > NOW() - INTERVAL '15 minutes'
);

-- Policies for notifications table
-- Users can view their own notifications
CREATE POLICY "Users can view own notifications" ON notifications
FOR SELECT USING (
  auth.uid() = user_id
);

-- System can create notifications (service role)
CREATE POLICY "System can create notifications" ON notifications
FOR INSERT WITH CHECK (
  auth.uid() IS NOT NULL
);

-- Users can update their own notifications (mark as read)
CREATE POLICY "Users can update own notifications" ON notifications
FOR UPDATE USING (
  auth.uid() = user_id
);

-- Create function to automatically set user_id
CREATE OR REPLACE FUNCTION set_user_id()
RETURNS trigger AS $$
BEGIN
  NEW.user_id = auth.uid();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create triggers to auto-set user_id
CREATE TRIGGER set_user_id_on_deposits
BEFORE INSERT ON kazakhstan_deposits
FOR EACH ROW
EXECUTE FUNCTION set_user_id();

CREATE TRIGGER set_user_id_on_favorites
BEFORE INSERT ON favorites
FOR EACH ROW
EXECUTE FUNCTION set_user_id();

-- Create function for checking ownership
CREATE OR REPLACE FUNCTION is_owner(table_name text, record_id uuid)
RETURNS boolean AS $$
DECLARE
  owner_id uuid;
BEGIN
  EXECUTE format('SELECT user_id FROM %I WHERE id = $1', table_name) 
  INTO owner_id USING record_id;
  
  RETURN owner_id = auth.uid();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;