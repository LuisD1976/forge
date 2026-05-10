-- ============================================================
-- FORGE Notifications Schema — run in Supabase SQL Editor
-- ============================================================

CREATE TABLE IF NOT EXISTS notifications (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,  -- recipient
  actor_id   UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,  -- who triggered it
  type       TEXT NOT NULL CHECK (type IN ('like', 'comment', 'follow')),
  post_id    UUID REFERENCES social_posts(id) ON DELETE CASCADE,
  read       BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE notifications REPLICA IDENTITY FULL;

-- ── Auto-create notification on like ─────────────────────────
CREATE OR REPLACE FUNCTION notify_on_like()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE v_owner UUID;
BEGIN
  SELECT user_id INTO v_owner FROM social_posts WHERE id = NEW.post_id;
  IF v_owner IS NOT NULL AND v_owner <> NEW.user_id THEN
    INSERT INTO notifications (user_id, actor_id, type, post_id)
    VALUES (v_owner, NEW.user_id, 'like', NEW.post_id);
  END IF;
  RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS trg_notify_like ON post_likes;
CREATE TRIGGER trg_notify_like
AFTER INSERT ON post_likes
FOR EACH ROW EXECUTE FUNCTION notify_on_like();

-- ── Auto-create notification on comment ──────────────────────
CREATE OR REPLACE FUNCTION notify_on_comment()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE v_owner UUID;
BEGIN
  SELECT user_id INTO v_owner FROM social_posts WHERE id = NEW.post_id;
  IF v_owner IS NOT NULL AND v_owner <> NEW.user_id THEN
    INSERT INTO notifications (user_id, actor_id, type, post_id)
    VALUES (v_owner, NEW.user_id, 'comment', NEW.post_id);
  END IF;
  RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS trg_notify_comment ON post_comments;
CREATE TRIGGER trg_notify_comment
AFTER INSERT ON post_comments
FOR EACH ROW EXECUTE FUNCTION notify_on_comment();

-- ── Auto-create notification on follow ───────────────────────
CREATE OR REPLACE FUNCTION notify_on_follow()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  INSERT INTO notifications (user_id, actor_id, type)
  VALUES (NEW.following_id, NEW.follower_id, 'follow');
  RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS trg_notify_follow ON friendships;
CREATE TRIGGER trg_notify_follow
AFTER INSERT ON friendships
FOR EACH ROW EXECUTE FUNCTION notify_on_follow();

-- ── Enable Realtime ───────────────────────────────────────────
ALTER PUBLICATION supabase_realtime ADD TABLE notifications;

-- ── RLS ──────────────────────────────────────────────────────
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "notifs_select" ON notifications FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "notifs_update" ON notifications FOR UPDATE TO authenticated
  USING (auth.uid() = user_id);
