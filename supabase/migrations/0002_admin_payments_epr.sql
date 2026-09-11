-- ========================================================
-- SCRAPMAX ADDITIVE MIGRATION: ADMIN ROLE, PAYMENTS & EPR
-- File: supabase/migrations/0002_admin_payments_epr.sql
-- ========================================================

-- 1. WIDEN PROFILES ROLE CONSTRAINT TO INCLUDE 'admin'
DO $$
DECLARE
  c_name text;
BEGIN
  SELECT conname INTO c_name
  FROM pg_constraint
  WHERE conrelid = 'public.profiles'::regclass
    AND contype = 'c'
    AND pg_get_constraintdef(oid) LIKE '%role IN (%household%collector%';

  IF c_name IS NOT NULL THEN
    EXECUTE format('ALTER TABLE public.profiles DROP CONSTRAINT %I', c_name);
  END IF;
END $$;

ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_role_check
  CHECK (role IN ('household', 'collector', 'admin'));

-- 2. CREATE PAYMENTS TABLE
CREATE TABLE IF NOT EXISTS public.payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pickup_request_id UUID NOT NULL REFERENCES public.pickup_requests(id) ON DELETE CASCADE,
  amount NUMERIC(12, 2) NOT NULL CHECK (amount >= 0),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'failed')),
  method TEXT NULL,
  paid_at TIMESTAMPTZ NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT unique_pickup_payment UNIQUE (pickup_request_id)
);

-- 3. PAYMENTS ROW LEVEL SECURITY (RLS) POLICIES
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

-- Allow participants (household / collector) and admins to view payment status
CREATE POLICY "Participants and admins can view payments"
  ON public.payments FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.pickup_requests pr
      WHERE pr.id = payments.pickup_request_id
      AND (
        pr.household_id = auth.uid() OR
        pr.collector_id = auth.uid()
      )
    ) OR
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.role = 'admin'
    )
  );

-- Admin only: Insert payments
CREATE POLICY "Admins can insert payments"
  ON public.payments FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.role = 'admin'
    )
  );

-- Admin only: Update payments
CREATE POLICY "Admins can update payments"
  ON public.payments FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.role = 'admin'
    )
  );

-- 4. TIGHT-SCOPE ADMIN READ ACCESS FOR SYSTEM ANALYTICS
CREATE POLICY "Admins can view all profiles for analytics"
  ON public.profiles FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.role = 'admin'
    )
  );

CREATE POLICY "Admins can view all pickup_requests for analytics"
  ON public.pickup_requests FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.role = 'admin'
    )
  );

CREATE POLICY "Admins can view all waste_items for analytics"
  ON public.waste_items FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.role = 'admin'
    )
  );

-- 5. EPR COMPLIANCE RECORDS TABLE (ADDITIVE)
CREATE TABLE IF NOT EXISTS public.epr_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  category TEXT NOT NULL CHECK (category IN ('PAPER', 'PLASTIC', 'METAL', 'E_WASTE', 'GLASS', 'ORGANIC')),
  weight_kg NUMERIC(10, 2) NOT NULL CHECK (weight_kg >= 0),
  linked_pickup_id UUID REFERENCES public.pickup_requests(id) ON DELETE SET NULL,
  verified BOOLEAN NOT NULL DEFAULT false,
  notes TEXT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.epr_records ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view epr_records"
  ON public.epr_records FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.role = 'admin'
    )
  );

CREATE POLICY "Admins can manage epr_records"
  ON public.epr_records FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.role = 'admin'
    )
  );
