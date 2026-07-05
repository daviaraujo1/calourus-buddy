-- The platform is Direito-only for now — there's no picker for the
-- student anymore, every account is simply a Direito student. Existing
-- profiles with no course get backfilled; new signups get it automatically
-- via handle_new_user(). subject_areas.course_id becomes nullable so
-- cross-course subjects (Matemática, Português, etc.) can exist without
-- being tied to a single course — useful now for general/vestibular-style
-- practice, and later once Nutrição/Engenharia go live and need the same
-- subjects.

alter table public.subject_areas alter column course_id drop not null;

update public.profiles p
set course_id = c.id
from public.courses c
where c.slug = 'direito' and p.course_id is null;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  _direito_id uuid;
begin
  select id into _direito_id from public.courses where slug = 'direito';

  insert into public.profiles (id, full_name, avatar_url, email, course_id)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)),
    new.raw_user_meta_data->>'avatar_url',
    new.email,
    _direito_id
  );

  insert into public.user_roles (user_id, role)
  values (new.id, 'student');

  insert into public.user_stats (user_id)
  values (new.id)
  on conflict do nothing;

  return new;
end;
$$;

-- General subject areas (course_id null — shared across every course).
insert into public.subject_areas (course_id, name, sort_order)
values
  (null, 'Matemática', 100),
  (null, 'Português', 101),
  (null, 'Química', 102),
  (null, 'Física', 103),
  (null, 'História', 104),
  (null, 'Geografia', 105);

create or replace function public._seed_general_topics()
returns void
language plpgsql
as $$
declare
  _area record;
  _materia text;
  _slug text;
  _pos integer;
  _materias text[];
begin
  for _area in
    select id, name from public.subject_areas where course_id is null
  loop
    _materias := case _area.name
      when 'Matemática' then array[
        'Aritmética e Operações Básicas', 'Frações, Decimais e Porcentagem', 'Razão, Proporção e Regra de Três',
        'Equações e Inequações', 'Funções', 'Geometria Plana', 'Geometria Espacial', 'Trigonometria',
        'Probabilidade e Estatística', 'Matemática Financeira'
      ]
      when 'Português' then array[
        'Interpretação de Texto', 'Gramática', 'Ortografia e Acentuação', 'Pontuação', 'Morfologia', 'Sintaxe',
        'Concordância Verbal e Nominal', 'Regência Verbal e Nominal', 'Crase', 'Semântica e Figuras de Linguagem',
        'Redação e Coesão Textual'
      ]
      when 'Química' then array[
        'Estrutura Atômica', 'Tabela Periódica', 'Ligações Químicas', 'Funções Inorgânicas', 'Reações Químicas',
        'Estequiometria', 'Soluções', 'Termoquímica', 'Cinética Química', 'Equilíbrio Químico', 'Eletroquímica',
        'Química Orgânica'
      ]
      when 'Física' then array[
        'Cinemática', 'Dinâmica', 'Trabalho, Energia e Potência', 'Gravitação', 'Hidrostática', 'Termologia',
        'Termodinâmica', 'Ondulatória', 'Óptica', 'Eletrostática', 'Eletrodinâmica', 'Magnetismo'
      ]
      when 'História' then array[
        'História Geral', 'História do Brasil', 'História Antiga', 'História Medieval', 'História Moderna',
        'História Contemporânea', 'Brasil Colônia', 'Brasil Império', 'Brasil República',
        'Movimentos Sociais e Cidadania'
      ]
      when 'Geografia' then array[
        'Geografia Física', 'Cartografia', 'Climatologia', 'Geomorfologia', 'Hidrografia', 'Geografia Humana',
        'Geopolítica', 'População', 'Urbanização', 'Economia e Globalização', 'Meio Ambiente e Sustentabilidade',
        'Geografia do Brasil'
      ]
      else array[]::text[]
    end;

    _pos := 0;
    foreach _materia in array _materias loop
      _slug := 'geral-' || regexp_replace(lower(unaccent(_area.name)), '[^a-z0-9]+', '-', 'g')
        || '-' || regexp_replace(lower(unaccent(_materia)), '[^a-z0-9]+', '-', 'g');
      _slug := trim(both '-' from _slug);

      insert into public.flashcard_topics (slug, title, sort_order, course_id, area_id)
      values (_slug, _materia, _pos, null, _area.id)
      on conflict (slug) do nothing;

      insert into public.question_topics (slug, title, sort_order, course_id, area_id)
      values (_slug, _materia, _pos, null, _area.id)
      on conflict (slug) do nothing;

      _pos := _pos + 1;
    end loop;
  end loop;
end;
$$;

select public._seed_general_topics();
drop function public._seed_general_topics();
