-- Both branches of this project redefined handle_new_user() independently:
-- one added the `email` backfill (for admin/checkout), the other added the
-- `user_stats` insert (for gamification). This migration merges both so new
-- signups get profiles.email populated AND a user_stats row, in one place.

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, avatar_url, email)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)),
    new.raw_user_meta_data->>'avatar_url',
    new.email
  );

  insert into public.user_roles (user_id, role)
  values (new.id, 'student');

  insert into public.user_stats (user_id)
  values (new.id)
  on conflict do nothing;

  return new;
end;
$$;
