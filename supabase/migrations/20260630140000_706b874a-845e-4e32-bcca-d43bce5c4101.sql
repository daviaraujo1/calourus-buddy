-- Admin panel support: expose email on profiles (denormalized from auth.users)
-- and let admins read every profile / manage role assignments.

alter table public.profiles add column email text;

-- Backfill existing rows from auth.users (migrations run with elevated
-- privileges, so this bypasses RLS).
update public.profiles p
set email = u.email
from auth.users u
where u.id = p.id and p.email is null;

-- Keep email in sync for new signups.
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

  return new;
end;
$$;

-- Admins can see every student's profile (own-row policy from the first
-- migration still covers regular users).
create policy "Admins can view all profiles"
on public.profiles for select
to authenticated
using (public.has_role(auth.uid(), 'admin'));

-- Admins can grant roles to any user.
create policy "Admins can insert roles"
on public.user_roles for insert
to authenticated
with check (public.has_role(auth.uid(), 'admin'));

-- Admins can revoke admin access from other accounts, but never their own
-- (prevents accidentally locking the last admin out) and only the 'admin'
-- row itself (a user's base 'student' role isn't removable this way).
create policy "Admins can delete admin role from others"
on public.user_roles for delete
to authenticated
using (
  public.has_role(auth.uid(), 'admin')
  and role = 'admin'
  and user_id <> auth.uid()
);
