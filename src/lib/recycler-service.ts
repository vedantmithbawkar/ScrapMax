import { createClient } from '@/lib/supabase/client';
import {
  RecyclerProfile,
  RecyclerRequirement,
  CollectorOffer,
  RecyclerTransaction,
  TraceabilityRecord,
  RecyclerMaterial,
  RecyclerVerificationStatus,
} from '@/types';

// Storage keys for local reactive caching & offline fallback
const LOCAL_PROFILES_KEY = 'scrapmax_recycler_profiles';
const LOCAL_REQUIREMENTS_KEY = 'scrapmax_recycler_requirements';
const LOCAL_OFFERS_KEY = 'scrapmax_collector_offers';
const LOCAL_TRANSACTIONS_KEY = 'scrapmax_recycler_transactions';

// =========================================================================
// REALISTIC SEED DATA (With explicit Demo / Official Regulatory Labels)
// =========================================================================

export const SEED_RECYCLER_PROFILES: RecyclerProfile[] = [
  {
    id: 'rec-001',
    company_name: 'Green India E-Waste Solutions',
    business_type: 'Recycler',
    authorized_person_name: 'Vikram Joshi',
    designation: 'Managing Director',
    business_email: 'vikram@greenindia-recycling.demo',
    business_phone: '+91 98200 11223',
    registered_address: 'Plot 42, Wagle Industrial Estate, Road 16',
    facility_address: 'Wagle Industrial Estate, Sector 2, Thane (W)',
    city: 'Thane',
    state: 'Maharashtra',
    pincode: '400604',
    gstin: '27AAAAA0000A1Z5',
    pan: 'AAAAA0000A',
    registration_number: 'MPCB/RO-THANE/E-WASTE/2024/09',
    spcb: 'Maharashtra Pollution Control Board',
    cpcb_epr_id: 'CPCB/EPR-EWASTE/2023/MH-0192',
    verification_status: 'verified',
    verification_source: 'scrapmax_partner',
    verification_notes: 'Fully verified partner facility with automated scale telemetry.',
    active_requirements_count: 3,
    completed_transactions_count: 142,
    total_material_purchased_kg: 18450,
    created_at: new Date(Date.now() - 86400000 * 45).toISOString(),
    materials: [
      { recycler_id: 'rec-001', material: 'PCB', accepted: true, minimum_quantity_kg: 20 },
      { recycler_id: 'rec-001', material: 'Copper Cable', accepted: true, minimum_quantity_kg: 25 },
      { recycler_id: 'rec-001', material: 'Batteries', accepted: true, minimum_quantity_kg: 15 },
      { recycler_id: 'rec-001', material: 'Motors', accepted: true, minimum_quantity_kg: 30 },
      { recycler_id: 'rec-001', material: 'Mixed E-Waste', accepted: true, minimum_quantity_kg: 50 },
    ],
  },
  {
    id: 'rec-002',
    company_name: 'Eco-Metallics Refurbishers',
    business_type: 'Dismantler',
    authorized_person_name: 'Anita Shenoy',
    designation: 'Operations Lead',
    business_email: 'anita@ecometallics.demo',
    business_phone: '+91 98110 33445',
    registered_address: 'Andheri Kurla Road, Near Chakala Metro',
    facility_address: 'MIDC Central Road, Andheri East, Mumbai',
    city: 'Mumbai',
    state: 'Maharashtra',
    pincode: '400093',
    registration_number: 'MPCB/E-WASTE/DISM/2023/182',
    spcb: 'Maharashtra Pollution Control Board',
    verification_status: 'verified',
    verification_source: 'scrapmax_partner',
    active_requirements_count: 2,
    completed_transactions_count: 88,
    total_material_purchased_kg: 9200,
    created_at: new Date(Date.now() - 86400000 * 30).toISOString(),
    materials: [
      { recycler_id: 'rec-002', material: 'Aluminium', accepted: true, minimum_quantity_kg: 30 },
      { recycler_id: 'rec-002', material: 'Ferrous Metal', accepted: true, minimum_quantity_kg: 50 },
      { recycler_id: 'rec-002', material: 'Non-ferrous Metal', accepted: true, minimum_quantity_kg: 20 },
      { recycler_id: 'rec-002', material: 'Copper Cable', accepted: true, minimum_quantity_kg: 20 },
    ],
  },
  {
    id: 'rec-003',
    company_name: 'CleanEarth Circular Processors',
    business_type: 'Processor',
    authorized_person_name: 'Rajesh Patil',
    designation: 'Compliance Officer',
    business_email: 'rajesh@cleanearth-circ.demo',
    business_phone: '+91 97690 99887',
    registered_address: 'Turbhe MIDC, Navi Mumbai',
    facility_address: 'Plot 88, Sector 19, Turbhe, Navi Mumbai',
    city: 'Navi Mumbai',
    state: 'Maharashtra',
    pincode: '400705',
    registration_number: 'MPCB/NAVIMUMBAI/REG/2025/11',
    spcb: 'Maharashtra Pollution Control Board',
    verification_status: 'pending',
    verification_source: 'demo_data',
    active_requirements_count: 1,
    completed_transactions_count: 0,
    total_material_purchased_kg: 0,
    created_at: new Date().toISOString(),
    materials: [
      { recycler_id: 'rec-003', material: 'Mixed Plastics', accepted: true, minimum_quantity_kg: 50 },
      { recycler_id: 'rec-003', material: 'LCD', accepted: true, minimum_quantity_kg: 10 },
    ],
  },
  {
    id: 'rec-004',
    company_name: 'Apex Circular Metals (Public Regulatory Listing)',
    business_type: 'Recycler',
    authorized_person_name: 'Public Records Office',
    designation: 'Director',
    business_email: 'registry@cpcb-public.gov.in',
    business_phone: '+91 11 2230 5792',
    registered_address: 'Okhla Industrial Area, Phase II',
    facility_address: 'Okhla Phase II, New Delhi',
    city: 'Delhi',
    state: 'Delhi',
    pincode: '110020',
    spcb: 'Delhi Pollution Control Committee',
    cpcb_epr_id: 'CPCB/PUBLIC-DIR/DL/2022',
    verification_status: 'verified',
    verification_source: 'official_listing',
    verification_notes: 'Official public regulatory directory listing. Not a direct ScrapMax commercial partner.',
    active_requirements_count: 1,
    completed_transactions_count: 24,
    total_material_purchased_kg: 4200,
    created_at: new Date(Date.now() - 86400000 * 90).toISOString(),
    materials: [
      { recycler_id: 'rec-004', material: 'Copper Cable', accepted: true },
      { recycler_id: 'rec-004', material: 'Aluminium', accepted: true },
    ],
  },
];

export const SEED_REQUIREMENTS: RecyclerRequirement[] = [
  {
    id: 'req-001',
    recycler_id: 'rec-001',
    material: 'PCB',
    quantity_required_kg: 500,
    quantity_fulfilled_kg: 320,
    quantity_committed_kg: 320,
    offered_price_per_kg: 145,
    minimum_lot_kg: 20,
    collection_method: 'Recycler Pickup',
    city: 'Thane',
    area: 'Wagle Estate / MMR',
    pincode: '400604',
    quality_requirements: 'Circuit boards must be separated from bulky plastic casings. Motherboards & power supplies welcome.',
    status: 'Active',
    expires_at: new Date(Date.now() + 86400000 * 25).toISOString(),
    created_at: new Date(Date.now() - 86400000 * 5).toISOString(),
    recycler: SEED_RECYCLER_PROFILES[0],
    is_demo: true,
  },
  {
    id: 'req-002',
    recycler_id: 'rec-001',
    material: 'Copper Cable',
    quantity_required_kg: 1000,
    quantity_fulfilled_kg: 540,
    quantity_committed_kg: 540,
    offered_price_per_kg: 620,
    minimum_lot_kg: 25,
    collection_method: 'Both',
    city: 'Mumbai',
    area: 'Andheri East & Central',
    pincode: '400069',
    quality_requirements: 'PVC stripped or insulated copper cabling. Clean sorting preferred for maximum instant rate.',
    status: 'Active',
    expires_at: new Date(Date.now() + 86400000 * 20).toISOString(),
    created_at: new Date(Date.now() - 86400000 * 7).toISOString(),
    recycler: SEED_RECYCLER_PROFILES[0],
    is_demo: true,
  },
  {
    id: 'req-003',
    recycler_id: 'rec-002',
    material: 'Aluminium',
    quantity_required_kg: 750,
    quantity_fulfilled_kg: 510,
    quantity_committed_kg: 510,
    offered_price_per_kg: 180,
    minimum_lot_kg: 20,
    collection_method: 'Collector Delivery',
    city: 'Mumbai',
    area: 'Andheri / Sakinaka',
    pincode: '400072',
    quality_requirements: 'Extrusions, beverage cans, utensils, or sheet scrap. Free from concrete or steel rivets.',
    status: 'Active',
    expires_at: new Date(Date.now() + 86400000 * 15).toISOString(),
    created_at: new Date(Date.now() - 86400000 * 10).toISOString(),
    recycler: SEED_RECYCLER_PROFILES[1],
    is_demo: true,
  },
  {
    id: 'req-004',
    recycler_id: 'rec-001',
    material: 'Batteries',
    quantity_required_kg: 300,
    quantity_fulfilled_kg: 95,
    quantity_committed_kg: 95,
    offered_price_per_kg: 180,
    minimum_lot_kg: 15,
    collection_method: 'Recycler Pickup',
    city: 'Thane',
    area: 'MMR Region',
    pincode: '400601',
    quality_requirements: 'Lithium-ion battery packs, laptop packs, and lead-acid UPS batteries in leak-proof bins.',
    status: 'Active',
    expires_at: new Date(Date.now() + 86400000 * 18).toISOString(),
    created_at: new Date(Date.now() - 86400000 * 3).toISOString(),
    recycler: SEED_RECYCLER_PROFILES[0],
    is_demo: true,
  },
  {
    id: 'req-005',
    recycler_id: 'rec-004',
    material: 'Mixed E-Waste',
    quantity_required_kg: 1500,
    quantity_fulfilled_kg: 420,
    quantity_committed_kg: 420,
    offered_price_per_kg: 75,
    minimum_lot_kg: 50,
    collection_method: 'Both',
    city: 'Delhi',
    area: 'NCR South',
    pincode: '110020',
    quality_requirements: 'Telecom units, networking routers, monitors, and miscellaneous electronic chassis.',
    status: 'Active',
    expires_at: new Date(Date.now() + 86400000 * 30).toISOString(),
    created_at: new Date(Date.now() - 86400000 * 12).toISOString(),
    recycler: SEED_RECYCLER_PROFILES[3],
    is_demo: true,
  },
];

export const SEED_COLLECTOR_OFFERS: CollectorOffer[] = [
  {
    id: 'off-101',
    requirement_id: 'req-001',
    collector_id: 'coll-c102',
    quantity_offered_kg: 32,
    offered_price_per_kg: 145,
    estimated_value: 4640,
    status: 'pending',
    message: 'Sorted green & blue motherboards bundled in corrugated crates.',
    created_at: new Date(Date.now() - 3600000 * 2).toISOString(),
    requirement: SEED_REQUIREMENTS[0],
    collector: {
      id: 'coll-c102',
      full_name: 'Ramesh Kabadiwala (Collector #C102)',
      phone: '+91 98201 45892',
      role: 'collector',
      rating: 4.9,
      completed_pickups: 126,
    },
  },
  {
    id: 'off-102',
    requirement_id: 'req-001',
    collector_id: 'coll-c103',
    quantity_offered_kg: 62,
    offered_price_per_kg: 145,
    estimated_value: 8990,
    status: 'accepted',
    message: 'Server motherboard PCB scrap ready for pickup.',
    created_at: new Date(Date.now() - 86400000 * 2).toISOString(),
    requirement: SEED_REQUIREMENTS[0],
    collector: {
      id: 'coll-c103',
      full_name: 'Babu Bhai Scrap Centre (Collector #C103)',
      phone: '+91 98192 77889',
      role: 'collector',
      rating: 4.8,
      completed_pickups: 94,
    },
  },
  {
    id: 'off-103',
    requirement_id: 'req-001',
    collector_id: 'coll-c104',
    quantity_offered_kg: 35,
    offered_price_per_kg: 145,
    estimated_value: 5075,
    status: 'accepted',
    message: 'Desktop PCBs from refurbished hardware lot.',
    created_at: new Date(Date.now() - 86400000 * 4).toISOString(),
    requirement: SEED_REQUIREMENTS[0],
    collector: {
      id: 'coll-c104',
      full_name: 'Suresh Scrap Mart (Collector #C104)',
      phone: '+91 98334 11220',
      role: 'collector',
      rating: 4.9,
      completed_pickups: 156,
    },
  },
];

export const SEED_TRANSACTIONS: RecyclerTransaction[] = [
  {
    id: 'tx-10291',
    requirement_id: 'req-001',
    offer_id: 'off-103',
    collector_id: 'coll-c104',
    recycler_id: 'rec-001',
    material: 'PCB',
    agreed_quantity_kg: 35,
    agreed_price_per_kg: 145,
    actual_weight_kg: 34.2,
    final_amount: 4959,
    pickup_date: new Date(Date.now() - 86400000 * 3).toISOString().split('T')[0],
    pickup_time: '11:00 AM – 1:00 PM',
    pickup_method: 'Recycler Pickup',
    pickup_address: 'Shop 4, Station Road, Mulund West, Mumbai',
    pickup_status: 'Completed',
    payment_method: 'UPI',
    payment_status: 'Paid',
    collector_handover_confirmed: true,
    recycler_receipt_confirmed: true,
    status: 'completed',
    traceability_code: 'TRC-TX-10291',
    created_at: new Date(Date.now() - 86400000 * 3).toISOString(),
    collector: {
      id: 'coll-c104',
      full_name: 'Suresh Scrap Mart (Collector #C104)',
      phone: '+91 98334 11220',
      role: 'collector',
    },
    recycler: SEED_RECYCLER_PROFILES[0],
  },
  {
    id: 'tx-10292',
    requirement_id: 'req-001',
    offer_id: 'off-102',
    collector_id: 'coll-c103',
    recycler_id: 'rec-001',
    material: 'PCB',
    agreed_quantity_kg: 62,
    agreed_price_per_kg: 145,
    actual_weight_kg: 61.8,
    final_amount: 8961,
    pickup_date: new Date().toISOString().split('T')[0],
    pickup_time: '3:30 PM',
    pickup_method: 'Recycler Pickup',
    pickup_address: 'Babu Bhai Depot, Ghatkopar Industrial Estate',
    pickup_status: 'Driver Assigned',
    payment_method: 'UPI',
    payment_status: 'Pending',
    collector_handover_confirmed: false,
    recycler_receipt_confirmed: false,
    status: 'in_progress',
    traceability_code: 'TRC-TX-10292',
    created_at: new Date(Date.now() - 86400000).toISOString(),
    collector: {
      id: 'coll-c103',
      full_name: 'Babu Bhai Scrap Centre',
      phone: '+91 98192 77889',
      role: 'collector',
    },
    recycler: SEED_RECYCLER_PROFILES[0],
  },
];

// =========================================================================
// HELPER STORAGE FUNCTIONS
// =========================================================================

function getCached<T>(key: string, defaultVal: T[]): T[] {
  if (typeof window === 'undefined') return defaultVal;
  try {
    const raw = localStorage.getItem(key);
    if (!raw) {
      localStorage.setItem(key, JSON.stringify(defaultVal));
      return defaultVal;
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : defaultVal;
  } catch {
    return defaultVal;
  }
}

function setCached<T>(key: string, data: T[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (err) {
    console.warn('Storage save notice:', err);
  }
}

// =========================================================================
// SERVICE METHODS
// =========================================================================

/**
 * Loads all recycler facilities for directory and marketplace discovery.
 */
export async function getAllRecyclers(): Promise<RecyclerProfile[]> {
  try {
    const supabase = createClient();
    const { data, error } = await supabase.from('recycler_profiles').select('*, materials:recycler_materials(*)');
    if (!error && data && data.length > 0) {
      return data as RecyclerProfile[];
    }
  } catch {}
  return getCached<RecyclerProfile>(LOCAL_PROFILES_KEY, SEED_RECYCLER_PROFILES);
}

/**
 * Loads a single recycler's profile by ID.
 */
export async function getRecyclerProfile(id: string): Promise<RecyclerProfile | null> {
  try {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('recycler_profiles')
      .select('*, materials:recycler_materials(*)')
      .eq('id', id)
      .single();
    if (!error && data) return data as RecyclerProfile;
  } catch {}

  const all = getCached<RecyclerProfile>(LOCAL_PROFILES_KEY, SEED_RECYCLER_PROFILES);
  return all.find((p) => p.id === id) || all[0] || null;
}

/**
 * Saves or updates a recycler's facility profile.
 */
export async function upsertRecyclerProfile(profile: RecyclerProfile): Promise<RecyclerProfile> {
  const profileWithMeta: RecyclerProfile = {
    ...profile,
    updated_at: new Date().toISOString(),
  };

  try {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('recycler_profiles')
      .upsert(profileWithMeta)
      .select()
      .single();
    if (!error && data) return data as RecyclerProfile;
  } catch {}

  // Fallback to local cache
  const all = getCached<RecyclerProfile>(LOCAL_PROFILES_KEY, SEED_RECYCLER_PROFILES);
  const idx = all.findIndex((p) => p.id === profile.id);
  if (idx >= 0) {
    all[idx] = { ...all[idx], ...profileWithMeta };
  } else {
    all.unshift(profileWithMeta);
  }
  setCached(LOCAL_PROFILES_KEY, all);
  return profileWithMeta;
}

/**
 * Admin action: Verifies, rejects, or suspends a recycler.
 */
export async function updateRecyclerVerification(
  recyclerId: string,
  status: RecyclerVerificationStatus,
  notes?: string
): Promise<boolean> {
  try {
    const supabase = createClient();
    await supabase
      .from('recycler_profiles')
      .update({
        verification_status: status,
        verification_notes: notes || null,
        verified_at: status === 'verified' ? new Date().toISOString() : null,
      })
      .eq('id', recyclerId);
  } catch {}

  const all = getCached<RecyclerProfile>(LOCAL_PROFILES_KEY, SEED_RECYCLER_PROFILES);
  const updated = all.map((p) =>
    p.id === recyclerId
      ? {
          ...p,
          verification_status: status,
          verification_notes: notes || p.verification_notes,
          verified_at: status === 'verified' ? new Date().toISOString() : p.verified_at,
        }
      : p
  );
  setCached(LOCAL_PROFILES_KEY, updated);
  return true;
}

/**
 * Loads all active material requirements published by recyclers.
 */
export async function getRequirements(filters?: {
  material?: string;
  city?: string;
  recyclerId?: string;
}): Promise<RecyclerRequirement[]> {
  try {
    const supabase = createClient();
    let query = supabase.from('recycler_requirements').select('*, recycler:recycler_profiles(*)');
    if (filters?.material && filters.material !== 'all') {
      query = query.eq('material', filters.material);
    }
    if (filters?.city && filters.city !== 'all') {
      query = query.ilike('city', `%${filters.city}%`);
    }
    if (filters?.recyclerId) {
      query = query.eq('recycler_id', filters.recyclerId);
    }
    const { data, error } = await query.order('created_at', { ascending: false });
    if (!error && data && data.length > 0) {
      return data as RecyclerRequirement[];
    }
  } catch {}

  let list = getCached<RecyclerRequirement>(LOCAL_REQUIREMENTS_KEY, SEED_REQUIREMENTS);
  if (filters?.material && filters.material !== 'all') {
    list = list.filter((r) => r.material.toLowerCase() === filters.material?.toLowerCase());
  }
  if (filters?.city && filters.city !== 'all') {
    list = list.filter((r) => r.city.toLowerCase().includes(filters.city?.toLowerCase() || ''));
  }
  if (filters?.recyclerId) {
    list = list.filter((r) => r.recycler_id === filters.recyclerId);
  }
  return list;
}

/**
 * Loads a single requirement by ID with joined recycler details.
 */
export async function getRequirementById(id: string): Promise<RecyclerRequirement | null> {
  try {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('recycler_requirements')
      .select('*, recycler:recycler_profiles(*)')
      .eq('id', id)
      .single();
    if (!error && data) return data as RecyclerRequirement;
  } catch {}

  const all = getCached<RecyclerRequirement>(LOCAL_REQUIREMENTS_KEY, SEED_REQUIREMENTS);
  return all.find((r) => r.id === id) || null;
}

/**
 * Creates a new material requirement published by a verified recycler.
 */
export async function createRequirement(
  req: Omit<RecyclerRequirement, 'id' | 'created_at' | 'quantity_fulfilled_kg' | 'quantity_committed_kg'>
): Promise<RecyclerRequirement> {
  const newReq: RecyclerRequirement = {
    ...req,
    id: `req-${Date.now()}`,
    quantity_fulfilled_kg: 0,
    quantity_committed_kg: 0,
    created_at: new Date().toISOString(),
    status: req.status || 'Active',
  };

  try {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('recycler_requirements')
      .insert(newReq)
      .select()
      .single();
    if (!error && data) return data as RecyclerRequirement;
  } catch {}

  const all = getCached<RecyclerRequirement>(LOCAL_REQUIREMENTS_KEY, SEED_REQUIREMENTS);
  all.unshift(newReq);
  setCached(LOCAL_REQUIREMENTS_KEY, all);
  return newReq;
}

/**
 * Submits an offer from a collector to an active recycler requirement.
 */
export async function submitCollectorOffer(
  offer: Omit<CollectorOffer, 'id' | 'created_at' | 'status'>
): Promise<CollectorOffer> {
  // Validate lot size and remaining capacity
  const req = await getRequirementById(offer.requirement_id);
  if (req) {
    const remaining = Math.max(0, req.quantity_required_kg - req.quantity_fulfilled_kg);
    if (offer.quantity_offered_kg < (req.minimum_lot_kg || 1)) {
      throw new Error(`Minimum lot size is ${req.minimum_lot_kg} KG.`);
    }
    if (remaining <= 0) {
      throw new Error('This material requirement has already been fully fulfilled.');
    }
  }

  const newOffer: CollectorOffer = {
    ...offer,
    id: `off-${Date.now()}`,
    status: 'pending',
    created_at: new Date().toISOString(),
  };

  try {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('collector_offers')
      .insert(newOffer)
      .select()
      .single();
    if (!error && data) return data as CollectorOffer;
  } catch {}

  const all = getCached<CollectorOffer>(LOCAL_OFFERS_KEY, SEED_COLLECTOR_OFFERS);
  all.unshift(newOffer);
  setCached(LOCAL_OFFERS_KEY, all);
  return newOffer;
}

/**
 * Gets incoming collector offers for a recycler's active requirements.
 */
export async function getIncomingOffers(recyclerId?: string): Promise<CollectorOffer[]> {
  try {
    const supabase = createClient();
    let query = supabase.from('collector_offers').select('*, requirement:recycler_requirements(*), collector:profiles(*)');
    if (recyclerId) {
      query = query.eq('requirement.recycler_id', recyclerId);
    }
    const { data, error } = await query.order('created_at', { ascending: false });
    if (!error && data && data.length > 0) {
      return data as CollectorOffer[];
    }
  } catch {}

  const all = getCached<CollectorOffer>(LOCAL_OFFERS_KEY, SEED_COLLECTOR_OFFERS);
  if (recyclerId) {
    return all.filter((o) => o.requirement?.recycler_id === recyclerId || !o.requirement?.recycler_id);
  }
  return all;
}

/**
 * Gets offers submitted by a specific collector.
 */
export async function getCollectorOffers(collectorId: string): Promise<CollectorOffer[]> {
  try {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('collector_offers')
      .select('*, requirement:recycler_requirements(*)')
      .eq('collector_id', collectorId)
      .order('created_at', { ascending: false });
    if (!error && data && data.length > 0) {
      return data as CollectorOffer[];
    }
  } catch {}

  const all = getCached<CollectorOffer>(LOCAL_OFFERS_KEY, SEED_COLLECTOR_OFFERS);
  return all.filter((o) => o.collector_id === collectorId);
}

/**
 * Responds to a collector offer: Accept, Reject (with reason), or Counter Offer.
 */
export async function respondToOffer(
  offerId: string,
  action: 'accept' | 'reject' | 'counter',
  payload?: {
    rejection_reason?: string;
    counter_price?: number;
    counter_quantity?: number;
    counter_notes?: string;
  }
): Promise<{ offer: CollectorOffer; transaction?: RecyclerTransaction }> {
  const allOffers = getCached<CollectorOffer>(LOCAL_OFFERS_KEY, SEED_COLLECTOR_OFFERS);
  const targetOffer = allOffers.find((o) => o.id === offerId);
  if (!targetOffer) {
    throw new Error('Offer not found.');
  }

  let transaction: RecyclerTransaction | undefined;

  if (action === 'accept') {
    targetOffer.status = 'accepted';
    targetOffer.updated_at = new Date().toISOString();

    // Oversell protection: compute remaining requirement capacity
    const req = await getRequirementById(targetOffer.requirement_id);
    if (req) {
      const remaining = Math.max(0, req.quantity_required_kg - req.quantity_fulfilled_kg);
      if (remaining <= 0) {
        throw new Error('Requirement is already fulfilled.');
      }
      const acceptedQty = Math.min(targetOffer.quantity_offered_kg, remaining);

      // Create linked transaction
      transaction = {
        id: `tx-${Date.now()}`,
        requirement_id: targetOffer.requirement_id,
        offer_id: targetOffer.id,
        collector_id: targetOffer.collector_id,
        recycler_id: req.recycler_id,
        material: req.material,
        agreed_quantity_kg: acceptedQty,
        agreed_price_per_kg: targetOffer.offered_price_per_kg,
        pickup_method: req.collection_method === 'Collector Delivery' ? 'Collector Delivery' : 'Recycler Pickup',
        pickup_status: 'Scheduled',
        payment_method: 'UPI',
        payment_status: 'Pending',
        collector_handover_confirmed: false,
        recycler_receipt_confirmed: false,
        status: 'in_progress',
        traceability_code: `TRC-TX-${Math.floor(10000 + Math.random() * 90000)}`,
        created_at: new Date().toISOString(),
        collector: targetOffer.collector,
        recycler: req.recycler,
        requirement: req,
      };

      // Update requirement committed/fulfilled progress
      const allReqs = getCached<RecyclerRequirement>(LOCAL_REQUIREMENTS_KEY, SEED_REQUIREMENTS);
      const reqIdx = allReqs.findIndex((r) => r.id === req.id);
      if (reqIdx >= 0) {
        allReqs[reqIdx].quantity_committed_kg = (allReqs[reqIdx].quantity_committed_kg || 0) + acceptedQty;
        setCached(LOCAL_REQUIREMENTS_KEY, allReqs);
      }

      // Add to transactions cache
      const allTxs = getCached<RecyclerTransaction>(LOCAL_TRANSACTIONS_KEY, SEED_TRANSACTIONS);
      allTxs.unshift(transaction);
      setCached(LOCAL_TRANSACTIONS_KEY, allTxs);
    }
  } else if (action === 'reject') {
    targetOffer.status = 'rejected';
    targetOffer.rejection_reason = payload?.rejection_reason || 'Not specified';
    targetOffer.updated_at = new Date().toISOString();
  } else if (action === 'counter') {
    targetOffer.status = 'counter_offered';
    targetOffer.counter_price_per_kg = payload?.counter_price;
    targetOffer.counter_quantity_kg = payload?.counter_quantity;
    targetOffer.counter_notes = payload?.counter_notes;
    targetOffer.updated_at = new Date().toISOString();
  }

  setCached(LOCAL_OFFERS_KEY, allOffers);
  return { offer: targetOffer, transaction };
}

/**
 * Gets all transactions for a recycler or collector.
 */
export async function getRecyclerTransactions(userId?: string): Promise<RecyclerTransaction[]> {
  try {
    const supabase = createClient();
    let query = supabase.from('recycler_transactions').select('*, collector:profiles(*), recycler:recycler_profiles(*), requirement:recycler_requirements(*)');
    if (userId) {
      query = query.or(`collector_id.eq.${userId},recycler_id.eq.${userId}`);
    }
    const { data, error } = await query.order('created_at', { ascending: false });
    if (!error && data && data.length > 0) {
      return data as RecyclerTransaction[];
    }
  } catch {}

  const all = getCached<RecyclerTransaction>(LOCAL_TRANSACTIONS_KEY, SEED_TRANSACTIONS);
  if (userId) {
    return all.filter((t) => t.collector_id === userId || t.recycler_id === userId);
  }
  return all;
}

/**
 * Records confirmed actual weight at pickup scale and strictly calculates final amount.
 */
export async function confirmActualWeight(
  transactionId: string,
  actualWeightKg: number
): Promise<RecyclerTransaction> {
  const all = getCached<RecyclerTransaction>(LOCAL_TRANSACTIONS_KEY, SEED_TRANSACTIONS);
  const tx = all.find((t) => t.id === transactionId);
  if (!tx) throw new Error('Transaction not found');

  const finalAmount = Math.round(actualWeightKg * tx.agreed_price_per_kg);
  tx.actual_weight_kg = actualWeightKg;
  tx.final_amount = finalAmount;
  tx.pickup_status = 'Arrived';
  tx.updated_at = new Date().toISOString();

  setCached(LOCAL_TRANSACTIONS_KEY, all);
  return tx;
}

/**
 * Records demo payment settlement.
 */
export async function recordRecyclerPayment(
  transactionId: string,
  method: 'UPI' | 'CASH' | 'BANK_TRANSFER' | 'OTHER'
): Promise<RecyclerTransaction> {
  const all = getCached<RecyclerTransaction>(LOCAL_TRANSACTIONS_KEY, SEED_TRANSACTIONS);
  const tx = all.find((t) => t.id === transactionId);
  if (!tx) throw new Error('Transaction not found');

  tx.payment_method = method;
  tx.payment_status = 'Paid';
  tx.updated_at = new Date().toISOString();

  setCached(LOCAL_TRANSACTIONS_KEY, all);
  return tx;
}

/**
 * Confirms physical handover by Collector or receipt by Recycler.
 * Moves to 'completed' when both parties have confirmed.
 */
export async function confirmHandover(
  transactionId: string,
  party: 'collector' | 'recycler'
): Promise<RecyclerTransaction> {
  const all = getCached<RecyclerTransaction>(LOCAL_TRANSACTIONS_KEY, SEED_TRANSACTIONS);
  const tx = all.find((t) => t.id === transactionId);
  if (!tx) throw new Error('Transaction not found');

  if (party === 'collector') {
    tx.collector_handover_confirmed = true;
  } else {
    tx.recycler_receipt_confirmed = true;
  }

  // If both confirmed, complete transaction and update requirement fulfilled quantity
  if (tx.collector_handover_confirmed && tx.recycler_receipt_confirmed) {
    tx.status = 'completed';
    tx.pickup_status = 'Completed';

    const fulfilledWeight = tx.actual_weight_kg || tx.agreed_quantity_kg;
    const allReqs = getCached<RecyclerRequirement>(LOCAL_REQUIREMENTS_KEY, SEED_REQUIREMENTS);
    const reqIdx = allReqs.findIndex((r) => r.id === tx.requirement_id);
    if (reqIdx >= 0) {
      allReqs[reqIdx].quantity_fulfilled_kg += fulfilledWeight;
      if (allReqs[reqIdx].quantity_fulfilled_kg >= allReqs[reqIdx].quantity_required_kg) {
        allReqs[reqIdx].status = 'Fulfilled';
      }
      setCached(LOCAL_REQUIREMENTS_KEY, allReqs);
    }
  }

  tx.updated_at = new Date().toISOString();
  setCached(LOCAL_TRANSACTIONS_KEY, all);
  return tx;
}

/**
 * Generates or retrieves circular traceability chain of custody record.
 */
export function getTraceabilityRecord(tx: RecyclerTransaction): TraceabilityRecord {
  const weight = tx.actual_weight_kg || tx.agreed_quantity_kg;
  const collectorName = tx.collector?.full_name || 'Verified Scrap Collector';
  const recyclerName = tx.recycler?.company_name || 'Green India E-Waste Solutions';

  return {
    transaction_id: tx.id,
    traceability_code: tx.traceability_code || `TRC-${tx.id.toUpperCase()}`,
    material: tx.material,
    confirmed_weight_kg: weight,
    origin_collector: {
      name: collectorName,
      city: tx.pickup_address || 'Mumbai MMR',
    },
    destination_facility: {
      name: recyclerName,
      city: tx.recycler?.city || 'Thane',
      registration_number: tx.recycler?.registration_number || 'MPCB/E-WASTE/2024',
    },
    steps: [
      {
        step: 1,
        title: 'Source Collection & Aggregation',
        description: `Sourced ${weight} KG ${tx.material} by local collector. Initial inspection passed.`,
        timestamp: tx.created_at,
        actor: collectorName,
        status: 'completed',
      },
      {
        step: 2,
        title: 'ScrapMax Matching & Offer Acceptance',
        description: `Matched with ${recyclerName} at agreed rate of ₹${tx.agreed_price_per_kg}/KG.`,
        timestamp: tx.created_at,
        actor: 'ScrapMax Protocol',
        status: 'completed',
      },
      {
        step: 3,
        title: 'Transit & Scheduled Pickup',
        description: `${tx.pickup_method} logistics dispatched. Sealed bin transport.`,
        timestamp: tx.pickup_date || tx.created_at,
        actor: 'Logistics Fleet',
        status: tx.pickup_status === 'Completed' ? 'completed' : 'current',
      },
      {
        step: 4,
        title: 'Electronic Scale Weight Verification',
        description: `Digital weighing scale verified net weight of ${weight} KG. Settlement value calculated to ₹${tx.final_amount || Math.round(weight * tx.agreed_price_per_kg)}.`,
        timestamp: tx.updated_at || tx.created_at,
        actor: 'Calibrated Scale Telemetry',
        status: tx.actual_weight_kg ? 'completed' : 'pending',
      },
      {
        step: 5,
        title: 'Instant Digital Payment Settlement',
        description: `Settled via ${tx.payment_method}. Transaction receipt finalized.`,
        timestamp: tx.updated_at || tx.created_at,
        actor: 'Payment Gateway (Demo)',
        status: tx.payment_status === 'Paid' ? 'completed' : 'pending',
      },
      {
        step: 6,
        title: 'Facility Custody Handover',
        description: 'Mutual digital signatures verified. Material ingested into facility buffer.',
        timestamp: tx.updated_at || tx.created_at,
        actor: recyclerName,
        status: tx.status === 'completed' ? 'completed' : 'pending',
      },
      {
        step: 7,
        title: 'Circular Recycling & Batch Processing',
        description: 'Ingested into circular recovery process. Zero-landfill certificate issued.',
        timestamp: tx.updated_at || tx.created_at,
        actor: 'Processing Facility Unit 1',
        status: tx.status === 'completed' ? 'completed' : 'pending',
      },
    ],
    emissions_prevented_co2_kg: Math.round(weight * 2.8),
    circular_recycling_batch: `BATCH-${tx.id.substring(0, 8).toUpperCase()}-CIRC`,
  };
}

/**
 * Calculates B2B analytics metrics for a recycler.
 */
export async function getRecyclerAnalytics(recyclerId?: string) {
  const txs = await getRecyclerTransactions(recyclerId);
  const reqs = await getRequirements({ recyclerId });
  const completedTxs = txs.filter((t) => t.status === 'completed');

  const totalKg = completedTxs.reduce((sum, t) => sum + (t.actual_weight_kg || t.agreed_quantity_kg), 0);
  const totalSpend = completedTxs.reduce((sum, t) => sum + (t.final_amount || (t.agreed_quantity_kg * t.agreed_price_per_kg)), 0);
  const avgPricePerKg = totalKg > 0 ? Math.round(totalSpend / totalKg) : 0;

  // Material distribution
  const materialDist: Record<string, number> = {};
  completedTxs.forEach((t) => {
    materialDist[t.material] = (materialDist[t.material] || 0) + (t.actual_weight_kg || t.agreed_quantity_kg);
  });

  return {
    totalMaterialPurchasedKg: totalKg,
    totalSpend,
    avgPricePerKg,
    activeRequirementsCount: reqs.filter((r) => r.status === 'Active').length,
    fulfilledRequirementsCount: reqs.filter((r) => r.status === 'Fulfilled').length,
    pendingOffersCount: (await getIncomingOffers(recyclerId)).filter((o) => o.status === 'pending').length,
    completedTransactionsCount: completedTxs.length,
    totalSuppliersCount: new Set(completedTxs.map((t) => t.collector_id)).size,
    materialDistribution: materialDist,
  };
}

/**
 * Gets suppliers (collectors) who have transacted with the recycler.
 */
export async function getRecyclerSuppliers(recyclerId?: string) {
  const txs = await getRecyclerTransactions(recyclerId);
  const suppliersMap: Record<
    string,
    {
      collector: { id: string; name: string; phone?: string; rating?: number };
      totalQuantityKg: number;
      completedTransactions: number;
      materials: Set<string>;
      lastTransactionDate: string;
    }
  > = {};

  txs.forEach((t) => {
    const cid = t.collector_id;
    if (!suppliersMap[cid]) {
      suppliersMap[cid] = {
        collector: {
          id: cid,
          name: t.collector?.full_name || `Collector #${cid.substring(0, 5)}`,
          phone: t.collector?.phone,
          rating: t.collector?.rating || 4.8,
        },
        totalQuantityKg: 0,
        completedTransactions: 0,
        materials: new Set<string>(),
        lastTransactionDate: t.created_at,
      };
    }

    suppliersMap[cid].totalQuantityKg += t.actual_weight_kg || t.agreed_quantity_kg;
    if (t.status === 'completed') {
      suppliersMap[cid].completedTransactions += 1;
    }
    suppliersMap[cid].materials.add(t.material);
    if (new Date(t.created_at) > new Date(suppliersMap[cid].lastTransactionDate)) {
      suppliersMap[cid].lastTransactionDate = t.created_at;
    }
  });

  return Object.values(suppliersMap).map((s) => ({
    ...s,
    materials: Array.from(s.materials) as RecyclerMaterial[],
  }));
}
