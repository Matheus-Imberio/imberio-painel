-- Cria/atualiza os usuários iniciais do painel IMBERIO.

CREATE EXTENSION IF NOT EXISTS pgcrypto;

DO $$
DECLARE
  admin_id uuid;
  operator_id uuid;
BEGIN
  SELECT id INTO admin_id
  FROM auth.users
  WHERE email = 'adminimberio@gmail.com'
  LIMIT 1;

  IF admin_id IS NULL THEN
    admin_id := '5d77a9a9-7b2c-49dc-b1f5-8d8c4b155001'::uuid;

    INSERT INTO auth.users (
      instance_id,
      id,
      aud,
      role,
      email,
      encrypted_password,
      email_confirmed_at,
      invited_at,
      confirmation_token,
      confirmation_sent_at,
      recovery_token,
      recovery_sent_at,
      email_change_token_new,
      email_change,
      email_change_sent_at,
      last_sign_in_at,
      raw_app_meta_data,
      raw_user_meta_data,
      is_super_admin,
      created_at,
      updated_at,
      phone,
      phone_confirmed_at,
      phone_change,
      phone_change_token,
      phone_change_sent_at,
      email_change_token_current,
      email_change_confirm_status,
      banned_until,
      reauthentication_token,
      reauthentication_sent_at,
      is_sso_user,
      deleted_at,
      is_anonymous
    )
    VALUES (
      '00000000-0000-0000-0000-000000000000',
      admin_id,
      'authenticated',
      'authenticated',
      'adminimberio@gmail.com',
      extensions.crypt('IMBERIOECIA', extensions.gen_salt('bf')),
      now(),
      NULL,
      '',
      NULL,
      '',
      NULL,
      '',
      '',
      NULL,
      NULL,
      '{"provider":"email","providers":["email"]}'::jsonb,
      '{}'::jsonb,
      NULL,
      now(),
      now(),
      NULL,
      NULL,
      '',
      '',
      NULL,
      '',
      0,
      NULL,
      '',
      NULL,
      false,
      NULL,
      false
    );
  ELSE
    UPDATE auth.users
    SET
      encrypted_password = extensions.crypt('IMBERIOECIA', extensions.gen_salt('bf')),
      email_confirmed_at = COALESCE(email_confirmed_at, now()),
      raw_app_meta_data = '{"provider":"email","providers":["email"]}'::jsonb,
      updated_at = now()
    WHERE id = admin_id;
  END IF;

  INSERT INTO auth.identities (
    id,
    user_id,
    provider_id,
    identity_data,
    provider,
    last_sign_in_at,
    created_at,
    updated_at
  )
  VALUES (
    gen_random_uuid(),
    admin_id,
    admin_id::text,
    jsonb_build_object('sub', admin_id::text, 'email', 'adminimberio@gmail.com', 'email_verified', true, 'phone_verified', false),
    'email',
    now(),
    now(),
    now()
  )
  ON CONFLICT (provider_id, provider) DO UPDATE
  SET
    user_id = EXCLUDED.user_id,
    identity_data = EXCLUDED.identity_data,
    updated_at = now();

  INSERT INTO public.profiles (id, name, role)
  VALUES (admin_id, 'Administrador IMBERIO', 'admin')
  ON CONFLICT (id) DO UPDATE
  SET
    name = EXCLUDED.name,
    role = EXCLUDED.role;

  SELECT id INTO operator_id
  FROM auth.users
  WHERE email = 'operadorimberio@gmail.com'
  LIMIT 1;

  IF operator_id IS NULL THEN
    operator_id := '5d77a9a9-7b2c-49dc-b1f5-8d8c4b155002'::uuid;

    INSERT INTO auth.users (
      instance_id,
      id,
      aud,
      role,
      email,
      encrypted_password,
      email_confirmed_at,
      invited_at,
      confirmation_token,
      confirmation_sent_at,
      recovery_token,
      recovery_sent_at,
      email_change_token_new,
      email_change,
      email_change_sent_at,
      last_sign_in_at,
      raw_app_meta_data,
      raw_user_meta_data,
      is_super_admin,
      created_at,
      updated_at,
      phone,
      phone_confirmed_at,
      phone_change,
      phone_change_token,
      phone_change_sent_at,
      email_change_token_current,
      email_change_confirm_status,
      banned_until,
      reauthentication_token,
      reauthentication_sent_at,
      is_sso_user,
      deleted_at,
      is_anonymous
    )
    VALUES (
      '00000000-0000-0000-0000-000000000000',
      operator_id,
      'authenticated',
      'authenticated',
      'operadorimberio@gmail.com',
      extensions.crypt('IMBERIOECIA', extensions.gen_salt('bf')),
      now(),
      NULL,
      '',
      NULL,
      '',
      NULL,
      '',
      '',
      NULL,
      NULL,
      '{"provider":"email","providers":["email"]}'::jsonb,
      '{}'::jsonb,
      NULL,
      now(),
      now(),
      NULL,
      NULL,
      '',
      '',
      NULL,
      '',
      0,
      NULL,
      '',
      NULL,
      false,
      NULL,
      false
    );
  ELSE
    UPDATE auth.users
    SET
      encrypted_password = extensions.crypt('IMBERIOECIA', extensions.gen_salt('bf')),
      email_confirmed_at = COALESCE(email_confirmed_at, now()),
      raw_app_meta_data = '{"provider":"email","providers":["email"]}'::jsonb,
      updated_at = now()
    WHERE id = operator_id;
  END IF;

  INSERT INTO auth.identities (
    id,
    user_id,
    provider_id,
    identity_data,
    provider,
    last_sign_in_at,
    created_at,
    updated_at
  )
  VALUES (
    gen_random_uuid(),
    operator_id,
    operator_id::text,
    jsonb_build_object('sub', operator_id::text, 'email', 'operadorimberio@gmail.com', 'email_verified', true, 'phone_verified', false),
    'email',
    now(),
    now(),
    now()
  )
  ON CONFLICT (provider_id, provider) DO UPDATE
  SET
    user_id = EXCLUDED.user_id,
    identity_data = EXCLUDED.identity_data,
    updated_at = now();

  INSERT INTO public.profiles (id, name, role)
  VALUES (operator_id, 'Operador IMBERIO', 'operador')
  ON CONFLICT (id) DO UPDATE
  SET
    name = EXCLUDED.name,
    role = EXCLUDED.role;
END $$;

