-- ============================================================================
-- AiCLE / ScrapMax: SEED DEMO USERS & SAMPLE PICKUP DATA
-- Run this query directly in your Supabase Project > SQL Editor
-- Link: https://supabase.com/dashboard/project/qaoczojfnraivdhbxsab/sql/new
-- ============================================================================

-- 0. Ensure extensions & schema columns exist
CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Migration check: ensure photos column exists if table was created previously
ALTER TABLE public.pickup_requests ADD COLUMN IF NOT EXISTS photos TEXT[] DEFAULT '{}';
ALTER TABLE public.waste_items ADD COLUMN IF NOT EXISTS photos TEXT[] DEFAULT '{}';

-- ----------------------------------------------------------------------------
-- 1. CLEAN UP & FIX ANY NULL STRING COLUMNS IN auth.users
-- ----------------------------------------------------------------------------
DELETE FROM public.waste_items WHERE request_id = 'c0000000-0000-0000-0000-000000000003'::uuid;
DELETE FROM public.pickup_requests WHERE id = 'c0000000-0000-0000-0000-000000000003'::uuid;
DELETE FROM public.profiles WHERE id IN ('a0000000-0000-0000-0000-000000000001'::uuid, 'b0000000-0000-0000-0000-000000000002'::uuid);
DELETE FROM auth.identities WHERE user_id IN ('a0000000-0000-0000-0000-000000000001'::uuid, 'b0000000-0000-0000-0000-000000000002'::uuid);
DELETE FROM auth.users WHERE email IN ('household@aicle.demo', 'collector@aicle.demo') OR id IN ('a0000000-0000-0000-0000-000000000001'::uuid, 'b0000000-0000-0000-0000-000000000002'::uuid);

UPDATE auth.users
SET 
  confirmation_token = COALESCE(confirmation_token, ''),
  recovery_token = COALESCE(recovery_token, ''),
  email_change_token_new = COALESCE(email_change_token_new, ''),
  email_change = COALESCE(email_change, ''),
  phone_change = COALESCE(phone_change, ''),
  phone_change_token = COALESCE(phone_change_token, ''),
  email_change_token_current = COALESCE(email_change_token_current, ''),
  reauthentication_token = COALESCE(reauthentication_token, '');

-- ----------------------------------------------------------------------------
-- 2. INSERT DEMO USERS INTO auth.users
-- (confirmed_at is omitted as it is auto-computed by PostgreSQL)
-- Password for both: demo123456
-- ----------------------------------------------------------------------------

-- A) Household Demo User: household@aicle.demo
INSERT INTO auth.users (
  id,
  instance_id,
  email,
  encrypted_password,
  email_confirmed_at,
  created_at,
  updated_at,
  last_sign_in_at,
  raw_app_meta_data,
  raw_user_meta_data,
  is_super_admin,
  role,
  aud,
  confirmation_token,
  recovery_token,
  email_change_token_new,
  email_change,
  phone_change,
  phone_change_token,
  email_change_token_current,
  reauthentication_token
) VALUES (
  'a0000000-0000-0000-0000-000000000001'::uuid,
  '00000000-0000-0000-0000-000000000000'::uuid,
  'household@aicle.demo',
  crypt('demo123456', gen_salt('bf')),
  now(),
  now(),
  now(),
  now(),
  '{"provider":"email","providers":["email"]}'::jsonb,
  '{"full_name":"Sahil Household","role":"household","phone":"+91 9876543210"}'::jsonb,
  false,
  'authenticated',
  'authenticated',
  '',
  '',
  '',
  '',
  '',
  '',
  '',
  ''
);

-- B) Collector Demo User: collector@aicle.demo
INSERT INTO auth.users (
  id,
  instance_id,
  email,
  encrypted_password,
  email_confirmed_at,
  created_at,
  updated_at,
  last_sign_in_at,
  raw_app_meta_data,
  raw_user_meta_data,
  is_super_admin,
  role,
  aud,
  confirmation_token,
  recovery_token,
  email_change_token_new,
  email_change,
  phone_change,
  phone_change_token,
  email_change_token_current,
  reauthentication_token
) VALUES (
  'b0000000-0000-0000-0000-000000000002'::uuid,
  '00000000-0000-0000-0000-000000000000'::uuid,
  'collector@aicle.demo',
  crypt('demo123456', gen_salt('bf')),
  now(),
  now(),
  now(),
  now(),
  '{"provider":"email","providers":["email"]}'::jsonb,
  '{"full_name":"Budi Collector","role":"collector","phone":"+91 9123456780"}'::jsonb,
  false,
  'authenticated',
  'authenticated',
  '',
  '',
  '',
  '',
  '',
  '',
  '',
  ''
);

-- ----------------------------------------------------------------------------
-- 3. INSERT IDENTITIES (Safely detects Supabase schema version)
-- ----------------------------------------------------------------------------
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'auth' AND table_name = 'identities' AND column_name = 'provider_id'
  ) THEN
    EXECUTE '
      INSERT INTO auth.identities (id, provider_id, user_id, identity_data, provider, last_sign_in_at, created_at, updated_at)
      VALUES 
      (
        ''a0000000-0000-0000-0000-000000000001'',
        ''household@aicle.demo'',
        ''a0000000-0000-0000-0000-000000000001''::uuid,
        json_build_object(''sub'', ''a0000000-0000-0000-0000-000000000001'', ''email'', ''household@aicle.demo'')::jsonb,
        ''email'',
        now(),
        now(),
        now()
      ),
      (
        ''b0000000-0000-0000-0000-000000000002'',
        ''collector@aicle.demo'',
        ''b0000000-0000-0000-0000-000000000002''::uuid,
        json_build_object(''sub'', ''b0000000-0000-0000-0000-000000000002'', ''email'', ''collector@aicle.demo'')::jsonb,
        ''email'',
        now(),
        now(),
        now()
      )
    ';
  ELSE
    EXECUTE '
      INSERT INTO auth.identities (id, user_id, identity_data, provider, last_sign_in_at, created_at, updated_at)
      VALUES 
      (
        ''a0000000-0000-0000-0000-000000000001'',
        ''a0000000-0000-0000-0000-000000000001''::uuid,
        json_build_object(''sub'', ''a0000000-0000-0000-0000-000000000001'', ''email'', ''household@aicle.demo'')::jsonb,
        ''email'',
        now(),
        now(),
        now()
      ),
      (
        ''b0000000-0000-0000-0000-000000000002'',
        ''b0000000-0000-0000-0000-000000000002''::uuid,
        json_build_object(''sub'', ''b0000000-0000-0000-0000-000000000002'', ''email'', ''collector@aicle.demo'')::jsonb,
        ''email'',
        now(),
        now(),
        now()
      )
    ';
  END IF;
END $$;

-- ----------------------------------------------------------------------------
-- 4. INSERT INTO public.profiles
-- ----------------------------------------------------------------------------
INSERT INTO public.profiles (id, full_name, phone, role)
VALUES 
(
  'a0000000-0000-0000-0000-000000000001'::uuid,
  'Sahil Household',
  '+91 9876543210',
  'household'
),
(
  'b0000000-0000-0000-0000-000000000002'::uuid,
  'Budi Collector',
  '+91 9123456780',
  'collector'
);

-- ----------------------------------------------------------------------------
-- 5. INSERT SAMPLE PICKUP REQUEST & WASTE ITEMS
-- ----------------------------------------------------------------------------
INSERT INTO public.pickup_requests (
  id,
  household_id,
  collector_id,
  status,
  address,
  latitude,
  longitude,
  scheduled_date,
  notes,
  total_estimated_weight_kg,
  photos
) VALUES (
  'c0000000-0000-0000-0000-000000000003'::uuid,
  'a0000000-0000-0000-0000-000000000001'::uuid,
  NULL,
  'pending',
  'Indiranagar 100ft Road, Bangalore, Karnataka',
  12.9784,
  77.6408,
  CURRENT_DATE,
  'Bundled cardboard and cleaned plastic containers ready near gate.',
  14.5,
  ARRAY['https://images.unsplash.com/photo-1532996122724-e3c354a0b15b?auto=format&fit=crop&w=600&q=80']
);

INSERT INTO public.waste_items (request_id, category, approx_weight_kg, notes, photos)
VALUES 
  ('c0000000-0000-0000-0000-000000000003'::uuid, 'PAPER', 8.5, 'Cardboard & newspapers', ARRAY['https://images.unsplash.com/photo-1532996122724-e3c354a0b15b?auto=format&fit=crop&w=600&q=80']),
  ('c0000000-0000-0000-0000-000000000003'::uuid, 'PLASTIC', 6.0, 'PET bottles & plastic scrap', ARRAY['https://images.unsplash.com/photo-1567095761054-7a02e69e5c43?auto=format&fit=crop&w=600&q=80']);
