-- A migration from a parallel branch added a general "Authenticated can
-- view questions" SELECT policy on public.questions (USING true) and
-- redefined list_question_topics()/list_topic_questions() as SECURITY
-- INVOKER. Combined, that lets any signed-in student read correct_option
-- and explanation directly from the table before answering — exactly what
-- the gabarito-hiding design was meant to prevent. Restore it here.

drop policy if exists "Authenticated can view questions" on public.questions;

drop policy if exists "Admins manage questions" on public.questions;
create policy "Admins manage questions"
on public.questions for all
to authenticated
using (public.has_role(auth.uid(), 'admin'))
with check (public.has_role(auth.uid(), 'admin'));

-- Back to SECURITY DEFINER so students can read the safe columns even
-- though the base table itself has no policy allowing them to.
create or replace function public.list_question_topics()
returns table (
  id uuid,
  slug text,
  title text,
  description text,
  question_count bigint
)
language sql
security definer
stable
set search_path = public
as $$
  select t.id, t.slug, t.title, t.description, count(q.id)
  from public.question_topics t
  left join public.questions q on q.topic_id = t.id
  group by t.id
  order by t.sort_order;
$$;

create or replace function public.list_topic_questions(_topic_id uuid)
returns table (
  id uuid,
  type text,
  prompt text,
  options jsonb,
  sort_order integer
)
language sql
security definer
stable
set search_path = public
as $$
  select q.id, q.type::text, q.prompt, q.options, q.sort_order
  from public.questions q
  where q.topic_id = _topic_id
  order by q.sort_order;
$$;

revoke execute on function public.list_question_topics() from public, anon;
grant execute on function public.list_question_topics() to authenticated;
revoke execute on function public.list_topic_questions(uuid) from public, anon;
grant execute on function public.list_topic_questions(uuid) to authenticated;

-- Consolidated versions of the daily-limit functions, keeping the "admins
-- always have unlimited access" improvement introduced on the parallel
-- branch.
create or replace function public.get_daily_question_usage()
returns table (answered_today integer, remaining integer, is_premium boolean)
language plpgsql
security definer
stable
set search_path = public
as $$
declare
  _uid uuid := auth.uid();
  _plan text;
  _premium boolean;
  _count integer;
begin
  if _uid is null then
    raise exception 'Not authenticated';
  end if;

  select plan into _plan from public.profiles where id = _uid;
  _premium := public.has_role(_uid, 'admin') or coalesce(_plan, 'free') = 'premium';

  select count(*) into _count
  from public.question_attempts
  where user_id = _uid and created_at::date = (now() at time zone 'utc')::date;

  if _premium then
    return query select _count, -1, true;
  else
    return query select _count, greatest(0, 5 - _count), false;
  end if;
end;
$$;

create or replace function public.record_question_attempt(_question_id uuid, _answer text)
returns table (
  correct boolean,
  correct_option integer,
  explanation text,
  remaining_today integer,
  is_premium boolean
)
language plpgsql
security definer
set search_path = public
as $$
declare
  _uid uuid := auth.uid();
  _plan text;
  _premium boolean;
  _today_count integer;
  _q public.questions%rowtype;
  _is_correct boolean;
begin
  if _uid is null then
    raise exception 'Not authenticated';
  end if;

  select * into _q from public.questions where id = _question_id;
  if not found then
    raise exception 'Questão não encontrada';
  end if;

  select plan into _plan from public.profiles where id = _uid;
  _premium := public.has_role(_uid, 'admin') or coalesce(_plan, 'free') = 'premium';

  if not _premium then
    select count(*) into _today_count
    from public.question_attempts
    where user_id = _uid and created_at::date = (now() at time zone 'utc')::date;

    if _today_count >= 5 then
      raise exception 'Limite diário de 5 questões atingido. Assine o Premium para questões ilimitadas.';
    end if;
  end if;

  if _q.type::text = 'multiple_choice' then
    _is_correct := (_answer = _q.correct_option::text);
  else
    _is_correct := null;
  end if;

  insert into public.question_attempts (user_id, question_id, answer, correct)
  values (_uid, _question_id, _answer, _is_correct);

  return query select
    _is_correct,
    _q.correct_option,
    _q.explanation,
    case when _premium then -1 else greatest(0, 5 - (_today_count + 1)) end,
    _premium;
end;
$$;

revoke execute on function public.get_daily_question_usage() from public, anon;
grant execute on function public.get_daily_question_usage() to authenticated;
revoke execute on function public.record_question_attempt(uuid, text) from public, anon;
grant execute on function public.record_question_attempt(uuid, text) to authenticated;
