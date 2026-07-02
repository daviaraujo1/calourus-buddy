-- Subscription plan support: 'free' (padrão, 5 questões/dia) vs 'premium'
-- (questões, flashcards e materiais ilimitados).

alter table public.profiles
  add column plan text not null default 'free' check (plan in ('free', 'premium')),
  add column premium_since timestamptz;

-- The existing "Users can update own profile" policy lets a user update any
-- column on their own row — including `plan`. Without a guard, anyone could
-- grant themselves premium with a plain client-side update. This trigger
-- blocks direct writes to plan/premium_since unless they go through
-- public.activate_premium(), which is the single, auditable place premium
-- access is granted (and where real payment verification should be added
-- once a payment provider is wired in).
create or replace function public.guard_profile_plan_update()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if (new.plan is distinct from old.plan or new.premium_since is distinct from old.premium_since)
     and coalesce(current_setting('app.allow_plan_change', true), '') <> 'on' then
    raise exception 'plan can only be changed via public.activate_premium()';
  end if;
  return new;
end;
$$;

create trigger profiles_guard_plan_update
before update on public.profiles
for each row execute function public.guard_profile_plan_update();

create or replace function public.activate_premium()
returns public.profiles
language plpgsql
security definer
set search_path = public
as $$
declare
  updated public.profiles;
begin
  if auth.uid() is null then
    raise exception 'Not authenticated';
  end if;

  perform set_config('app.allow_plan_change', 'on', true);

  update public.profiles
  set plan = 'premium', premium_since = now()
  where id = auth.uid()
  returning * into updated;

  return updated;
end;
$$;

revoke execute on function public.guard_profile_plan_update() from public, anon, authenticated;
revoke execute on function public.activate_premium() from public, anon;
grant execute on function public.activate_premium() to authenticated;
