-- ============================================================
-- FORGE — Achievements table
-- Pega en Supabase → SQL Editor → Run
-- ============================================================

CREATE TABLE IF NOT EXISTS public.user_achievements (
  user_id        UUID REFERENCES public.profiles ON DELETE CASCADE NOT NULL,
  achievement_id TEXT NOT NULL,
  unlocked_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, achievement_id)
);

CREATE INDEX IF NOT EXISTS achievements_user_idx ON public.user_achievements(user_id);

ALTER TABLE public.user_achievements ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "achievements_all" ON public.user_achievements FOR ALL USING (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
