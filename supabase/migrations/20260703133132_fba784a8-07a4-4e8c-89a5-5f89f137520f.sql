
-- NOTE: this migration came from a parallel branch that independently
-- rebuilt the question bank (see migration 20260702030000, applied
-- earlier in this history). Several policy/function names collide with
-- that earlier migration — the DROP ... IF EXISTS statements below make
-- this safe to (re)apply on top of it instead of erroring on "already
-- exists". Its temporary security regression (a public read policy on
-- `questions`, plus SECURITY INVOKER variants) is corrected by migration
-- 20260703140000, which runs right after this one.

-- Enum for question type
DO $$ BEGIN
  CREATE TYPE public.question_type AS ENUM ('multiple_choice','essay');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- question_topics
CREATE TABLE IF NOT EXISTS public.question_topics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  title text NOT NULL,
  description text,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.question_topics TO authenticated;
GRANT ALL ON public.question_topics TO service_role;
ALTER TABLE public.question_topics ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Authenticated can view question topics" ON public.question_topics;
CREATE POLICY "Authenticated can view question topics" ON public.question_topics
  FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "Admins manage question topics" ON public.question_topics;
CREATE POLICY "Admins manage question topics" ON public.question_topics
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin'))
  WITH CHECK (public.has_role(auth.uid(),'admin'));

-- questions
CREATE TABLE IF NOT EXISTS public.questions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  topic_id uuid NOT NULL REFERENCES public.question_topics(id) ON DELETE CASCADE,
  type public.question_type NOT NULL,
  prompt text NOT NULL,
  options jsonb,
  correct_option integer,
  explanation text,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.questions TO authenticated;
GRANT ALL ON public.questions TO service_role;
ALTER TABLE public.questions ENABLE ROW LEVEL SECURITY;
-- NOTE: this policy is intentionally leaky (any authenticated user could
-- read the gabarito) and is dropped again by migration 20260703140000.
-- Kept here only for historical accuracy of what this branch introduced.
DROP POLICY IF EXISTS "Authenticated can view questions" ON public.questions;
CREATE POLICY "Authenticated can view questions" ON public.questions
  FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "Admins manage questions" ON public.questions;
CREATE POLICY "Admins manage questions" ON public.questions
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin'))
  WITH CHECK (public.has_role(auth.uid(),'admin'));

-- question_attempts
CREATE TABLE IF NOT EXISTS public.question_attempts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  question_id uuid NOT NULL REFERENCES public.questions(id) ON DELETE CASCADE,
  answer text,
  correct boolean,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.question_attempts TO authenticated;
GRANT ALL ON public.question_attempts TO service_role;
ALTER TABLE public.question_attempts ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users view own question attempts" ON public.question_attempts;
CREATE POLICY "Users view own question attempts" ON public.question_attempts
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

-- Triggers for updated_at
DROP TRIGGER IF EXISTS trg_question_topics_updated ON public.question_topics;
CREATE TRIGGER trg_question_topics_updated BEFORE UPDATE ON public.question_topics
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
DROP TRIGGER IF EXISTS trg_questions_updated ON public.questions;
CREATE TRIGGER trg_questions_updated BEFORE UPDATE ON public.questions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- RPC: list_question_topics (different column shape than the earlier
-- migration's version — drop first so CREATE OR REPLACE doesn't error).
DROP FUNCTION IF EXISTS public.list_question_topics();
CREATE OR REPLACE FUNCTION public.list_question_topics()
RETURNS TABLE(id uuid, slug text, title text, description text, question_count bigint)
LANGUAGE sql STABLE SECURITY INVOKER SET search_path = public AS $$
  SELECT t.id, t.slug, t.title, t.description,
         (SELECT count(*) FROM public.questions q WHERE q.topic_id = t.id) AS question_count
    FROM public.question_topics t
   ORDER BY t.sort_order ASC, t.title ASC;
$$;
GRANT EXECUTE ON FUNCTION public.list_question_topics() TO authenticated;

-- RPC: list_topic_questions (type column is text upstream, enum here —
-- different OUT signature, so drop first).
DROP FUNCTION IF EXISTS public.list_topic_questions(uuid);
CREATE OR REPLACE FUNCTION public.list_topic_questions(_topic_id uuid)
RETURNS TABLE(id uuid, type public.question_type, prompt text, options jsonb, sort_order integer)
LANGUAGE sql STABLE SECURITY INVOKER SET search_path = public AS $$
  SELECT q.id, q.type, q.prompt, q.options, q.sort_order
    FROM public.questions q
   WHERE q.topic_id = _topic_id
   ORDER BY q.sort_order ASC, q.created_at ASC;
$$;
GRANT EXECUTE ON FUNCTION public.list_topic_questions(uuid) TO authenticated;

-- RPC: get_daily_question_usage (same column shape as upstream — plain
-- CREATE OR REPLACE is fine here).
CREATE OR REPLACE FUNCTION public.get_daily_question_usage()
RETURNS TABLE(answered_today integer, remaining integer, is_premium boolean)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_plan text;
  v_is_admin boolean;
  v_premium boolean;
  v_count integer;
  v_limit constant integer := 5;
BEGIN
  IF v_uid IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;
  SELECT plan INTO v_plan FROM public.profiles WHERE id = v_uid;
  v_is_admin := public.has_role(v_uid,'admin');
  v_premium := v_is_admin OR v_plan = 'premium';
  SELECT count(*)::int INTO v_count FROM public.question_attempts
    WHERE user_id = v_uid AND created_at >= (now() at time zone 'utc')::date;
  RETURN QUERY SELECT v_count,
    CASE WHEN v_premium THEN 999999 ELSE GREATEST(0, v_limit - v_count) END,
    v_premium;
END $$;
GRANT EXECUTE ON FUNCTION public.get_daily_question_usage() TO authenticated;

-- RPC: record_question_attempt (column order differs from upstream's
-- version — drop first so CREATE OR REPLACE doesn't error).
DROP FUNCTION IF EXISTS public.record_question_attempt(uuid, text);
CREATE OR REPLACE FUNCTION public.record_question_attempt(_question_id uuid, _answer text)
RETURNS TABLE(correct boolean, correct_option integer, explanation text, is_premium boolean, remaining_today integer)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_plan text;
  v_is_admin boolean;
  v_premium boolean;
  v_count integer;
  v_limit constant integer := 5;
  v_q public.questions%ROWTYPE;
  v_correct boolean;
  v_selected integer;
BEGIN
  IF v_uid IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;
  SELECT * INTO v_q FROM public.questions WHERE id = _question_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'Invalid question'; END IF;

  SELECT plan INTO v_plan FROM public.profiles WHERE id = v_uid;
  v_is_admin := public.has_role(v_uid,'admin');
  v_premium := v_is_admin OR v_plan = 'premium';

  IF NOT v_premium THEN
    SELECT count(*)::int INTO v_count FROM public.question_attempts
      WHERE user_id = v_uid AND created_at >= (now() at time zone 'utc')::date;
    IF v_count >= v_limit THEN RAISE EXCEPTION 'Limite diário atingido'; END IF;
  END IF;

  IF v_q.type = 'multiple_choice' THEN
    BEGIN v_selected := _answer::int; EXCEPTION WHEN others THEN v_selected := NULL; END;
    v_correct := v_selected IS NOT NULL AND v_selected = v_q.correct_option;
  ELSE
    v_correct := NULL;
  END IF;

  INSERT INTO public.question_attempts (user_id, question_id, answer, correct)
    VALUES (v_uid, _question_id, _answer, v_correct);

  IF NOT v_premium THEN
    SELECT count(*)::int INTO v_count FROM public.question_attempts
      WHERE user_id = v_uid AND created_at >= (now() at time zone 'utc')::date;
  END IF;

  RETURN QUERY SELECT v_correct, v_q.correct_option, v_q.explanation, v_premium,
    CASE WHEN v_premium THEN 999999 ELSE GREATEST(0, v_limit - v_count) END;
END $$;
GRANT EXECUTE ON FUNCTION public.record_question_attempt(uuid, text) TO authenticated;
