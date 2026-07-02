-- Question bank: topics + questions (multiple choice or essay), organized
-- the same way as flashcard_topics/flashcards. Free-plan users get 5
-- *answered* questions per day; Premium is unlimited.
--
-- Unlike flashcards (where front/back are both meant to be visible),
-- correct_option/explanation must stay hidden from students until they
-- actually answer — otherwise the network tab trivially reveals the
-- gabarito. So `questions` has NO general "authenticated can view" RLS
-- policy; students only ever read it through list_topic_questions(), which
-- is SECURITY DEFINER and returns just the safe columns. Only admins (via
-- the "Admins manage questions" ALL policy) can read/write the base table
-- directly, which is what the admin CRUD UI uses.

create table public.question_topics (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  description text,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.questions (
  id uuid primary key default gen_random_uuid(),
  topic_id uuid not null references public.question_topics(id) on delete cascade,
  type text not null default 'multiple_choice' check (type in ('multiple_choice', 'essay')),
  prompt text not null,
  options jsonb,
  correct_option integer,
  explanation text,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint questions_multiple_choice_requires_options check (
    type <> 'multiple_choice' or (options is not null and correct_option is not null)
  )
);

create index questions_topic_id_idx on public.questions(topic_id, sort_order);

create table public.question_attempts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  question_id uuid not null references public.questions(id) on delete cascade,
  answer text,
  correct boolean,
  created_at timestamptz not null default now()
);

create index question_attempts_user_created_idx on public.question_attempts(user_id, created_at desc);
create index question_attempts_user_question_idx on public.question_attempts(user_id, question_id);

alter table public.question_topics enable row level security;
alter table public.questions enable row level security;
alter table public.question_attempts enable row level security;

create trigger set_updated_at_question_topics
before update on public.question_topics
for each row execute function public.update_updated_at_column();

create trigger set_updated_at_questions
before update on public.questions
for each row execute function public.update_updated_at_column();

-- Topics have nothing sensitive in them, so a normal read policy is fine.
create policy "Authenticated users can view question topics"
on public.question_topics for select
to authenticated
using (true);

create policy "Admins manage question topics"
on public.question_topics for all
to authenticated
using (public.has_role(auth.uid(), 'admin'))
with check (public.has_role(auth.uid(), 'admin'));

-- No general select policy on `questions` for students on purpose — see
-- note above. Admins get full access for the CRUD screen.
create policy "Admins manage questions"
on public.questions for all
to authenticated
using (public.has_role(auth.uid(), 'admin'))
with check (public.has_role(auth.uid(), 'admin'));

-- Students can see their own attempt history (used to render "answered
-- today" counters); inserts only ever happen via record_question_attempt.
create policy "Users view own question attempts"
on public.question_attempts for select
to authenticated
using (auth.uid() = user_id);

-- Safe, gabarito-free read path for students.
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
  select q.id, q.type, q.prompt, q.options, q.sort_order
  from public.questions q
  where q.topic_id = _topic_id
  order by q.sort_order;
$$;

revoke execute on function public.list_topic_questions(uuid) from public, anon;
grant execute on function public.list_topic_questions(uuid) to authenticated;

-- Topic list with question counts, for the index page — students can't
-- SELECT `questions` directly, so a plain client-side count query won't
-- work here the way it does for flashcards.
create or replace function public.list_question_topics()
returns table (
  id uuid,
  slug text,
  title text,
  description text,
  sort_order integer,
  question_count bigint
)
language sql
security definer
stable
set search_path = public
as $$
  select t.id, t.slug, t.title, t.description, t.sort_order, count(q.id)
  from public.question_topics t
  left join public.questions q on q.topic_id = t.id
  group by t.id
  order by t.sort_order;
$$;

revoke execute on function public.list_question_topics() from public, anon;
grant execute on function public.list_question_topics() to authenticated;

-- How many questions the caller has answered today + how many remain
-- (used to render the usage banner before they attempt anything).
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
  _count integer;
begin
  if _uid is null then
    raise exception 'Not authenticated';
  end if;

  select plan into _plan from public.profiles where id = _uid;
  _plan := coalesce(_plan, 'free');

  select count(*) into _count
  from public.question_attempts
  where user_id = _uid and created_at::date = (now() at time zone 'utc')::date;

  if _plan = 'premium' then
    return query select _count, -1, true;
  else
    return query select _count, greatest(0, 5 - _count), false;
  end if;
end;
$$;

revoke execute on function public.get_daily_question_usage() from public, anon;
grant execute on function public.get_daily_question_usage() to authenticated;

-- Grades the answer, records the attempt, enforces the free-plan daily
-- cap, and returns the gabarito — this is the only place a student ever
-- sees correct_option/explanation.
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
  _today_count integer;
  _q public.questions%rowtype;
  _is_correct boolean;
begin
  if _uid is null then
    raise exception 'Not authenticated';
  end if;

  select plan into _plan from public.profiles where id = _uid;
  _plan := coalesce(_plan, 'free');

  select count(*) into _today_count
  from public.question_attempts
  where user_id = _uid and created_at::date = (now() at time zone 'utc')::date;

  if _plan <> 'premium' and _today_count >= 5 then
    raise exception 'Limite diário de 5 questões atingido. Assine o Premium para questões ilimitadas.';
  end if;

  select * into _q from public.questions where id = _question_id;
  if not found then
    raise exception 'Questão não encontrada';
  end if;

  if _q.type = 'multiple_choice' then
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
    case when _plan = 'premium' then -1 else greatest(0, 5 - (_today_count + 1)) end,
    (_plan = 'premium');
end;
$$;

revoke execute on function public.record_question_attempt(uuid, text) from public, anon;
grant execute on function public.record_question_attempt(uuid, text) to authenticated;

-- Seed one demo topic so the feature isn't empty out of the box.
insert into public.question_topics (slug, title, description, sort_order)
values ('vida-universitaria', 'Vida Universitária', 'Questões de aquecimento para o primeiro semestre.', 0);

insert into public.questions (topic_id, type, prompt, options, correct_option, explanation, sort_order)
select id, 'multiple_choice',
  'O que significa "trancar uma disciplina"?',
  '["Reprovar automaticamente na disciplina", "Cancelar a matrícula na disciplina antes do fim do prazo, sem reprovação", "Trocar de turma no meio do semestre", "Pedir revisão de nota"]'::jsonb,
  1,
  'Trancar significa desistir formalmente da disciplina dentro do prazo da instituição, sem que isso conte como reprovação no histórico.',
  0
from public.question_topics where slug = 'vida-universitaria'
union all
select id, 'multiple_choice',
  'O que é o CR (coeficiente de rendimento)?',
  '["O número de créditos restantes para se formar", "Uma média ponderada do desempenho do aluno ao longo do curso", "A carga horária semanal de aulas", "O valor da mensalidade"]'::jsonb,
  1,
  'O CR é uma média (geralmente ponderada pelos créditos de cada disciplina) usada para medir o desempenho acadêmico geral do aluno.',
  1
from public.question_topics where slug = 'vida-universitaria'
union all
select id, 'essay',
  'Descreva, com suas palavras, uma estratégia que você usaria para organizar seus estudos na primeira semana de aula.',
  null, null,
  'Não há resposta única certa — o importante é ter um plano com horários fixos de estudo, revisão espaçada do conteúdo e alguma folga para imprevistos.',
  2
from public.question_topics where slug = 'vida-universitaria';
