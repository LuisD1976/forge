-- ============================================================
-- FORGE Social Schema — run in Supabase SQL Editor
-- ============================================================

-- 1. social_posts (may already exist — ALTER if so)
CREATE TABLE IF NOT EXISTS social_posts (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content          TEXT NOT NULL,
  image_url        TEXT,
  workout_summary  JSONB,
  likes_count      INTEGER NOT NULL DEFAULT 0,
  comments_count   INTEGER NOT NULL DEFAULT 0,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. post_likes
CREATE TABLE IF NOT EXISTS post_likes (
  post_id    UUID NOT NULL REFERENCES social_posts(id) ON DELETE CASCADE,
  user_id    UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (post_id, user_id)
);

-- DELETE payloads need FULL identity to get old row data in Realtime
ALTER TABLE post_likes REPLICA IDENTITY FULL;

-- 3. post_comments
CREATE TABLE IF NOT EXISTS post_comments (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id    UUID NOT NULL REFERENCES social_posts(id) ON DELETE CASCADE,
  user_id    UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content    TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. friendships (may already exist)
CREATE TABLE IF NOT EXISTS friendships (
  follower_id  UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  following_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (follower_id, following_id)
);
ALTER TABLE friendships REPLICA IDENTITY FULL;

-- ── Triggers to keep counts in sync ─────────────────────────

CREATE OR REPLACE FUNCTION sync_post_likes_count()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE social_posts SET likes_count = likes_count + 1 WHERE id = NEW.post_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE social_posts SET likes_count = GREATEST(likes_count - 1, 0) WHERE id = OLD.post_id;
  END IF;
  RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS trg_post_likes_count ON post_likes;
CREATE TRIGGER trg_post_likes_count
AFTER INSERT OR DELETE ON post_likes
FOR EACH ROW EXECUTE FUNCTION sync_post_likes_count();

CREATE OR REPLACE FUNCTION sync_post_comments_count()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE social_posts SET comments_count = comments_count + 1 WHERE id = NEW.post_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE social_posts SET comments_count = GREATEST(comments_count - 1, 0) WHERE id = OLD.post_id;
  END IF;
  RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS trg_post_comments_count ON post_comments;
CREATE TRIGGER trg_post_comments_count
AFTER INSERT OR DELETE ON post_comments
FOR EACH ROW EXECUTE FUNCTION sync_post_comments_count();

-- ── Enable Supabase Realtime ──────────────────────────────────
ALTER PUBLICATION supabase_realtime ADD TABLE social_posts;
ALTER PUBLICATION supabase_realtime ADD TABLE post_likes;
ALTER PUBLICATION supabase_realtime ADD TABLE post_comments;
ALTER PUBLICATION supabase_realtime ADD TABLE friendships;

-- ── Row Level Security ────────────────────────────────────────
ALTER TABLE social_posts   ENABLE ROW LEVEL SECURITY;
ALTER TABLE post_likes     ENABLE ROW LEVEL SECURITY;
ALTER TABLE post_comments  ENABLE ROW LEVEL SECURITY;
ALTER TABLE friendships    ENABLE ROW LEVEL SECURITY;

-- social_posts: anyone authenticated can read; only owner can insert/delete
CREATE POLICY "posts_select" ON social_posts FOR SELECT TO authenticated USING (true);
CREATE POLICY "posts_insert" ON social_posts FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "posts_delete" ON social_posts FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- post_likes: authenticated read; own rows only for write
CREATE POLICY "likes_select" ON post_likes FOR SELECT TO authenticated USING (true);
CREATE POLICY "likes_insert" ON post_likes FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "likes_delete" ON post_likes FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- post_comments: same pattern
CREATE POLICY "comments_select" ON post_comments FOR SELECT TO authenticated USING (true);
CREATE POLICY "comments_insert" ON post_comments FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "comments_delete" ON post_comments FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- friendships
CREATE POLICY "friendships_select" ON friendships FOR SELECT TO authenticated USING (true);
CREATE POLICY "friendships_insert" ON friendships FOR INSERT TO authenticated WITH CHECK (auth.uid() = follower_id);
CREATE POLICY "friendships_delete" ON friendships FOR DELETE TO authenticated USING (auth.uid() = follower_id);
