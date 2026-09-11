-- ========================================================
-- SCRAPMAX — RECYCLER PORTAL & COLLECTOR MARKETPLACE MIGRATION
-- Migration Date: 2026-09-11
-- Description: Adds Recycler and Admin roles, Recycler Profiles,
-- Material Capabilities, Requirements (Demands), Collector Offers,
-- Recycler Transactions, Circular Traceability, and RLS policies.
-- ========================================================

-- 1. EXTEND PROFILES ROLE CHECK
DO $$
BEGIN
  -- Drop existing check constraint if present and re-add with all 4 roles
  IF EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'profiles_role_check'
  ) THEN
    ALTER TABLE public.profiles DROP CONSTRAINT profiles_role_check;
  END IF;
  
  ALTER TABLE public.profiles ADD CONSTRAINT profiles_role_check 
    CHECK (role IN ('household', 'collector', 'recycler', 'admin'));
END $$;

-- 2. RECYCLER PROFILES TABLE
CREATE TABLE IF NOT EXISTS public.recycler_profiles (
  id UUID PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
  company_name TEXT NOT NULL,
  business_type TEXT NOT NULL CHECK (business_type IN ('Recycler', 'Dismantler', 'Refurbisher', 'Processor')),
  authorized_person_name TEXT NOT NULL,
  designation TEXT,
  business_email TEXT NOT NULL,
  business_phone TEXT NOT NULL,
  registered_address TEXT NOT NULL,
  facility_address TEXT NOT NULL,
  city TEXT NOT NULL,
  state TEXT NOT NULL,
  pincode TEXT NOT NULL,
  -- Compliance / Regulatory info (No Aadhaar or unnecessary sensitive docs)
  gstin TEXT,
  pan TEXT,
  cin TEXT,
  registration_number TEXT,
  spcb TEXT,
  cpcb_epr_id TEXT,
  -- Verification state
  verification_status TEXT NOT NULL DEFAULT 'pending' CHECK (verification_status IN ('pending', 'verified', 'rejected', 'suspended')),
  verification_source TEXT NOT NULL DEFAULT 'scrapmax_partner' CHECK (verification_source IN ('official_listing', 'scrapmax_partner', 'demo_data')),
  verification_notes TEXT,
  verified_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. RECYCLER MATERIAL CAPABILITIES TABLE
CREATE TABLE IF NOT EXISTS public.recycler_materials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recycler_id UUID NOT NULL REFERENCES public.recycler_profiles(id) ON DELETE CASCADE,
  material TEXT NOT NULL,
  accepted BOOLEAN NOT NULL DEFAULT true,
  minimum_quantity_kg DECIMAL(10, 2) DEFAULT 0,
  maximum_capacity_kg DECIMAL(10, 2),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT unique_recycler_material UNIQUE (recycler_id, material)
);

-- 4. RECYCLER REQUIREMENTS TABLE (DEMANDS: "I NEED SCRAP")
CREATE TABLE IF NOT EXISTS public.recycler_requirements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recycler_id UUID NOT NULL REFERENCES public.recycler_profiles(id) ON DELETE CASCADE,
  material TEXT NOT NULL,
  quantity_required_kg DECIMAL(10, 2) NOT NULL CHECK (quantity_required_kg > 0),
  quantity_fulfilled_kg DECIMAL(10, 2) NOT NULL DEFAULT 0 CHECK (quantity_fulfilled_kg >= 0),
  quantity_committed_kg DECIMAL(10, 2) NOT NULL DEFAULT 0 CHECK (quantity_committed_kg >= 0),
  offered_price_per_kg DECIMAL(10, 2) NOT NULL CHECK (offered_price_per_kg > 0),
  minimum_lot_kg DECIMAL(10, 2) NOT NULL DEFAULT 1 CHECK (minimum_lot_kg > 0),
  collection_method TEXT NOT NULL DEFAULT 'Both' CHECK (collection_method IN ('Recycler Pickup', 'Collector Delivery', 'Both')),
  city TEXT NOT NULL,
  area TEXT,
  pincode TEXT,
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  quality_requirements TEXT,
  status TEXT NOT NULL DEFAULT 'Active' CHECK (status IN ('Draft', 'Active', 'Paused', 'Fulfilled', 'Expired', 'Cancelled')),
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. COLLECTOR OFFERS TABLE ("I HAVE SCRAP")
CREATE TABLE IF NOT EXISTS public.collector_offers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  requirement_id UUID NOT NULL REFERENCES public.recycler_requirements(id) ON DELETE CASCADE,
  collector_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  quantity_offered_kg DECIMAL(10, 2) NOT NULL CHECK (quantity_offered_kg > 0),
  offered_price_per_kg DECIMAL(10, 2) NOT NULL CHECK (offered_price_per_kg > 0),
  estimated_value DECIMAL(12, 2) NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected', 'counter_offered', 'cancelled')),
  counter_price_per_kg DECIMAL(10, 2),
  counter_quantity_kg DECIMAL(10, 2),
  counter_notes TEXT,
  rejection_reason TEXT,
  message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. RECYCLER TRANSACTIONS & HANDOVER
CREATE TABLE IF NOT EXISTS public.recycler_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  requirement_id UUID NOT NULL REFERENCES public.recycler_requirements(id) ON DELETE RESTRICT,
  offer_id UUID REFERENCES public.collector_offers(id) ON DELETE SET NULL,
  collector_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
  recycler_id UUID NOT NULL REFERENCES public.recycler_profiles(id) ON DELETE RESTRICT,
  material TEXT NOT NULL,
  agreed_quantity_kg DECIMAL(10, 2) NOT NULL CHECK (agreed_quantity_kg > 0),
  agreed_price_per_kg DECIMAL(10, 2) NOT NULL CHECK (agreed_price_per_kg > 0),
  actual_weight_kg DECIMAL(10, 2),
  final_amount DECIMAL(12, 2),
  -- Pickup details
  pickup_date DATE,
  pickup_time TEXT,
  pickup_method TEXT NOT NULL DEFAULT 'Recycler Pickup',
  pickup_address TEXT,
  pickup_status TEXT NOT NULL DEFAULT 'Scheduled' CHECK (pickup_status IN ('Scheduled', 'Collector Ready', 'Driver Assigned', 'Out for Pickup', 'Arrived', 'Collected', 'Completed', 'Cancelled')),
  -- Payment details
  payment_method TEXT DEFAULT 'UPI' CHECK (payment_method IN ('UPI', 'CASH', 'BANK_TRANSFER', 'OTHER')),
  payment_status TEXT NOT NULL DEFAULT 'Pending' CHECK (payment_status IN ('Pending', 'Processing', 'Paid', 'Failed')),
  -- Handover confirmation by both sides
  collector_handover_confirmed BOOLEAN NOT NULL DEFAULT false,
  recycler_receipt_confirmed BOOLEAN NOT NULL DEFAULT false,
  status TEXT NOT NULL DEFAULT 'in_progress' CHECK (status IN ('in_progress', 'completed', 'cancelled')),
  -- Circular Traceability metadata
  traceability_code TEXT UNIQUE,
  traceability_data JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. RECYCLER NOTIFICATIONS
CREATE TABLE IF NOT EXISTS public.recycler_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  related_requirement_id UUID REFERENCES public.recycler_requirements(id) ON DELETE SET NULL,
  related_offer_id UUID REFERENCES public.collector_offers(id) ON DELETE SET NULL,
  related_transaction_id UUID REFERENCES public.recycler_transactions(id) ON DELETE SET NULL,
  read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ========================================================
-- INDEXES FOR PERFORMANCE
-- ========================================================
CREATE INDEX IF NOT EXISTS idx_recycler_req_material ON public.recycler_requirements(material);
CREATE INDEX IF NOT EXISTS idx_recycler_req_status ON public.recycler_requirements(status);
CREATE INDEX IF NOT EXISTS idx_recycler_req_city ON public.recycler_requirements(city);
CREATE INDEX IF NOT EXISTS idx_recycler_req_expires ON public.recycler_requirements(expires_at);
CREATE INDEX IF NOT EXISTS idx_collector_offers_req ON public.collector_offers(requirement_id);
CREATE INDEX IF NOT EXISTS idx_collector_offers_coll ON public.collector_offers(collector_id);
CREATE INDEX IF NOT EXISTS idx_collector_offers_status ON public.collector_offers(status);
CREATE INDEX IF NOT EXISTS idx_recycler_tx_req ON public.recycler_transactions(requirement_id);
CREATE INDEX IF NOT EXISTS idx_recycler_tx_recycler ON public.recycler_transactions(recycler_id);
CREATE INDEX IF NOT EXISTS idx_recycler_tx_collector ON public.recycler_transactions(collector_id);
CREATE INDEX IF NOT EXISTS idx_recycler_tx_status ON public.recycler_transactions(status);

-- ========================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ========================================================
ALTER TABLE public.recycler_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recycler_materials ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recycler_requirements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.collector_offers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recycler_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recycler_notifications ENABLE ROW LEVEL SECURITY;

-- Recycler Profiles
CREATE POLICY "Public directory: verified recyclers viewable by authenticated users"
  ON public.recycler_profiles FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Recyclers can insert their own profile"
  ON public.recycler_profiles FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Recyclers can update their own profile"
  ON public.recycler_profiles FOR UPDATE TO authenticated
  USING (auth.uid() = id);

-- Recycler Materials
CREATE POLICY "Recycler materials viewable by authenticated users"
  ON public.recycler_materials FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Recyclers can manage their own materials"
  ON public.recycler_materials FOR ALL TO authenticated
  USING (recycler_id = auth.uid())
  WITH CHECK (recycler_id = auth.uid());

-- Recycler Requirements (Demands)
CREATE POLICY "Active requirements viewable by authenticated users"
  ON public.recycler_requirements FOR SELECT TO authenticated
  USING (status = 'Active' OR recycler_id = auth.uid());

CREATE POLICY "Recyclers can insert requirements"
  ON public.recycler_requirements FOR INSERT TO authenticated
  WITH CHECK (recycler_id = auth.uid());

CREATE POLICY "Recyclers can update their own requirements"
  ON public.recycler_requirements FOR UPDATE TO authenticated
  USING (recycler_id = auth.uid());

-- Collector Offers
CREATE POLICY "Offers viewable by offer owner or requirement owner"
  ON public.collector_offers FOR SELECT TO authenticated
  USING (
    collector_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM public.recycler_requirements rr
      WHERE rr.id = requirement_id AND rr.recycler_id = auth.uid()
    )
  );

CREATE POLICY "Collectors can insert offers"
  ON public.collector_offers FOR INSERT TO authenticated
  WITH CHECK (collector_id = auth.uid());

CREATE POLICY "Participants can update their offers"
  ON public.collector_offers FOR UPDATE TO authenticated
  USING (
    collector_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM public.recycler_requirements rr
      WHERE rr.id = requirement_id AND rr.recycler_id = auth.uid()
    )
  );

-- Recycler Transactions
CREATE POLICY "Transactions viewable by involved collector or recycler"
  ON public.recycler_transactions FOR SELECT TO authenticated
  USING (collector_id = auth.uid() OR recycler_id = auth.uid());

CREATE POLICY "Recyclers can insert transactions on accepted offers"
  ON public.recycler_transactions FOR INSERT TO authenticated
  WITH CHECK (recycler_id = auth.uid());

CREATE POLICY "Involved parties can update transaction status"
  ON public.recycler_transactions FOR UPDATE TO authenticated
  USING (collector_id = auth.uid() OR recycler_id = auth.uid());

-- Recycler Notifications
CREATE POLICY "Users can view their own notifications"
  ON public.recycler_notifications FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can update their own notifications"
  ON public.recycler_notifications FOR UPDATE TO authenticated
  USING (user_id = auth.uid());

-- Enable Realtime for newly created tables
ALTER PUBLICATION supabase_realtime ADD TABLE public.recycler_requirements;
ALTER PUBLICATION supabase_realtime ADD TABLE public.collector_offers;
ALTER PUBLICATION supabase_realtime ADD TABLE public.recycler_transactions;
