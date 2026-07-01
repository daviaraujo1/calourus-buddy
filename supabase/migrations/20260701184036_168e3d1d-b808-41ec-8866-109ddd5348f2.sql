
-- USER STATS
CREATE TABLE public.user_stats (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  xp int NOT NULL DEFAULT 0,
  level int NOT NULL DEFAULT 1,
  cards_studied int NOT NULL DEFAULT 0,
  correct_count int NOT NULL DEFAULT 0,
  streak_days int NOT NULL DEFAULT 0,
  last_study_date date,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.user_stats TO authenticated;
GRANT ALL ON public.user_stats TO service_role;
ALTER TABLE public.user_stats ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated can view all stats" ON public.user_stats FOR SELECT TO authenticated USING (true);
-- writes only via SECURITY DEFINER function

CREATE TRIGGER trg_user_stats_updated BEFORE UPDATE ON public.user_stats
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- FLASHCARD ATTEMPTS
CREATE TABLE public.flashcard_attempts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  flashcard_id uuid NOT NULL REFERENCES public.flashcards(id) ON DELETE CASCADE,
  correct boolean NOT NULL,
  xp_awarded int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.flashcard_attempts TO authenticated;
GRANT ALL ON public.flashcard_attempts TO service_role;
ALTER TABLE public.flashcard_attempts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users view own attempts" ON public.flashcard_attempts FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE INDEX idx_attempts_user_created ON public.flashcard_attempts(user_id, created_at DESC);
CREATE INDEX idx_attempts_user_card ON public.flashcard_attempts(user_id, flashcard_id);

-- Backfill existing users
INSERT INTO public.user_stats (user_id)
SELECT id FROM auth.users
ON CONFLICT (user_id) DO NOTHING;

-- Update new-user trigger to also create stats
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
begin
  insert into public.profiles (id, full_name, avatar_url)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)),
    new.raw_user_meta_data->>'avatar_url'
  );
  insert into public.user_roles (user_id, role) values (new.id, 'student');
  insert into public.user_stats (user_id) values (new.id) on conflict do nothing;
  return new;
end;
$$;

-- Award XP + update streak
CREATE OR REPLACE FUNCTION public.record_flashcard_attempt(_flashcard_id uuid, _correct boolean)
RETURNS TABLE(xp_gained int, total_xp int, old_level int, new_level int, leveled_up boolean, streak_days int)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  _uid uuid := auth.uid();
  _xp_gain int;
  _prev_level int;
  _prev_streak int;
  _prev_last date;
  _today date := (now() at time zone 'utc')::date;
  _new_streak int;
  _new_xp int;
  _new_level int;
BEGIN
  IF _uid IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM public.flashcards WHERE id = _flashcard_id) THEN
    RAISE EXCEPTION 'Invalid flashcard';
  END IF;

  _xp_gain := CASE WHEN _correct THEN 10 ELSE 2 END;

  INSERT INTO public.flashcard_attempts (user_id, flashcard_id, correct, xp_awarded)
  VALUES (_uid, _flashcard_id, _correct, _xp_gain);

  INSERT INTO public.user_stats (user_id) VALUES (_uid) ON CONFLICT DO NOTHING;

  SELECT level, last_study_date, streak_days
    INTO _prev_level, _prev_last, _prev_streak
  FROM public.user_stats WHERE user_id = _uid FOR UPDATE;

  IF _prev_last IS NULL OR _prev_last < _today - 1 THEN
    _new_streak := 1;
  ELSIF _prev_last = _today - 1 THEN
    _new_streak := _prev_streak + 1;
  ELSE
    _new_streak := GREATEST(_prev_streak, 1);
  END IF;

  UPDATE public.user_stats SET
    xp = xp + _xp_gain,
    cards_studied = cards_studied + 1,
    correct_count = correct_count + CASE WHEN _correct THEN 1 ELSE 0 END,
    streak_days = _new_streak,
    last_study_date = _today,
    level = GREATEST(1, ((xp + _xp_gain) / 100) + 1),
    updated_at = now()
  WHERE user_id = _uid
  RETURNING xp, level INTO _new_xp, _new_level;

  RETURN QUERY SELECT _xp_gain, _new_xp, _prev_level, _new_level, (_new_level > _prev_level), _new_streak;
END;
$$;
REVOKE EXECUTE ON FUNCTION public.record_flashcard_attempt(uuid, boolean) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.record_flashcard_attempt(uuid, boolean) TO authenticated;

-- Leaderboard (bypasses per-user profile RLS to expose only safe columns)
CREATE OR REPLACE FUNCTION public.get_leaderboard(_limit int DEFAULT 50)
RETURNS TABLE(user_id uuid, display_name text, avatar_url text, xp int, level int, cards_studied int, streak_days int)
LANGUAGE sql SECURITY DEFINER STABLE SET search_path = public AS $$
  SELECT s.user_id,
         coalesce(p.full_name, 'Estudante') as display_name,
         p.avatar_url,
         s.xp, s.level, s.cards_studied, s.streak_days
  FROM public.user_stats s
  LEFT JOIN public.profiles p ON p.id = s.user_id
  ORDER BY s.xp DESC, s.updated_at ASC
  LIMIT GREATEST(1, LEAST(_limit, 200))
$$;
REVOKE EXECUTE ON FUNCTION public.get_leaderboard(int) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_leaderboard(int) TO authenticated;
