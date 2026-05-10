-- ============================================================
-- FORGE — Setup completo (safe to run multiple times)
-- Pega TODO esto en Supabase → SQL Editor → New query → Run
-- ============================================================

-- Extensiones
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- PROFILES
-- ============================================================
CREATE TABLE IF NOT EXISTS public.profiles (
  id                  UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  username            TEXT UNIQUE NOT NULL,
  display_name        TEXT NOT NULL,
  avatar_url          TEXT DEFAULT '',
  goal                TEXT NOT NULL DEFAULT 'muscle',
  experience          TEXT NOT NULL DEFAULT 'beginner',
  equipment           TEXT NOT NULL DEFAULT 'gym',
  is_pro              BOOLEAN NOT NULL DEFAULT false,
  pro_expires_at      TIMESTAMPTZ,
  streak              INT NOT NULL DEFAULT 0,
  total_workouts      INT NOT NULL DEFAULT 0,
  weight              NUMERIC,
  height              NUMERIC,
  onboarding_complete BOOLEAN NOT NULL DEFAULT false,
  questionnaire       JSONB,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN new.updated_at = now(); RETURN new; END;
$$;

DROP TRIGGER IF EXISTS profiles_updated_at ON public.profiles;
CREATE TRIGGER profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  INSERT INTO public.profiles (id, username, display_name)
  VALUES (
    new.id,
    'user_' || substring(new.id::text, 1, 8),
    COALESCE(new.raw_user_meta_data->>'display_name', 'Forjador')
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN new;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- ============================================================
-- WORKOUT SESSIONS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.workout_sessions (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID REFERENCES public.profiles ON DELETE CASCADE NOT NULL,
  name         TEXT NOT NULL,
  date         TIMESTAMPTZ NOT NULL,
  duration     INT NOT NULL DEFAULT 0,
  exercises    JSONB NOT NULL DEFAULT '[]',
  total_volume NUMERIC NOT NULL DEFAULT 0,
  xp_gained    INT NOT NULL DEFAULT 0,
  notes        TEXT,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS workout_sessions_user_id_idx ON public.workout_sessions(user_id);
CREATE INDEX IF NOT EXISTS workout_sessions_date_idx ON public.workout_sessions(date DESC);

-- ============================================================
-- MUSCLE RANKS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.muscle_ranks (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID REFERENCES public.profiles ON DELETE CASCADE NOT NULL,
  muscle        TEXT NOT NULL,
  tier          TEXT NOT NULL DEFAULT 'hierro',
  percentile    NUMERIC NOT NULL DEFAULT 0,
  one_rm        NUMERIC NOT NULL DEFAULT 0,
  xp            INT NOT NULL DEFAULT 0,
  next_level_xp INT NOT NULL DEFAULT 500,
  UNIQUE(user_id, muscle)
);

CREATE INDEX IF NOT EXISTS muscle_ranks_user_id_idx ON public.muscle_ranks(user_id);

-- ============================================================
-- ROUTINES
-- ============================================================
CREATE TABLE IF NOT EXISTS public.routines (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID REFERENCES public.profiles ON DELETE CASCADE NOT NULL,
  name            TEXT NOT NULL,
  description     TEXT NOT NULL DEFAULT '',
  exercises       JSONB NOT NULL DEFAULT '[]',
  frequency       TEXT NOT NULL DEFAULT '',
  category        TEXT NOT NULL DEFAULT 'custom',
  difficulty      INT NOT NULL DEFAULT 1,
  is_ai_generated BOOLEAN NOT NULL DEFAULT false,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS routines_user_id_idx ON public.routines(user_id);

-- ============================================================
-- SOCIAL POSTS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.social_posts (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL,
  content         TEXT NOT NULL,
  image_url       TEXT,
  workout_summary JSONB,
  likes_count     INT NOT NULL DEFAULT 0,
  comments_count  INT NOT NULL DEFAULT 0,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS social_posts_user_id_idx ON public.social_posts(user_id);
CREATE INDEX IF NOT EXISTS social_posts_created_at_idx ON public.social_posts(created_at DESC);

-- ============================================================
-- POST LIKES
-- ============================================================
CREATE TABLE IF NOT EXISTS public.post_likes (
  post_id    UUID REFERENCES public.social_posts ON DELETE CASCADE NOT NULL,
  user_id    UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (post_id, user_id)
);

ALTER TABLE public.post_likes REPLICA IDENTITY FULL;

-- ============================================================
-- POST COMMENTS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.post_comments (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id    UUID REFERENCES public.social_posts ON DELETE CASCADE NOT NULL,
  user_id    UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL,
  content    TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================
-- FRIENDSHIPS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.friendships (
  follower_id  UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL,
  following_id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (follower_id, following_id)
);

ALTER TABLE public.friendships REPLICA IDENTITY FULL;

-- ============================================================
-- NOTIFICATIONS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.notifications (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL,
  actor_id   UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL,
  type       TEXT NOT NULL CHECK (type IN ('like', 'comment', 'follow')),
  post_id    UUID REFERENCES public.social_posts ON DELETE CASCADE,
  read       BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.notifications REPLICA IDENTITY FULL;

-- ============================================================
-- PERSONAL RECORDS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.personal_records (
  user_id       UUID REFERENCES public.profiles ON DELETE CASCADE NOT NULL,
  exercise_id   TEXT NOT NULL,
  exercise_name TEXT NOT NULL,
  weight        NUMERIC NOT NULL,
  reps          INT NOT NULL,
  one_rm        NUMERIC NOT NULL,
  date          TIMESTAMPTZ NOT NULL,
  PRIMARY KEY (user_id, exercise_id)
);

-- ============================================================
-- TRIGGERS: counts + notifications
-- ============================================================
CREATE OR REPLACE FUNCTION public.sync_post_likes_count()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.social_posts SET likes_count = likes_count + 1 WHERE id = NEW.post_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.social_posts SET likes_count = GREATEST(likes_count - 1, 0) WHERE id = OLD.post_id;
  END IF;
  RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS trg_post_likes_count ON public.post_likes;
CREATE TRIGGER trg_post_likes_count
  AFTER INSERT OR DELETE ON public.post_likes
  FOR EACH ROW EXECUTE FUNCTION public.sync_post_likes_count();

CREATE OR REPLACE FUNCTION public.sync_post_comments_count()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.social_posts SET comments_count = comments_count + 1 WHERE id = NEW.post_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.social_posts SET comments_count = GREATEST(comments_count - 1, 0) WHERE id = OLD.post_id;
  END IF;
  RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS trg_post_comments_count ON public.post_comments;
CREATE TRIGGER trg_post_comments_count
  AFTER INSERT OR DELETE ON public.post_comments
  FOR EACH ROW EXECUTE FUNCTION public.sync_post_comments_count();

CREATE OR REPLACE FUNCTION public.notify_on_like()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE v_owner UUID;
BEGIN
  SELECT user_id INTO v_owner FROM public.social_posts WHERE id = NEW.post_id;
  IF v_owner IS NOT NULL AND v_owner <> NEW.user_id THEN
    INSERT INTO public.notifications (user_id, actor_id, type, post_id)
    VALUES (v_owner, NEW.user_id, 'like', NEW.post_id);
  END IF;
  RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS trg_notify_like ON public.post_likes;
CREATE TRIGGER trg_notify_like
  AFTER INSERT ON public.post_likes
  FOR EACH ROW EXECUTE FUNCTION public.notify_on_like();

CREATE OR REPLACE FUNCTION public.notify_on_comment()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE v_owner UUID;
BEGIN
  SELECT user_id INTO v_owner FROM public.social_posts WHERE id = NEW.post_id;
  IF v_owner IS NOT NULL AND v_owner <> NEW.user_id THEN
    INSERT INTO public.notifications (user_id, actor_id, type, post_id)
    VALUES (v_owner, NEW.user_id, 'comment', NEW.post_id);
  END IF;
  RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS trg_notify_comment ON public.post_comments;
CREATE TRIGGER trg_notify_comment
  AFTER INSERT ON public.post_comments
  FOR EACH ROW EXECUTE FUNCTION public.notify_on_comment();

CREATE OR REPLACE FUNCTION public.notify_on_follow()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  INSERT INTO public.notifications (user_id, actor_id, type)
  VALUES (NEW.following_id, NEW.follower_id, 'follow');
  RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS trg_notify_follow ON public.friendships;
CREATE TRIGGER trg_notify_follow
  AFTER INSERT ON public.friendships
  FOR EACH ROW EXECUTE FUNCTION public.notify_on_follow();

-- ============================================================
-- REALTIME
-- ============================================================
ALTER PUBLICATION supabase_realtime ADD TABLE public.social_posts;
ALTER PUBLICATION supabase_realtime ADD TABLE public.post_likes;
ALTER PUBLICATION supabase_realtime ADD TABLE public.post_comments;
ALTER PUBLICATION supabase_realtime ADD TABLE public.friendships;
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================
ALTER TABLE public.profiles         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workout_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.muscle_ranks     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.routines         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.social_posts     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.post_likes       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.post_comments    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.friendships      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.personal_records ENABLE ROW LEVEL SECURITY;

-- Profiles
DO $$ BEGIN CREATE POLICY "profiles_select" ON public.profiles FOR SELECT USING (true); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY "profiles_insert" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY "profiles_update" ON public.profiles FOR UPDATE USING (auth.uid() = id); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Workout sessions
DO $$ BEGIN CREATE POLICY "ws_all" ON public.workout_sessions FOR ALL USING (auth.uid() = user_id); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Muscle ranks
DO $$ BEGIN CREATE POLICY "mr_all" ON public.muscle_ranks FOR ALL USING (auth.uid() = user_id); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Routines
DO $$ BEGIN CREATE POLICY "routines_all" ON public.routines FOR ALL USING (auth.uid() = user_id); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Social posts
DO $$ BEGIN CREATE POLICY "posts_select" ON public.social_posts FOR SELECT TO authenticated USING (true); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY "posts_insert" ON public.social_posts FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY "posts_delete" ON public.social_posts FOR DELETE TO authenticated USING (auth.uid() = user_id); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Post likes
DO $$ BEGIN CREATE POLICY "likes_select" ON public.post_likes FOR SELECT TO authenticated USING (true); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY "likes_insert" ON public.post_likes FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY "likes_delete" ON public.post_likes FOR DELETE TO authenticated USING (auth.uid() = user_id); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Post comments
DO $$ BEGIN CREATE POLICY "comments_select" ON public.post_comments FOR SELECT TO authenticated USING (true); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY "comments_insert" ON public.post_comments FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY "comments_delete" ON public.post_comments FOR DELETE TO authenticated USING (auth.uid() = user_id); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Friendships
DO $$ BEGIN CREATE POLICY "friendships_select" ON public.friendships FOR SELECT TO authenticated USING (true); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY "friendships_insert" ON public.friendships FOR INSERT TO authenticated WITH CHECK (auth.uid() = follower_id); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY "friendships_delete" ON public.friendships FOR DELETE TO authenticated USING (auth.uid() = follower_id); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Notifications
DO $$ BEGIN CREATE POLICY "notifs_select" ON public.notifications FOR SELECT TO authenticated USING (auth.uid() = user_id); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY "notifs_update" ON public.notifications FOR UPDATE TO authenticated USING (auth.uid() = user_id); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Personal records
DO $$ BEGIN CREATE POLICY "pr_all" ON public.personal_records FOR ALL USING (auth.uid() = user_id); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ============================================================
-- STORAGE: bucket post-images
-- ============================================================
INSERT INTO storage.buckets (id, name, public)
VALUES ('post-images', 'post-images', true)
ON CONFLICT (id) DO NOTHING;

DO $$ BEGIN
  CREATE POLICY "post_images_select" ON storage.objects FOR SELECT USING (bucket_id = 'post-images');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "post_images_insert" ON storage.objects FOR INSERT TO authenticated
    WITH CHECK (bucket_id = 'post-images' AND auth.uid()::text = (storage.foldername(name))[1]);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "post_images_delete" ON storage.objects FOR DELETE TO authenticated
    USING (bucket_id = 'post-images' AND auth.uid()::text = (storage.foldername(name))[1]);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
