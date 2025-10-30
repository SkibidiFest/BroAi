-- Modifier le trigger pour archiver au lieu de supprimer
DROP TRIGGER IF EXISTS update_conversation_activity ON messages;
DROP FUNCTION IF EXISTS update_last_activity();

-- Nouvelle fonction pour mettre à jour l'activité et archiver les conversations inactives
CREATE OR REPLACE FUNCTION update_last_activity()
RETURNS TRIGGER AS $$
BEGIN
  -- Mettre à jour last_activity_at pour la conversation
  UPDATE conversations
  SET last_activity_at = NOW()
  WHERE id = NEW.conversation_id;
  
  -- Archiver les conversations inactives (plus de 10 minutes sans activité)
  UPDATE conversations
  SET status = 'archived'
  WHERE status = 'active'
    AND last_activity_at < NOW() - INTERVAL '10 minutes';
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Recréer le trigger
CREATE TRIGGER update_conversation_activity
AFTER INSERT ON messages
FOR EACH ROW
EXECUTE FUNCTION update_last_activity();

-- Fonction pour compter les conversations actives
CREATE OR REPLACE FUNCTION count_active_conversations()
RETURNS INTEGER AS $$
DECLARE
  active_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO active_count
  FROM conversations
  WHERE status = 'active';
  
  RETURN active_count;
END;
$$ LANGUAGE plpgsql;
