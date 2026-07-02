
CREATE OR REPLACE FUNCTION public.record_flashcard_attempt(_flashcard_id uuid, _correct boolean)
 RETURNS TABLE(xp_gained integer, total_xp integer, old_level integer, new_level integer, leveled_up boolean, streak_days integer)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_uid uuid := auth.uid();
  v_xp_gain int;
  v_prev_level int;
  v_prev_streak int;
  v_prev_last date;
  v_today date := (now() at time zone 'utc')::date;
  v_new_streak int;
  v_new_xp int;
  v_new_level int;
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM public.flashcards WHERE id = _flashcard_id) THEN
    RAISE EXCEPTION 'Invalid flashcard';
  END IF;

  v_xp_gain := CASE WHEN _correct THEN 10 ELSE 2 END;

  INSERT INTO public.flashcard_attempts (user_id, flashcard_id, correct, xp_awarded)
  VALUES (v_uid, _flashcard_id, _correct, v_xp_gain);

  INSERT INTO public.user_stats (user_id) VALUES (v_uid) ON CONFLICT DO NOTHING;

  SELECT s.level, s.last_study_date, s.streak_days
    INTO v_prev_level, v_prev_last, v_prev_streak
  FROM public.user_stats s WHERE s.user_id = v_uid FOR UPDATE;

  IF v_prev_last IS NULL OR v_prev_last < v_today - 1 THEN
    v_new_streak := 1;
  ELSIF v_prev_last = v_today - 1 THEN
    v_new_streak := v_prev_streak + 1;
  ELSE
    v_new_streak := GREATEST(v_prev_streak, 1);
  END IF;

  UPDATE public.user_stats SET
    xp = user_stats.xp + v_xp_gain,
    cards_studied = user_stats.cards_studied + 1,
    correct_count = user_stats.correct_count + CASE WHEN _correct THEN 1 ELSE 0 END,
    streak_days = v_new_streak,
    last_study_date = v_today,
    level = GREATEST(1, ((user_stats.xp + v_xp_gain) / 100) + 1),
    updated_at = now()
  WHERE user_stats.user_id = v_uid
  RETURNING user_stats.xp, user_stats.level INTO v_new_xp, v_new_level;

  RETURN QUERY SELECT v_xp_gain, v_new_xp, v_prev_level, v_new_level, (v_new_level > v_prev_level), v_new_streak;
END;
$function$;
