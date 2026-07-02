-- Real payment integration (Kiwify): premium can no longer be granted by the
-- client calling activate_premium() directly — that was fine as a temporary
-- stand-in, but let any signed-in user unlock premium for free. Now premium
-- is only granted by our Kiwify webhook handler, which runs with the
-- service_role key after verifying the webhook token and payment status.

revoke execute on function public.activate_premium() from authenticated;

create or replace function public.grant_premium_by_email(p_email text)
returns public.profiles
language plpgsql
security definer
set search_path = public
as $$
declare
  updated public.profiles;
begin
  perform set_config('app.allow_plan_change', 'on', true);

  update public.profiles
  set plan = 'premium', premium_since = now()
  where email = p_email
  returning * into updated;

  if updated.id is null then
    raise exception 'No profile found for email %', p_email;
  end if;

  return updated;
end;
$$;

revoke execute on function public.grant_premium_by_email(text) from public, anon, authenticated;
grant execute on function public.grant_premium_by_email(text) to service_role;
