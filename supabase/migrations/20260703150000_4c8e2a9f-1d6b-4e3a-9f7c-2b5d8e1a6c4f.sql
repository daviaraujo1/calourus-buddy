-- Courses ("Direito" launches active; others are visible but locked until
-- their content is built) and subject areas within a course (e.g. "Direito
-- Civil", "Processo Penal"). Flashcard/question topics can be tagged with
-- a course + area so the platform "becomes" whatever course the student
-- picked — topics with no course are general (shown to everyone).

create table public.courses (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  tagline text,
  icon text not null default 'GraduationCap',
  active boolean not null default false,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.subject_areas (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null references public.courses(id) on delete cascade,
  name text not null,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

create index subject_areas_course_id_idx on public.subject_areas(course_id);

alter table public.profiles add column course_id uuid references public.courses(id);

alter table public.flashcard_topics
  add column course_id uuid references public.courses(id),
  add column area_id uuid references public.subject_areas(id);

alter table public.question_topics
  add column course_id uuid references public.courses(id),
  add column area_id uuid references public.subject_areas(id);

create index flashcard_topics_course_id_idx on public.flashcard_topics(course_id);
create index question_topics_course_id_idx on public.question_topics(course_id);

alter table public.courses enable row level security;
alter table public.subject_areas enable row level security;

create trigger set_updated_at_courses
before update on public.courses
for each row execute function public.update_updated_at_column();

create policy "Anyone authenticated can view courses"
on public.courses for select
to authenticated
using (true);

create policy "Admins manage courses"
on public.courses for all
to authenticated
using (public.has_role(auth.uid(), 'admin'))
with check (public.has_role(auth.uid(), 'admin'));

create policy "Anyone authenticated can view subject areas"
on public.subject_areas for select
to authenticated
using (true);

create policy "Admins manage subject areas"
on public.subject_areas for all
to authenticated
using (public.has_role(auth.uid(), 'admin'))
with check (public.has_role(auth.uid(), 'admin'));

-- Seed the three courses named so far. Only Direito ships with real
-- content initially; the others are shown as "coming soon" in the picker.
insert into public.courses (slug, name, tagline, icon, active, sort_order) values
  ('direito', 'Direito', 'Guia completo para o graduando de Direito', 'Scale', true, 0),
  ('nutricao', 'Nutrição', 'Em breve', 'Apple', false, 1),
  ('engenharia', 'Engenharia', 'Em breve', 'Cog', false, 2);

-- Subject areas for Direito, from the course curriculum supplied.
insert into public.subject_areas (course_id, name, sort_order)
select c.id, area.name, area.sort_order
from public.courses c
cross join (values
  ('Formação Geral', 0),
  ('Direito Constitucional', 1),
  ('Direito Civil', 2),
  ('Processo Civil', 3),
  ('Direito Penal', 4),
  ('Processo Penal', 5),
  ('Direito Administrativo', 6),
  ('Direito do Trabalho', 7),
  ('Direito Tributário', 8),
  ('Direito Empresarial', 9),
  ('Direito Internacional', 10),
  ('Direito Ambiental', 11),
  ('Direito do Consumidor', 12),
  ('Seguridade Social', 13)
) as area(name, sort_order)
where c.slug = 'direito';

-- One flashcard_topics + question_topics row per matéria, empty (0 cards/
-- questions) and ready for the admin CRUD screens. Slugs are prefixed with
-- "direito-" to avoid collisions with topics from other courses later.
create or replace function public._seed_direito_topics()
returns void
language plpgsql
as $$
declare
  _course_id uuid;
  _area record;
  _materia text;
  _slug text;
  _pos integer;
  _materias text[];
begin
  select id into _course_id from public.courses where slug = 'direito';

  for _area in
    select id, name, sort_order from public.subject_areas where course_id = _course_id
  loop
    _materias := case _area.name
      when 'Formação Geral' then array[
        'Filosofia Geral e Ética', 'Filosofia do Direito', 'Introdução ao Estudo do Direito',
        'Hermenêutica Jurídica', 'História do Direito', 'Ciência Política', 'Teoria Geral do Estado',
        'Sociologia Geral e Antropologia', 'Sociologia Jurídica e Economia Política',
        'Direitos Humanos e Fundamentais', 'Metodologia Científica', 'Leitura e Prática Textual'
      ]
      when 'Direito Constitucional' then array[
        'Direito Constitucional I - Organização do Estado',
        'Direito Constitucional II - Poderes e Ordem Econômica',
        'Direito Constitucional III - Controle de Constitucionalidade'
      ]
      when 'Direito Civil' then array[
        'Direito Civil I - Parte Geral', 'Direito Civil II - Obrigações', 'Direito Civil III - Contratos',
        'Direito Civil IV - Direitos Reais (Coisas)', 'Direito Civil V - Família',
        'Direito Civil VI - Responsabilidade Civil', 'Direito Civil VII - Sucessões'
      ]
      when 'Processo Civil' then array[
        'Processo Civil I - Parte Geral', 'Processo Civil II - Procedimento Comum',
        'Processo Civil III - Execução', 'Processo Civil IV - Recursos',
        'Processo Civil V - Procedimentos Especiais'
      ]
      when 'Direito Penal' then array[
        'Direito Penal I - Teoria do Crime (Parte Geral)', 'Direito Penal II - Teoria das Penas',
        'Direito Penal III - Jurisdição e Competência',
        'Direito Penal IV - Crimes contra a Dignidade Sexual e Administração Pública'
      ]
      when 'Processo Penal' then array[
        'Processo Penal I - Ação Penal', 'Processo Penal II - Jurisdição e Competência',
        'Processo Penal III - Recursos'
      ]
      when 'Direito Administrativo' then array[
        'Direito Administrativo I - Administração Pública', 'Direito Administrativo II - Controle Administrativo'
      ]
      when 'Direito do Trabalho' then array[
        'Direito do Trabalho I', 'Direito do Trabalho II', 'Processo do Trabalho'
      ]
      when 'Direito Tributário' then array['Tributário I', 'Tributário II']
      when 'Direito Empresarial' then array['Empresarial I', 'Empresarial II']
      when 'Direito Internacional' then array['Direito Internacional Público', 'Direito Internacional Privado']
      when 'Direito Ambiental' then array['Direito Ambiental']
      when 'Direito do Consumidor' then array['Direito do Consumidor']
      when 'Seguridade Social' then array['Direito da Seguridade Social']
      else array[]::text[]
    end;

    _pos := 0;
    foreach _materia in array _materias loop
      _slug := 'direito-' || regexp_replace(
        lower(unaccent(_materia)), '[^a-z0-9]+', '-', 'g'
      );
      _slug := trim(both '-' from _slug);

      insert into public.flashcard_topics (slug, title, sort_order, course_id, area_id)
      values (_slug, _materia, _pos, _course_id, _area.id)
      on conflict (slug) do nothing;

      insert into public.question_topics (slug, title, sort_order, course_id, area_id)
      values (_slug, _materia, _pos, _course_id, _area.id)
      on conflict (slug) do nothing;

      _pos := _pos + 1;
    end loop;
  end loop;
end;
$$;

-- unaccent needs the extension enabled; Supabase ships it in the
-- "extensions" schema, already on search_path by default in most projects.
create extension if not exists unaccent;

select public._seed_direito_topics();
drop function public._seed_direito_topics();

-- list_question_topics() gets replaced with a course-aware, filterable
-- version: only shows topics with no course (general) or matching the
-- caller's own course, optionally narrowed by area and a title search —
-- this is what powers the "Buscar questões" screen's disciplina filter.
drop function if exists public.list_question_topics();

create or replace function public.list_question_topics(_area_id uuid default null, _search text default null)
returns table (
  id uuid,
  slug text,
  title text,
  description text,
  area_id uuid,
  area_name text,
  question_count bigint
)
language plpgsql
security definer
stable
set search_path = public
as $$
declare
  _uid uuid := auth.uid();
  _course_id uuid;
begin
  if _uid is null then
    raise exception 'Not authenticated';
  end if;

  select course_id into _course_id from public.profiles where id = _uid;

  return query
  select t.id, t.slug, t.title, t.description, t.area_id, a.name, count(q.id)
  from public.question_topics t
  left join public.subject_areas a on a.id = t.area_id
  left join public.questions q on q.topic_id = t.id
  where (t.course_id is null or t.course_id = _course_id)
    and (_area_id is null or t.area_id = _area_id)
    and (_search is null or _search = '' or t.title ilike '%' || _search || '%')
  group by t.id, a.name
  order by t.sort_order;
end;
$$;

revoke execute on function public.list_question_topics(uuid, text) from public, anon;
grant execute on function public.list_question_topics(uuid, text) to authenticated;

-- Areas belonging to the caller's own course — powers the "Selecione a
-- disciplina" dropdown.
create or replace function public.list_my_subject_areas()
returns table (id uuid, name text, sort_order integer)
language plpgsql
security definer
stable
set search_path = public
as $$
declare
  _uid uuid := auth.uid();
  _course_id uuid;
begin
  if _uid is null then
    raise exception 'Not authenticated';
  end if;

  select course_id into _course_id from public.profiles where id = _uid;
  if _course_id is null then
    return;
  end if;

  return query
  select a.id, a.name, a.sort_order
  from public.subject_areas a
  where a.course_id = _course_id
  order by a.sort_order;
end;
$$;

revoke execute on function public.list_my_subject_areas() from public, anon;
grant execute on function public.list_my_subject_areas() to authenticated;
