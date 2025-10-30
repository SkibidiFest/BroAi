-- Changed cleanup interval from 24 hours to 10 minutes
-- Function to automatically delete archived conversations older than 10 minutes
CREATE OR REPLACE FUNCTION delete_old_archived_conversations()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Delete messages from old archived conversations first
  DELETE FROM messages
  WHERE conversation_id IN (
    SELECT id FROM conversations
    WHERE status = 'archived'
    AND last_activity_at < NOW() - INTERVAL '10 minutes'
  );

  -- Then delete the old archived conversations
  DELETE FROM conversations
  WHERE status = 'archived'
  AND last_activity_at < NOW() - INTERVAL '10 minutes';
END;
$$;

-- Optional: Create a scheduled job to run this function periodically
-- Note: This requires pg_cron extension which may not be available in all Supabase plans
-- If available, uncomment the following lines:
-- SELECT cron.schedule(
--   'delete-old-archived-conversations',
--   '*/5 * * * *', -- Run every 5 minutes
--   'SELECT delete_old_archived_conversations();'
-- );
