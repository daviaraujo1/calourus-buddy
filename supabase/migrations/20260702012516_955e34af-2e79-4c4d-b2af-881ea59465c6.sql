
-- Add plan + email to profiles
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS plan text NOT NULL DEFAULT 'free',
  ADD COLUMN IF NOT EXISTS email text;

-- Backfill email from auth.users
UPDATE public.profiles p
SET email = u.email
FROM auth.users u
WHERE p.id = u.id AND p.email IS NULL;

-- Update handle_new_user to also set email
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
begin
  insert into public.profiles (id, full_name, avatar_url, email)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)),
    new.raw_user_meta_data->>'avatar_url',
    new.email
  );
  insert into public.user_roles (user_id, role) values (new.id, 'student');
  insert into public.user_stats (user_id) values (new.id) on conflict do nothing;
  return new;
end;
$$;

-- RPC to grant premium by email (used by Kiwify webhook and admin ops)
CREATE OR REPLACE FUNCTION public.grant_premium_by_email(p_email text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.profiles
     SET plan = 'premium', updated_at = now()
   WHERE lower(email) = lower(p_email);
END;
$$;

REVOKE EXECUTE ON FUNCTION public.grant_premium_by_email(text) FROM PUBLIC, anon, authenticated;

-- Grant premium to davaraujoo31@gmail.com (idempotent)
UPDATE public.profiles p
SET plan = 'premium', updated_at = now()
FROM auth.users u
WHERE p.id = u.id AND lower(u.email) = 'davaraujoo31@gmail.com';
