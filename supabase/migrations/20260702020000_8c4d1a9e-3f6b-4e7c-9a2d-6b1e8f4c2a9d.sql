-- The guard that stops a user from self-promoting to Premium via a plain
-- client-side update got lost somewhere between migration branches — the
-- live schema currently has `plan` writable directly by its own RLS
-- policy. Re-establish it here, adapted to the schema that's actually live
-- (no `premium_since`, and premium is granted via grant_premium_by_email()
-- rather than activate_premium()).

create or replace function public.guard_profile_plan_update()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if new.plan is distinct from old.plan
     and coalesce(current_setting('app.allow_plan_change', true), '') <> 'on' then
    raise exception 'plan can only be changed via public.grant_premium_by_email()';
  end if;
  return new;
end;
$$;

drop trigger if exists profiles_guard_plan_update on public.profiles;
create trigger profiles_guard_plan_update
before update on public.profiles
for each row execute function public.guard_profile_plan_update();

revoke execute on function public.guard_profile_plan_update() from public, anon, authenticated;

-- Re-declared so it can flip the session flag the trigger checks for.
create or replace function public.grant_premium_by_email(p_email text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  perform set_config('app.allow_plan_change', 'on', true);
  update public.profiles
     set plan = 'premium', updated_at = now()
   where lower(email) = lower(p_email);
end;
$$;

revoke execute on function public.grant_premium_by_email(text) from public, anon, authenticated;
grant execute on function public.grant_premium_by_email(text) to service_role;
