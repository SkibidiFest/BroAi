-- Fonction pour nettoyer les conversations vides et inactives
CREATE OR REPLACE FUNCTION cleanup_empty_conversations()
RETURNS void AS $$
BEGIN
  -- Archiver les conversations qui n'ont aucun message et qui ont plus de 2 minutes
  UPDATE conversations
  SET status = 'archived'
  WHERE status = 'active'
    AND id NOT IN (SELECT DISTINCT conversation_id FROM messages)
    AND created_at < NOW() - INTERVAL '2 minutes';
END;
$$ LANGUAGE plpgsql;

-- Modifier la fonction update_last_activity pour nettoyer aussi les conversations vides
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
  
  -- Nettoyer les conversations vides de plus de 2 minutes
  PERFORM cleanup_empty_conversations();
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
