-- Add user_avatar column to conversations table
ALTER TABLE conversations
ADD COLUMN IF NOT EXISTS user_avatar TEXT;

-- Add last_activity_at column to track conversation activity
ALTER TABLE conversations
ADD COLUMN IF NOT EXISTS last_activity_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Create index for faster queries on last_activity_at
CREATE INDEX IF NOT EXISTS idx_conversations_last_activity 
ON conversations(last_activity_at);

-- Function to update last_activity_at when a message is inserted
CREATE OR REPLACE FUNCTION update_conversation_activity()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE conversations
  SET last_activity_at = NOW()
  WHERE id = NEW.conversation_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update last_activity_at
DROP TRIGGER IF EXISTS trigger_update_conversation_activity ON messages;
CREATE TRIGGER trigger_update_conversation_activity
AFTER INSERT ON messages
FOR EACH ROW
EXECUTE FUNCTION update_conversation_activity();

-- Function to delete inactive conversations (older than 10 minutes)
CREATE OR REPLACE FUNCTION delete_inactive_conversations()
RETURNS void AS $$
BEGIN
  DELETE FROM conversations
  WHERE last_activity_at < NOW() - INTERVAL '10 minutes'
  AND status = 'active';
END;
$$ LANGUAGE plpgsql;
