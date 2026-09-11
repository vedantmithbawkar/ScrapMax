-- ========================================================
-- AiCLE - SUPABASE DATABASE SCHEMA
-- ========================================================

-- Enable UUID Extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. PROFILES TABLE (Linked to auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  phone TEXT,
  role TEXT NOT NULL CHECK (role IN ('household', 'collector')),
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. PICKUP REQUESTS TABLE
CREATE TABLE IF NOT EXISTS public.pickup_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  household_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  collector_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'in_progress', 'completed', 'cancelled')),
  address TEXT NOT NULL,
  latitude DOUBLE PRECISION NOT NULL,
  longitude DOUBLE PRECISION NOT NULL,
  scheduled_date DATE NOT NULL,
  notes TEXT,
  total_estimated_weight_kg DECIMAL(8, 2) DEFAULT 0,
  photos TEXT[] DEFAULT '{}',
  payment_json JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Migration safety: add photos and payment_json columns if table already exists
ALTER TABLE public.pickup_requests ADD COLUMN IF NOT EXISTS photos TEXT[] DEFAULT '{}';
ALTER TABLE public.pickup_requests ADD COLUMN IF NOT EXISTS payment_json JSONB;

-- 3. WASTE ITEMS TABLE
CREATE TABLE IF NOT EXISTS public.waste_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id UUID NOT NULL REFERENCES public.pickup_requests(id) ON DELETE CASCADE,
  category TEXT NOT NULL CHECK (category IN ('PAPER', 'PLASTIC', 'METAL', 'E_WASTE', 'GLASS', 'ORGANIC')),
  approx_weight_kg DECIMAL(6, 2) NOT NULL,
  photos TEXT[] DEFAULT '{}',
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. CHATS TABLE
CREATE TABLE IF NOT EXISTS public.chats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id UUID NOT NULL REFERENCES public.pickup_requests(id) ON DELETE CASCADE,
  household_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  collector_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT unique_request_chat UNIQUE (request_id)
);

-- 5. MESSAGES TABLE
CREATE TABLE IF NOT EXISTS public.messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  chat_id UUID NOT NULL REFERENCES public.chats(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  text TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. COLLECTOR LIVE LOCATIONS TABLE
CREATE TABLE IF NOT EXISTS public.collector_locations (
  collector_id UUID PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
  latitude DOUBLE PRECISION NOT NULL,
  longitude DOUBLE PRECISION NOT NULL,
  heading DOUBLE PRECISION DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ========================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ========================================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pickup_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.waste_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.collector_locations ENABLE ROW LEVEL SECURITY;

-- Profiles Policies
CREATE POLICY "Public profiles are viewable by authenticated users"
  ON public.profiles FOR SELECT TO authenticated USING (true);

CREATE POLICY "Users can insert their own profile"
  ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id);

-- Pickup Requests Policies
CREATE POLICY "Households can view their own requests, Collectors can view pending or assigned requests"
  ON public.pickup_requests FOR SELECT TO authenticated
  USING (
    household_id = auth.uid() OR
    collector_id = auth.uid() OR
    (status = 'pending')
  );

CREATE POLICY "Households can create pickup requests"
  ON public.pickup_requests FOR INSERT TO authenticated
  WITH CHECK (household_id = auth.uid());

CREATE POLICY "Households can update pending requests, Collectors can accept/update assigned requests"
  ON public.pickup_requests FOR UPDATE TO authenticated
  USING (
    household_id = auth.uid() OR
    collector_id = auth.uid() OR
    (status = 'pending')
  );

-- Waste Items Policies
CREATE POLICY "Users can view waste items for visible requests"
  ON public.waste_items FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.pickup_requests pr
      WHERE pr.id = waste_items.request_id
      AND (pr.household_id = auth.uid() OR pr.collector_id = auth.uid() OR pr.status = 'pending')
    )
  );

CREATE POLICY "Households can insert waste items"
  ON public.waste_items FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.pickup_requests pr
      WHERE pr.id = waste_items.request_id AND pr.household_id = auth.uid()
    )
  );

-- Chats & Messages Policies
CREATE POLICY "Chat participants can view chats"
  ON public.chats FOR SELECT TO authenticated
  USING (household_id = auth.uid() OR collector_id = auth.uid());

CREATE POLICY "Participants can create chats"
  ON public.chats FOR INSERT TO authenticated
  WITH CHECK (household_id = auth.uid() OR collector_id = auth.uid());

CREATE POLICY "Chat participants can view messages"
  ON public.messages FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.chats c
      WHERE c.id = messages.chat_id AND (c.household_id = auth.uid() OR c.collector_id = auth.uid())
    )
  );

CREATE POLICY "Chat participants can insert messages"
  ON public.messages FOR INSERT TO authenticated
  WITH CHECK (
    sender_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM public.chats c
      WHERE c.id = messages.chat_id AND (c.household_id = auth.uid() OR c.collector_id = auth.uid())
    )
  );

-- Collector Locations Policies
CREATE POLICY "Anyone authenticated can view collector locations"
  ON public.collector_locations FOR SELECT TO authenticated USING (true);

CREATE POLICY "Collectors can upsert their own location"
  ON public.collector_locations FOR ALL TO authenticated
  USING (collector_id = auth.uid())
  WITH CHECK (collector_id = auth.uid());

-- Realtime Publication
ALTER PUBLICATION supabase_realtime ADD TABLE public.pickup_requests;
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.collector_locations;

-- ========================================================
-- 7. AUTOMATIC PROFILE CREATION TRIGGER
-- Whenever a user signs up in auth.users, create their profile row
-- ========================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, phone, role)
  VALUES (
    new.id,
    COALESCE(new.raw_user_meta_data->>'full_name', 'New User'),
    new.raw_user_meta_data->>'phone',
    COALESCE(new.raw_user_meta_data->>'role', 'household')
  )
  ON CONFLICT (id) DO UPDATE
  SET full_name = EXCLUDED.full_name,
      phone = EXCLUDED.phone,
      role = EXCLUDED.role;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ========================================================
-- 8. STORAGE BUCKET FOR SCRAP PHOTOS
-- ========================================================
INSERT INTO storage.buckets (id, name, public)
VALUES ('pickup-photos', 'pickup-photos', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- Storage policies
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'Public Access to Scrap Photos'
  ) THEN
    CREATE POLICY "Public Access to Scrap Photos"
      ON storage.objects FOR SELECT
      USING (bucket_id = 'pickup-photos');
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'Authenticated Scrap Photo Upload'
  ) THEN
    CREATE POLICY "Authenticated Scrap Photo Upload"
      ON storage.objects FOR INSERT TO authenticated
      WITH CHECK (bucket_id = 'pickup-photos');
  END IF;
END $$;

-- ========================================================
-- 9. REPORTS TABLE
-- Supports both pickup/transaction reports and general platform reports
-- ========================================================

CREATE TABLE IF NOT EXISTS public.reports (
  id                UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  report_number     TEXT        UNIQUE NOT NULL,
  reporter_id       UUID        NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  report_type       TEXT        NOT NULL CHECK (report_type IN ('transaction', 'platform')),
  category          TEXT        NOT NULL,
  subject           TEXT,
  description       TEXT,
  evidence_urls     TEXT[]      DEFAULT '{}',
  status            TEXT        NOT NULL DEFAULT 'open'
                                CHECK (status IN ('open','under_review','investigating',
                                                  'resolution_proposed','resolved','closed')),
  priority          TEXT        NOT NULL DEFAULT 'normal'
                                CHECK (priority IN ('low','normal','high','critical')),
  -- transaction-specific (NULL for platform reports)
  pickup_id         UUID        REFERENCES public.pickup_requests(id) ON DELETE SET NULL,
  collector_id      UUID        REFERENCES public.profiles(id) ON DELETE SET NULL,
  -- admin fields
  admin_notes       TEXT,
  resolution        TEXT,
  resolved_at       TIMESTAMPTZ,
  created_at        TIMESTAMPTZ DEFAULT NOW(),
  updated_at        TIMESTAMPTZ DEFAULT NOW()
);

-- ========================================================
-- 10. REPORT EVENTS TABLE (audit trail / status history)
-- ========================================================

CREATE TABLE IF NOT EXISTS public.report_events (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  report_id   UUID        NOT NULL REFERENCES public.reports(id) ON DELETE CASCADE,
  actor_id    UUID        REFERENCES public.profiles(id) ON DELETE SET NULL,
  event_type  TEXT        NOT NULL, -- 'status_change' | 'priority_change' | 'note_added' | 'resolved'
  old_value   TEXT,
  new_value   TEXT,
  note        TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ========================================================
-- RLS FOR REPORTS
-- ========================================================

ALTER TABLE public.reports       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.report_events ENABLE ROW LEVEL SECURITY;

-- Reporters can see their own reports
CREATE POLICY "Reporters can view own reports"
  ON public.reports FOR SELECT TO authenticated
  USING (reporter_id = auth.uid());

-- Admins can see all reports
CREATE POLICY "Admins can view all reports"
  ON public.reports FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.role = 'admin'
    )
  );

-- Authenticated users can create reports
CREATE POLICY "Authenticated users can create reports"
  ON public.reports FOR INSERT TO authenticated
  WITH CHECK (reporter_id = auth.uid());

-- Admins can update reports (status, priority, notes, resolution)
CREATE POLICY "Admins can update reports"
  ON public.reports FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.role = 'admin'
    )
  );

-- Report events: reporters and admins can view
CREATE POLICY "Reporters can view own report events"
  ON public.report_events FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.reports r
      WHERE r.id = report_events.report_id AND r.reporter_id = auth.uid()
    )
  );

CREATE POLICY "Admins can view all report events"
  ON public.report_events FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.role = 'admin'
    )
  );

CREATE POLICY "Admins can insert report events"
  ON public.report_events FOR INSERT TO authenticated
  WITH CHECK (
    actor_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.role = 'admin'
    )
  );

-- System can insert events when reporter submits (via service role)
CREATE POLICY "Reporters can insert initial events"
  ON public.report_events FOR INSERT TO authenticated
  WITH CHECK (
    actor_id = auth.uid()
  );

-- Realtime for reports
ALTER PUBLICATION supabase_realtime ADD TABLE public.reports;
ALTER PUBLICATION supabase_realtime ADD TABLE public.report_events;

-- Update profiles role check to include 'admin'
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_role_check;
ALTER TABLE public.profiles ADD CONSTRAINT profiles_role_check
  CHECK (role IN ('household', 'collector', 'admin'));

