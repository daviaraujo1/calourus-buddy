-- Grant admin role and premium plan to calourusuporte@gmail.com
DO $$
DECLARE
  v_uid uuid;
BEGIN
  SELECT id INTO v_uid FROM auth.users WHERE lower(email) = lower('calourusuporte@gmail.com') LIMIT 1;
  IF v_uid IS NOT NULL THEN
    INSERT INTO public.user_roles (user_id, role) VALUES (v_uid, 'admin')
      ON CONFLICT (user_id, role) DO NOTHING;
    UPDATE public.profiles SET plan = 'premium', updated_at = now() WHERE id = v_uid;
  END IF;
END $$;